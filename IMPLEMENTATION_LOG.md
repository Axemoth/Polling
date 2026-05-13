# Poll Platform — Implementation Log

> **Purpose:** This file is a living document. Every time we implement something, we record *what* we built, *why* we made certain decisions, and *how* the core code works. Think of it as a combined dev diary + code walkthrough.

---

## Table of Contents

1. [Project Bootstrap](#1-project-bootstrap)
2. [Docker + PostgreSQL](#2-docker--postgresql)
3. [Database Schema](#3-database-schema)
4. [Drizzle ORM Setup](#4-drizzle-orm-setup)
5. [OIDC Authentication](#5-oidc-authentication)
6. [Session Middleware](#6-session-middleware)
7. [Hybrid Auth (Local + OIDC)](#7-hybrid-auth-local--oidc)
8. [Poll CRUD Routes](#8-poll-crud-routes)
9. [Response Engine](#9-response-engine)
10. [Analytics Routes](#10-analytics-routes)
11. [Socket.io Real-time](#11-socketio-real-time)
12. [Expiry Cron Job](#12-expiry-cron-job)
13. [Rate Limiting & Security](#13-rate-limiting--security)
14. [Frontend Setup](#14-frontend-setup) *(pending)*

---

## 1. Project Bootstrap

### Date: 2026-05-13

### What we set up

The monorepo has two top-level folders:

```
poll-platform/
├── client/     ← React (Vite) frontend
└── server/     ← Express backend (Node.js)
```

The only file that exists so far is `server/package.json`.

---

### `server/package.json` — Explained

```json
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

#### Key field: `"type": "module"`

This is **the most important field** in the backend's `package.json`.

| Without it | With it |
|---|---|
| Node.js treats `.js` files as CommonJS | Node.js treats `.js` files as ES Modules |
| You use `require()` / `module.exports` | You use `import` / `export` |
| Older Node.js style | Modern JavaScript standard |

**Why we use it:** The entire plan is written with `import/export` syntax (e.g., `import { Router } from 'express'`). Setting `"type": "module"` lets us use this syntax in every `.js` file in the `server/` folder without needing `.mjs` extensions or Babel.

> ⚠️ **Gotcha:** When `"type": "module"` is set, all local imports **must include the file extension**: `import foo from './foo.js'` — NOT `import foo from './foo'`. Node won't resolve bare paths in ESM mode.

---

---

## 2. Docker + PostgreSQL

### Date: 2026-05-13

### What we set up

A `docker-compose.yml` at the project root that spins up a local PostgreSQL 16 database. This means **you don't need to install Postgres on your machine** — Docker manages the whole thing.

**File:** `poll-platform/docker-compose.yml`

---

### The full file — explained line by line

```yaml
services:
  postgres:
    image: postgres:16-alpine
```
- `services` — defines all containers Docker will manage.
- `postgres` — our service name (we can reference it by this name inside the Docker network).
- `image: postgres:16-alpine` — uses the official PostgreSQL 16 image built on Alpine Linux. Alpine is a minimal Linux distro, so the image is much smaller (~50 MB vs ~200 MB for the full image). Always pin a major version (`16`) so you don't get surprised by a breaking upgrade.

```yaml
    container_name: poll_platform_db
    restart: unless-stopped
```
- `container_name` — gives the container a fixed, predictable name instead of a random Docker-generated one. Useful when you want to connect to it with `docker exec`.
- `restart: unless-stopped` — Docker automatically restarts the container if it crashes, but **not** if you manually stopped it with `docker stop`. Perfect for local dev.

```yaml
    environment:
      POSTGRES_USER: polluser
      POSTGRES_PASSWORD: pollpassword
      POSTGRES_DB: polldb
```
These three environment variables are read by the official Postgres image on first startup to **initialize the database**:
- `POSTGRES_USER` → creates this superuser
- `POSTGRES_PASSWORD` → sets their password
- `POSTGRES_DB` → creates this database and makes `polluser` its owner

These map directly to your `DB_URL` in `server/.env`:
```
DB_URL=postgresql://polluser:pollpassword@localhost:5432/polldb
```

```yaml
    ports:
      - "5432:5432"
```
- Format is `"HOST_PORT:CONTAINER_PORT"`.
- PostgreSQL listens on port **5432** inside the container. We expose it on **5432** on your local machine so `server/.env` can connect to it at `localhost:5432`.

```yaml
    volumes:
      - postgres_data:/var/lib/postgresql/data
```
- Without this, **all your data disappears when the container stops**.
- This mounts a named Docker volume (`postgres_data`) to the path where Postgres stores its data files inside the container.
- Docker manages the volume on your host machine; it persists between `docker compose down` and `docker compose up`.

```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U polluser -d polldb"]
      interval: 10s
      timeout: 5s
      retries: 5
```
- `pg_isready` is a Postgres CLI tool that checks if the server is accepting connections.
- Docker polls this every **10 seconds**. If it fails **5 times in a row**, the container is marked `unhealthy`.
- This is critical because Postgres takes a few seconds to fully start after the container is `running`. Without a healthcheck, your app might try to connect before Postgres is ready.

```yaml
volumes:
  postgres_data:
    driver: local
```
- Declares the named volume at the top level so Docker knows to manage it.
- `driver: local` means it's stored on your local machine's disk (default behaviour).

---

### Commands to use it

```bash
# Start the database (detached / background)
docker compose up -d

# Check it's running and healthy
docker compose ps

# Connect directly with psql (optional)
docker exec -it poll_platform_db psql -U polluser -d polldb

# Stop the database (data is preserved in the volume)
docker compose down

# Nuke everything including the volume (fresh start)
docker compose down -v
```

> ⚠️ **Never run `docker compose down -v` on production data** — `-v` deletes the volume and all data in it permanently.

---

## 3. Database Schema

### Date: 2026-05-13

### What we set up

We defined our entire PostgreSQL database structure in JavaScript using **Drizzle ORM**.

**File:** `server/db/schema.js`

Our database has 6 tables:
1. `users`: Stores user identity via OIDC. No password hash, just a unique `sub` (subject identifier from the OIDC provider).
2. `polls`: Represents a poll. Has a `publicSlug` (e.g. `V1StGXR8`) so we don't expose internal UUIDs in the URL.
3. `questions`: Linked to a poll. Has `orderIndex` to preserve the display order.
4. `options`: Linked to a question. (We only support single-choice options for now).
5. `responses`: Represents a single submission. It handles both *authenticated* users (`respondentId`) and *anonymous* users (`sessionToken`).
6. `answers`: The individual selected options for a response.

### Drizzle Relations Explained

At the bottom of `schema.js`, we define `relations`. Example:
```javascript
export const pollsRelations = relations(polls, ({ one, many }) => ({
  creator:   one(users,     { fields: [polls.creatorId],   references: [users.id] }),
  questions: many(questions),
  responses: many(responses),
}));
```
**Why this matters:** This isn't creating foreign keys in SQL (the `references()` method on columns does that). This configures Drizzle's **Relational Query API**. It allows us to easily fetch a poll along with all its questions and options in a single JS object without writing complex SQL `JOIN` syntax.

---

## 4. Drizzle ORM Setup

### Date: 2026-05-13

### What we set up

We configured Drizzle to talk to our PostgreSQL Docker container, generated the SQL files, and applied them.

**Files Created:**
- `server/.env`: Contains `DB_URL` mapping to our Docker setup.
- `server/db/index.js`: Instantiates the `pg.Pool` and the Drizzle client (`export const db = drizzle(pool, { schema });`).
- `server/drizzle.config.js`: Tells `drizzle-kit` where our schema is and where to output migrations.

### How Migrations Work

Instead of writing SQL `CREATE TABLE` scripts by hand:
1. We define the schema in JS (`schema.js`).
2. Run `npx drizzle-kit generate` → This compares the JS schema to the current `db/migrations` folder and generates a new `.sql` file (e.g., `0000_clean_the_order.sql`).
3. Run `npx drizzle-kit migrate` → This connects to the database via `DB_URL` and executes the new SQL file.

**We successfully ran these commands and the tables are now live in our local PostgreSQL database.**

---

## 5. OIDC Authentication

### Date: 2026-05-13

### What we set up

We implemented the OAuth 2.0 / OpenID Connect login flow using `openid-client` to integrate the Poll Platform with the **Axemoth Identity Provider**. 

**Files Created:**
- `server/.env` (Updated with Axemoth `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET`)
- `server/lib/oidc.js` (OIDC configuration and discovery)
- `server/routes/auth.js` (The Express routes handling the login redirects)

### How the Flow Works (Step-by-Step)

The Axemoth Identity Provider enforces **PKCE** (Proof Key for Code Exchange), which provides an extra layer of security. Our flow respects that:

1. **User clicks "Login"**: The frontend redirects the user to our backend at `http://localhost:4000/auth/login`.
2. **`GET /auth/login`**:
    - We generate a PKCE `code_verifier` (a random secret) and hash it into a `code_challenge`.
    - We temporarily store the `code_verifier` in the user's backend session.
    - We redirect the user's browser to the Axemoth login screen, passing along our `client_id`, the `redirect_uri`, and the `code_challenge`.
3. **User logs in to Axemoth**: Axemoth authenticates them and redirects them *back* to our backend at `http://localhost:4000/auth/callback`, attaching a temporary `code` in the URL.
4. **`GET /auth/callback`**:
    - Our backend takes that `code` and the `code_verifier` from the session.
    - It privately talks to Axemoth server-to-server (`/token` endpoint), presenting the `client_secret` and the `code_verifier`.
    - Axemoth verifies everything matches and hands back an `id_token` containing the user's profile data (`sub`, `name`, `email`).
5. **Database Upsert**: We look up the user in our database by their `sub` (the unique ID Axemoth gave them). If they don't exist, we insert them automatically (this is called "Just-In-Time Provisioning").
6. **Session & Final Redirect**: We save the user's database `id` into our own Express session and redirect them to the frontend dashboard.

### Why PKCE?
PKCE prevents a specific type of attack where a malicious app running on the user's device tries to steal the temporary `code` from the redirect URL. Even if the attacker steals the code, they can't exchange it for a token because they don't know the original `code_verifier` that we kept hidden in our backend session.

---

## 6. Session Middleware & App Entry Point

### Date: 2026-05-13

### What we set up

We built the core Express application that orchestrates all the tools we've installed, and specifically configured robust Session management.

**Files Created:**
- `server/middleware/requireSession.js` (A simple guard to reject unauthenticated requests)
- `server/app.js` (The Express app config, CORS, and Session middleware)
- `server/server.js` (The HTTP server that starts listening on port 4000)

### How Sessions Work Here

We use `express-session` combined with `connect-pg-simple`. 

```javascript
app.use(session({
  store: new PgStore({ 
    conString: process.env.DB_URL,
    createTableIfMissing: true 
  }),
  // ...
}))
```

Instead of storing user sessions in memory (which disappears if the server restarts), `connect-pg-simple` automatically creates a `session` table inside our PostgreSQL database and stores the data there. 

When a user logs in via OIDC, we do:
`req.session.userId = user.id;`

Express automatically serializes this into a JSON string, encrypts it using `process.env.SESSION_SECRET`, and saves it to Postgres. It then gives the user's browser a cookie containing only the **Session ID** (e.g., `s:xyz123...`). 

Every time the browser makes a request, it sends that cookie, Express looks up `xyz123` in Postgres, retrieves the `userId`, and allows the request through our `requireSession` middleware.

### OIDC Boot Sequence

In `server/server.js`, we have this block:
```javascript
await initOidc();
server.listen(PORT);
```
We **must** `await` the OIDC discovery process before allowing the server to listen. If we didn't, a user could theoretically hit the `/auth/login` route before the app knows where the Axemoth endpoints are, causing a crash.

---

## 7. Hybrid Auth (Local + OIDC)

### Date: 2026-05-13

### What we set up

We modified the auth system to allow users to sign up using a traditional Email & Password combination, alongside the existing OIDC (Google/Axemoth) login. 

**Changes Made:**
1. **Schema Update (`server/db/schema.js`)**:
   - `sub` (The OIDC unique identifier) is now *optional* (nullable) because local users won't have one initially.
   - `email` is now `notNull()` and `unique()`. It acts as the primary key for identity mapping.
   - Added `passwordHash` to securely store hashed local passwords.
2. **Library**: Installed `bcryptjs` to securely hash user passwords. (We never store plain text).
3. **Local Routes (`server/routes/auth.js`)**:
   - `POST /auth/local/signup`: Accepts email, name, and password. Hashes the password, creates the user, and initiates the session.
   - `POST /auth/local/login`: Looks up the user by email, compares the hashed password, and initiates the session.
4. **Account Linking (OIDC Callback)**:
   - When a user logs in via Google/Axemoth, we now look them up in our database by their **email address** rather than their `sub`. 
   - If they already created a local account with that email, we automatically link their new OIDC `sub` to their existing account.
   - This prevents duplicate accounts and allows users to seamlessly switch between logging in locally or with their identity provider!

---

## 8. Poll CRUD API Routes

### Date: 2026-05-13

### What we set up

We built the core API endpoints that allow authenticated users to create, read, update, and delete polls.

**Files Created:**
- `server/lib/slug.js`: Uses the `nanoid` library to generate short, 8-character, URL-friendly slugs for public polls (e.g., `V1StGXR8`).
- `server/middleware/requirePollOwner.js`: A security guard that prevents users from editing or deleting polls they didn't create.
- `server/routes/polls.js`: The main router containing all poll-related logic.
- `server/app.js`: Updated to mount the router at `/api/polls`.

### How it works:

1. **Transactions (`POST /api/polls`)**:
   Creating a poll involves inserting data into three separate tables: `polls`, `questions`, and `options`. We use Drizzle's `db.transaction()` to ensure that if anything fails halfway through, all inserts are rolled back. This prevents orphaned questions or corrupt poll data.
2. **Relational Queries (`GET /api/polls/:slug`)**:
   When a respondent loads a poll, they need the poll details, all its questions, and all the options for those questions. Instead of doing messy manual SQL `JOIN`s, we use Drizzle's `db.query.polls.findFirst()` with nested `with` statements. This fetches the entire tree of data efficiently in one go.
3. **Cascading Deletes (`DELETE /api/polls/:id`)**:
   Because we set `onDelete: 'cascade'` when designing our schema in Phase 1, deleting a poll automatically forces the database to delete all related questions, options, and future responses instantly.

---

## 9. Response Engine

### Date: 2026-05-13

### What we set up

We implemented the core logic that allows people to actually participate in polls.

**Files Created:**
- `server/routes/responses.js`: The "Submission" router.
- `server/app.js`: Updated to mount the router at `/api/responses`.

### Key Features:

1. **Validation**: Before accepting a vote, the server checks:
   - Does the poll exist?
   - Is it currently active (`isActive = true`)?
   - Has it expired?
2. **Respondent Tracking**:
   - If the poll is marked as `isAnonymous = false`, the server enforces a login and links the response to the user's ID.
   - If it's anonymous, the server still records the respondent's **IP Address**. This allows the owner to filter out spam or duplicate votes from the same network.
3. **Transaction-Safe Submission**:
   Like the poll creation, submitting a response is wrapped in a **Database Transaction**. 
   - First, the main `responses` record is created.
   - Then, all the individual `answers` (for each question) are inserted in bulk.
   If even one answer fails to save, the entire response is canceled so the database remains clean.

---

## 10. Analytics & Aggregation Routes

### Date: 2026-05-13

### What we set up

We built the "Brain" of the platform that calculates the results of the polls for the creator.

**Files Created:**
- `server/routes/analytics.js`: The reporting router.
- `server/app.js`: Updated to mount the router at `/api/analytics`.

### How it works:

1. **Owner-Only Privacy**:
   The analytics routes are protected by the `requirePollOwner` middleware we wrote earlier. This ensures that only the person who created the poll can see the detailed breakdown of the votes.
2. **Aggregated Results**:
   Instead of just returning a giant list of every single vote, the server performs a **SQL Group By** operation. It counts exactly how many times each specific `optionId` was selected for every question in the poll.
3. **Open-Ended Answers**:
   For questions where users typed in their own text, the analytics engine fetches and returns a clean list of all text submissions along with their timestamps.
4. **Efficiency**:
   By using `innerJoin` between the `answers` and `responses` tables, we can calculate the results for thousands of votes in milliseconds directly inside the database.

---

## 11. Socket.io Real-time Updates

### Date: 2026-05-13

### What we set up

We added the ability for the server to "push" updates to the frontend instantly, making the poll results live.

**Files Created/Modified:**
- `server/lib/socket.js`: The central manager for Socket.io.
- `server/server.js`: Updated to attach the socket server to our existing HTTP server.
- `server/routes/responses.js`: Updated to trigger a broadcast every time a new vote is saved.

### How it works:

1. **The Handshake**: When a user opens the "Poll Results" page on the frontend, their browser will establish a permanent connection (a WebSocket) to the backend.
2. **Room Logic**: Instead of broadcasting every vote to every single user on the platform (which would be chaotic), we use **Rooms**. When a user looks at Poll A, they "join" `room:poll_A`.
3. **Instant Emission**: When the `POST /api/responses` route finishes saving a new answer to the database, it calls `getIO().to('room:poll_A').emit('new_vote')`.
4. **Live UI**: The frontend receives this event and instantly triggers a re-fetch of the analytics or updates the chart bars, giving the user a "live" experience without them ever hitting refresh.

---

## Upcoming Steps (Phase 2)

The next things we will implement, in order:

1. **Install dependencies** — `express`, `drizzle-orm`, `pg`, `express-session`, `connect-pg-simple`, `openid-client`, `nanoid`, `dotenv`, `zod`
2. **Dev dependencies** — `drizzle-kit`
3. **Create folder structure** — `db/`, `routes/`, `middleware/`, `socket/`, `jobs/`, `lib/`
4. **Write `server/db/schema.js`** — Drizzle table definitions
5. **Write `server/db/index.js`** — Drizzle client + pg Pool
6. **Write `server/drizzle.config.js`** — Config for migrations
7. **Run first migration** — `npx drizzle-kit generate && npx drizzle-kit migrate`
8. **Write `server/lib/oidc.js`** — OIDC discovery via `openid-client`
9. **Write `server/routes/auth.js`** — Login → callback → logout flow
10. **Write `server/app.js`** — Express app with session + all routers
11. **Write `server/server.js`** — HTTP server entry point

---

## 12. Poll Expiry Cron Job

### Date: 2026-05-13

### What we set up

We implemented a background worker that automatically closes polls when they reach their scheduled expiration time.

**Files Created/Modified:**
- `server/jobs/expiryJob.js`: The logic for finding and closing expired polls.
- `server/server.js`: Updated to start the cron worker when the backend boots.

### How it works:

1. **The Scheduler**: We use the `node-cron` library. It is configured with the pattern `* * * * *`, which tells it to wake up **every 60 seconds**.
2. **The Query**: Every minute, the script asks the database: *"Show me any polls that are marked as ACTIVE but have an `expiresAt` timestamp that is smaller than (before) right now."*
3. **The Auto-Close**: For any polls it finds, it automatically sets `isActive = false`. 
4. **Visibility**: This ensures that even if no one is visiting the site, the database stays up to date and polls close precisely when they are supposed to.

---

## 13. Rate Limiting & Security

### Date: 2026-05-13

### What we set up

We added a security layer to protect the server from automated attacks, brute-force logins, and poll spam.

**Files Modified:**
- `server/app.js`: Configured and applied three levels of rate limiting using `express-rate-limit`.

### How it works:

1. **Global Safety**: Every IP address is limited to 100 requests every 15 minutes across the whole site. This stops "DDoS" style attacks where a single computer tries to crash the server.
2. **Brute-Force Protection**: The `/auth` routes (Login and Signup) are much stricter. If someone tries to guess a password and fails more than 10 times in 15 minutes, the server will block their IP temporarily.
3. **Spam Prevention**: The `/api/responses` route (Voting) is limited to 5 votes per minute per IP. This ensures that a single user (or bot) cannot cast hundreds of votes in a few seconds.
4. **Friendly Messages**: When a limit is hit, the server returns a clean JSON error message like `"Slow down! You are voting too fast."` instead of just crashing.

---

*This document is updated as each phase is implemented.*
