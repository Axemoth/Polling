import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { initOidc } from './lib/oidc.js';

const server = http.createServer(app);

console.log('Initializing OIDC Discovery...');

// We must wait for OIDC discovery to complete before the server starts accepting requests.
// Otherwise, the /auth/login route will fail because `oidcClient` won't be initialized yet.
await initOidc().catch((err) => {
  console.error('Failed to initialize OIDC configuration:', err);
  process.exit(1);
});

console.log('OIDC Discovery complete.');

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
