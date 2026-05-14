import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getGoogleClient, generators } from '../lib/oidc.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// ==========================================
// 1. LOCAL AUTH (Email/Password)
// ==========================================

router.post('/local/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long' });

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) return res.status(409).json({ error: 'Email already in use' });

  // Hash the password securely
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert new user
  const [user] = await db.insert(users).values({
    name,
    email,
    passwordHash,
  }).returning();

  // Log them in
  req.session.userId = user.id;
  req.session.userName = user.name;
  
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session save failed' });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  });
});

router.post('/local/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Find user by email
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  // If user signed up via OIDC and never set a password
  if (!user.passwordHash) {
    return res.status(401).json({ error: 'Please log in with your provider (Google/Axemoth)' });
  }

  // Verify the password hash
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

  // Log them in
  req.session.userId = user.id;
  req.session.userName = user.name;

  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session save failed' });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  });
});


// ==========================================
// 2. OIDC AUTH (Google/Axemoth)
// ==========================================

// --- Helper to handle OIDC Login ---
function handleOidcLogin(client, req, res) {
  if (!client) return res.status(500).send("OIDC Client not initialized.");
  const state  = generators.state();
  const nonce  = generators.nonce();
  
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);

  req.session.oidcState = state;
  req.session.oidcNonce = nonce;
  req.session.oidcCodeVerifier = code_verifier;

  const url = client.authorizationUrl({
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge,
    code_challenge_method: 'S256',
  });

  res.redirect(url);
}

// --- Helper to handle OIDC Callback ---
async function handleOidcCallback(client, redirectUri, req, res) {
  if (!client) return res.status(500).send("OIDC Client not initialized.");
  const params = client.callbackParams(req);

  try {
    const tokenSet = await client.callback(
      redirectUri,
      params,
      { 
        state: req.session.oidcState, 
        nonce: req.session.oidcNonce,
        code_verifier: req.session.oidcCodeVerifier 
      }
    );

    const claims = tokenSet.claims();
    if (!claims.email) throw new Error('Provider did not return an email address');

    // 1. Account Linking: Look them up by EMAIL first, not sub.
    const existing = await db.select().from(users).where(eq(users.email, claims.email));
    let user = existing[0];

    if (user) {
      if (!user.sub) {
        const [updatedUser] = await db.update(users)
          .set({ sub: claims.sub })
          .where(eq(users.id, user.id))
          .returning();
        user = updatedUser;
      }
    } else {
      // 2. Just-In-Time Provisioning: Create a brand new user
      const [created] = await db.insert(users).values({
        sub:   claims.sub,
        email: claims.email,
        name:  claims.name,
      }).returning();
      user = created;
    }

    // Set the session
    req.session.userId   = user.id;
    req.session.userName = user.name;
    
    // Cleanup
    delete req.session.oidcState;
    delete req.session.oidcNonce;
    delete req.session.oidcCodeVerifier;

    res.redirect(process.env.CLIENT_URL + '/dashboard');
  } catch (error) {
    console.error('OIDC Callback Error:', error);
    res.status(500).send('Authentication Failed');
  }
}

// Google Routes
router.get('/google', (req, res) => handleOidcLogin(getGoogleClient(), req, res));
router.get('/google/callback', (req, res) => handleOidcCallback(getGoogleClient(), process.env.GOOGLE_REDIRECT_URI, req, res));



// ==========================================
// 3. LOGOUT (Shared)
// ==========================================
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect(process.env.CLIENT_URL || '/');
  });
});

export default router;
