import { Router } from 'express';
import { db } from '../db/index.js';
import { polls, questions, options, answers, responses } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { requireSession } from '../middleware/requireSession.js';
import { requirePollOwner } from '../middleware/requirePollOwner.js';

const router = Router();

// ==========================================
// GET /api/analytics/:id - Get poll results
// ==========================================
router.get('/:id', requireSession, requirePollOwner, async (req, res) => {
  try {
    // 1. Get total count of unique responses
    const [countRes] = await db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(responses)
      .where(eq(responses.pollId, req.params.id));

    // 2. Get counts for multiple choice options
    // This query joins answers with options to get counts for each choice.
    const optionCounts = await db.select({
      questionId: answers.questionId,
      optionId:   answers.optionId,
      count:      sql`count(*)`.mapWith(Number)
    })
    .from(answers)
    .innerJoin(responses, eq(answers.responseId, responses.id))
    .where(eq(responses.pollId, req.params.id))
    .groupBy(answers.questionId, answers.optionId);

    // 3. Get text-based answers for open-ended questions
    const textResults = await db.select({
      questionId: answers.questionId,
      text:       answers.textAnswer,
      createdAt:  responses.createdAt
    })
    .from(answers)
    .innerJoin(responses, eq(answers.responseId, responses.id))
    .where(sql`${answers.textAnswer} IS NOT NULL AND ${responses.pollId} = ${req.params.id}`);

    res.json({
      totalResponses: countRes?.count || 0,
      optionCounts,
      textResults
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
