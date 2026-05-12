import { db } from '../db/index.js';
import { polls } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function requirePollOwner(req, res, next) {
  try {
    const [poll] = await db.select().from(polls).where(eq(polls.id, req.params.id));
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    if (poll.creatorId !== req.session.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this poll' });
    }
    
    // Attach poll to request so downstream route handlers don't need to re-fetch it from the database
    req.poll = poll;
    next();
  } catch (error) {
    console.error('requirePollOwner Error:', error);
    res.status(500).json({ error: 'Server error checking poll ownership' });
  }
}
