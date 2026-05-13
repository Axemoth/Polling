import { Router } from 'express';
import { db } from '../db/index.js';
import { polls, responses, answers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getIO } from '../lib/socket.js';

const router = Router();

// ==========================================
// POST /api/responses - Submit a poll response
// ==========================================
router.post('/', async (req, res) => {
  const { pollId, answers: submittedAnswers } = req.body;

  try {
    // 1. Validate the Poll exists and is active
    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    if (!poll.isActive) {
      return res.status(403).json({ error: 'This poll is closed and no longer accepting responses' });
    }

    if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
      return res.status(403).json({ error: 'This poll has expired' });
    }

    // Verified-only polls: respondents must be signed in.
    // Anonymous polls: anyone may vote; we do not attach a user id (privacy).
    if (!poll.isAnonymous && !req.session.userId) {
      return res.status(401).json({ error: 'You must be logged in to vote on this poll' });
    }

    const respondentId = poll.isAnonymous ? null : req.session.userId;

    // 3. Save Response and Answers using a Database Transaction
    // If inserting answers fails, the response record is deleted automatically.
    await db.transaction(async (tx) => {
      // Create the main response record
      const [responseRecord] = await tx.insert(responses).values({
        pollId: poll.id,
        respondentId,
      }).returning();

      // Map the incoming answers to match the database schema
      const answerRows = submittedAnswers.map(ans => ({
        responseId:       responseRecord.id,
        questionId:       ans.questionId,
        selectedOptionId: ans.optionId, // Correct column name
      }));

      // Insert all answers in a single bulk operation for performance
      if (answerRows.length > 0) {
        await tx.insert(answers).values(answerRows);
      }
      
      // BROADCAST: Tell Socket.io to alert everyone in this poll's room 
      // that a new vote has arrived.
      const io = getIO();
      io.to(`poll_${pollId}`).emit('new_vote', { 
        pollId, 
        responseId: responseRecord.id 
      });

      res.status(201).json({ success: true, responseId: responseRecord.id });
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

export default router;
