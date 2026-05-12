import { Issuer, generators } from 'openid-client';

let oidcClient;

export async function initOidc() {
  const issuerUrl = process.env.OIDC_ISSUER_URL || 'https://accounts.google.com';
  
  // 1. Discovery: Connect to the provider to fetch its configuration
  const issuer = await Issuer.discover(issuerUrl);
  
  // Apply manual overrides ONLY if we are using the Axemoth provider
  // (This handles the 'localhost' discovery issue on your Azure deployment)
  if (issuerUrl.includes('axemoth.com')) {
    issuer.metadata.authorization_endpoint = 'https://oidc.axemoth.com/authorize';
    issuer.metadata.token_endpoint = 'https://api.axemoth.com/token';
    issuer.metadata.userinfo_endpoint = 'https://api.axemoth.com/userinfo';
    issuer.metadata.jwks_uri = 'https://api.axemoth.com/.well-known/jwks.json';
  }
  
  // 2. Client Setup
  oidcClient = new issuer.Client({
    client_id:      process.env.OIDC_CLIENT_ID,
    client_secret:  process.env.OIDC_CLIENT_SECRET,
    redirect_uris:  [process.env.OIDC_REDIRECT_URI],
    response_types: ['code'],
  });
}

export function getOidcClient() {
  return oidcClient;
}

export { generators };
