import { db } from '../db/index.js';
import { answers, responses, questions } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

export async function getPollAnalyticsData(pollId) {
  // 1. Get total count of unique responses
  const [countRes] = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(responses)
    .where(eq(responses.pollId, pollId));

  // 2. Get counts for multiple choice options
  const optionCounts = await db.select({
    questionId: answers.questionId,
    optionId:   answers.selectedOptionId,
    count:      sql`count(*)`.mapWith(Number)
  })
  .from(answers)
  .innerJoin(responses, eq(answers.responseId, responses.id))
  .where(eq(responses.pollId, pollId))
  .groupBy(answers.questionId, answers.selectedOptionId);

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
    .where(eq(questions.pollId, pollId));

  const answerTotalsByQuestion = Object.entries(perQuestionAnswerTotals).map(
    ([questionId, answerCount]) => ({ questionId, answerCount })
  );

  const questionCount = pollQuestionRows.length;
  const expectedAnswersIfFull = totalResponses * questionCount;
  const allQuestionsMatchResponses =
    totalResponses > 0 &&
    questionCount > 0 &&
    pollQuestionRows.every((q) => (perQuestionAnswerTotals[q.id] || 0) === totalResponses);

  return {
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
  };
}
