import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema:    './db/schema.js',
  out:       './db/migrations',
  dialect:   'postgresql',
  dbCredentials: { url: process.env.DB_URL },
});
