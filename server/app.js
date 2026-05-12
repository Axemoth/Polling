import express from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import cors from 'cors';
import authRouter from './routes/auth.js';
import pollsRouter from './routes/polls.js';
import responsesRouter from './routes/responses.js';
import analyticsRouter from './routes/analytics.js';

const PgStore = connectPg(session);
const app = express();

// Allow the React frontend to make requests with credentials (cookies)
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());

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
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));

// Mount the Auth routes
app.use('/auth', authRouter);

// Mount the Poll routes
app.use('/api/polls', pollsRouter);

// Mount the Responses routes
app.use('/api/responses', responsesRouter);

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
