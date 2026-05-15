# Axepoll

Axepoll is a lightweight, high-performance web application designed for creating and managing interactive polls with real-time feedback. Built for teams that value agility and honest communication, Axepoll allows users to deploy polls in minutes, share them seamlessly via links or QR codes, and watch the data roll in live without refreshing the page.

## 🚀 Features

- **Real-Time Analytics**: Built on WebSockets (Socket.IO), your dashboard updates the second a vote is cast.
- **Dynamic Charts**: Beautifully animated Bar and Pie charts integrated directly into the analytics view.
- **Single Sign-On (SSO)**: Secure authentication powered by Google OpenID Connect (OIDC).
- **Flexible Poll Options**: Make polls public (anonymous) or require authentication for verified voting. Includes custom expiration times.
- **Instant Sharing**: Quickly distribute your poll with one-click URL copying or auto-generated QR Codes.
- **Premium UI/UX**: Designed with TailwindCSS and Framer Motion for a sleek, dark-themed, glassmorphic aesthetic.

## 🛠️ Technology Stack

**Frontend (Client)**
- React 18 (via Vite)
- TailwindCSS (Styling)
- Framer Motion (Animations)
- Socket.IO-client (WebSockets)
- Lucide React (Icons)
- React Router (Routing)

**Backend (Server)**
- Node.js & Express.js
- PostgreSQL (Database)
- Drizzle ORM (Database Queries)
- Socket.IO (Real-time broadcasting)
- `openid-client` (OIDC/SSO Authentication)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Local or Cloud like Neon)
- Google Cloud Console Account (for SSO credentials)

### 1. Installation

Clone the repository and install dependencies for both the client and server:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory and add your specific configurations:

```env
# Database
DB_URL=postgresql://your_db_user:your_db_password@localhost:5432/your_db_name

# Google OIDC Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback

# App Config
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=4000
```

*Note: For detailed instructions on getting your Google Client ID, check Google Cloud Console -> APIs & Services -> Credentials.*

### 3. Database Setup

Run the Drizzle ORM migrations to push the schema to your PostgreSQL database:

```bash
cd server
npx drizzle-kit push
```

### 4. Running the Application

You'll need two terminal windows to run both the frontend and backend simultaneously.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser to access Axepoll!

## 🏗️ Architecture & Security

- **Privacy-First Responses**: The database separates user identities (`responses` table) from actual answers (`answers` table). Anonymous polls leave the `respondentId` completely null, ensuring true anonymity.
- **Automated Lifecycle**: Background cron jobs (`node-cron`) automatically sweep the database every minute to close expired polls, simultaneously firing Socket.io events to instantly lock out late voters on the frontend.
- **Secure Authentication**: Utilizes `express-session` with `connect-pg-simple` to store sessions in the database, with strict Cross-Origin cookie configurations (`SameSite=None`, `Secure=true`) for modern frontend-backend decoupling.

## 🚀 Deployment (Production)

This project is configured for a decoupled production environment:

1. **Frontend (Vercel)**
   - Add the environment variable: `VITE_API_URL=https://your-backend-url.com`
   - Set the Root Directory to `client/` in Vercel.
   - The included `client/vercel.json` ensures React Router handles deep linking without throwing 404 errors.

2. **Backend (Azure App Service / Render / Heroku)**
   - Must set `NODE_ENV=production` to enable secure cookies.
   - Set `CLIENT_URL=https://your-frontend-url.com` to resolve CORS policies.
   - Provide your cloud PostgreSQL URL (e.g., Neon or Supabase) as `DB_URL`.
   - Update `GOOGLE_REDIRECT_URI` in Google Cloud Console to match your production backend URL.

Deployments are automated via GitHub Actions (`.github/workflows/main_axepoll.yml`).

## 📁 Project Structure

```text
Poll-platform/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Charts, Nav, etc.)
│   │   ├── context/        # React Context (Auth State, Axios Instance)
│   │   └── pages/          # Views (Dashboard, Analytics, Vote, etc.)
│   └── vercel.json         # React Router rewrite rules
└── server/                 # Node.js/Express Backend
    ├── db/                 # Drizzle Schema & Connection
    ├── jobs/               # Cron Jobs (Expiry sweeps)
    ├── lib/                # Socket.io & OIDC Init
    └── routes/             # REST API & Auth routes
```

## 📄 License & Credits

Built by Axe. All rights reserved.
