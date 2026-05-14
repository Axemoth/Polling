import { Issuer, generators, custom } from 'openid-client';

let googleClient;

export async function initOidc() {
  // 1. Google Setup
  try {
    const googleIssuer = await Issuer.discover('https://accounts.google.com');
    googleClient = new googleIssuer.Client({
      client_id:      process.env.GOOGLE_CLIENT_ID,
      client_secret:  process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris:  [process.env.GOOGLE_REDIRECT_URI],
      response_types: ['code'],
    });
    googleClient[custom.clock_tolerance] = 300; // 5 minute clock skew allowance
  } catch (err) {
    console.error("Warning: Failed to initialize Google OIDC. Check credentials.");
  }
}

export function getGoogleClient() { return googleClient; }

export { generators };
