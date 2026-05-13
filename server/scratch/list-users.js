import { db } from '../db/index.js';
import { users } from '../db/schema.js';

async function listUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log('Current Users in DB:');
    allUsers.forEach(u => console.log(`- ${u.name} (${u.email})`));
    process.exit(0);
  } catch (err) {
    console.error('Failed to list users:', err.message);
    process.exit(1);
  }
}

listUsers();
