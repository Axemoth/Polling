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

## 📄 License & Credits

Built by Axe. All rights reserved.
