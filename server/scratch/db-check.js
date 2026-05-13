import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DB_URL });

async function check() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database Connected Successfully:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Database Connection Failed:', err.message);
    process.exit(1);
  }
}

check();
