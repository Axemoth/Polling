import cron from 'node-cron';
import { db } from '../db/index.js';
import { polls } from '../db/schema.js';
import { and, eq, lte } from 'drizzle-orm';

export function startExpiryJob() {
  // This cron pattern '* * * * *' means "Run every minute of every hour of every day".
  cron.schedule('* * * * *', async () => {
    console.log('--- Running Poll Expiry Job ---');
    
    try {
      const now = new Date();

      // We look for polls that:
      // 1. Are currently active (isActive = true)
      // 2. Have an expiry date (expiresAt IS NOT NULL)
      // 3. The expiry date is in the past (expiresAt <= now)
      const result = await db.update(polls)
        .set({ isActive: false })
        .where(
          and(
            eq(polls.isActive, true),
            lte(polls.expiresAt, now)
          )
        )
        .returning({ id: polls.id, title: polls.title });

      if (result.length > 0) {
        console.log(`Automatically closed ${result.length} expired polls:`);
        result.forEach(p => console.log(` - [${p.id}] ${p.title}`));
      } else {
        console.log('No polls expired this minute.');
      }
    } catch (error) {
      console.error('Error running expiry job:', error);
    }
  });

  console.log('Poll Expiry Cron Job has been scheduled (Runs every minute).');
}
