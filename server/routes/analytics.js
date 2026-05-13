import { Router } from 'express';
import { db } from '../db/index.js';
import { answers, responses, questions } from '../db/schema.js';
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
      optionId:   answers.selectedOptionId, // Correct column name
      count:      sql`count(*)`.mapWith(Number)
    })
    .from(answers)
    .innerJoin(responses, eq(answers.responseId, responses.id))
    .where(eq(responses.pollId, req.params.id))
    .groupBy(answers.questionId, answers.selectedOptionId); // Correct column name

    // Open-ended / text answers are not stored on `answers` in the current schema.
    const textResults = [];

    const totalResponses = countRes?.count || 0;
    let totalAnswerSelections = 0;
    const perQuestionAnswerTotals = {};
    for (const row of optionCounts) {
      totalAnswerSelections += row.count;
      perQuestionAnswerTotals[row.questionId] =
        (perQuestionAnswerTotals[row.questionId] || 0) + row.count;
    }

    const pollQuestionRows = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.pollId, req.params.id));

    const answerTotalsByQuestion = Object.entries(perQuestionAnswerTotals).map(
      ([questionId, answerCount]) => ({ questionId, answerCount })
    );

    const questionCount = pollQuestionRows.length;
    const expectedAnswersIfFull = totalResponses * questionCount;
    const allQuestionsMatchResponses =
      totalResponses > 0 &&
      questionCount > 0 &&
      pollQuestionRows.every((q) => (perQuestionAnswerTotals[q.id] || 0) === totalResponses);

    res.json({
      totalResponses,
      optionCounts,
      textResults,
      participation: {
        questionCount,
        totalAnswerSelections,
        answerTotalsByQuestion,
        expectedAnswersIfFull,
        allQuestionsMatchResponses,
      },
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
