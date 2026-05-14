import express from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import authRouter from './routes/auth.js';
import pollsRouter from './routes/polls.js';
import responsesRouter from './routes/responses.js';
import analyticsRouter from './routes/analytics.js';

const PgStore = connectPg(session);
const app = express();

// --- RATE LIMITING ---

// 1. General Limiter: Prevents a single IP from spamming the whole site.
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Very high for dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// 2. Auth Limiter: Much stricter. Prevents password guessing.
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Increased for dev
  message: { error: 'Too many login attempts. Please wait a minute.' }
});

// 3. Vote Limiter: Prevents bot-spamming responses.
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Increased for dev
  message: { error: 'Slow down! You are voting too fast.' }
});

// Apply general limiter to ALL routes
app.use(generalLimiter);

// Allow the React frontend to make requests with credentials (cookies)
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Tell Express to trust the proxy (Azure) so secure cookies work properly
app.set('trust proxy', 1);

// Set up PostgreSQL-backed sessions
app.use(session({
  store: new PgStore({
    conString: process.env.DB_URL,
    // Automatically creates the 'session' table in Postgres if it doesn't exist
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Prevents creating empty sessions for anonymous visitors
  cookie: {
    httpOnly: true, // Prevents JavaScript from reading the cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' is required for cross-domain cookies
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));

// Mount the Auth routes (with extra security)
app.use('/auth', authLimiter, authRouter);

// Mount the Poll routes
app.use('/api/polls', pollsRouter);

// Mount the Responses routes (with anti-spam)
app.use('/api/responses', voteLimiter, responsesRouter);

// Mount the Analytics routes
app.use('/api/analytics', analyticsRouter);

// Temporary route to check if a user is logged in
app.get('/api/me', (req, res) => {
  if (req.session.userId) {
    res.json({ id: req.session.userId, name: req.session.userName });
  } else {
    res.status(401).json({ error: 'Unauthenticated' });
  }
});

export default app;
