import { Router } from 'express';
import { db } from '../db/index.js';
import { polls, questions, options } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { requireSession } from '../middleware/requireSession.js';
import { requirePollOwner } from '../middleware/requirePollOwner.js';
import { generateSlug } from '../lib/slug.js';

const router = Router();

// ==========================================
// 1. POST /api/polls - Create a new poll
// ==========================================
router.post('/', requireSession, async (req, res) => {
  const { title, description, isAnonymous, expiresAt, questions: qs } = req.body;

  try {
    // We use a database transaction. If inserting questions or options fails, 
    // the whole poll creation rolls back automatically so we don't end up with partial data.
    await db.transaction(async (tx) => {
      const slug = generateSlug();

      const [poll] = await tx.insert(polls).values({
        creatorId:   req.session.userId,
        title,
        description,
        publicSlug:  slug,
        isAnonymous: isAnonymous ?? false,
        expiresAt:   expiresAt ? new Date(expiresAt) : null,
      }).returning();

      for (let i = 0; i < qs.length; i++) {
        const [question] = await tx.insert(questions).values({
          pollId:      poll.id,
          text:        qs[i].text,
          orderIndex:  i,
          isMandatory: qs[i].isMandatory ?? true,
        }).returning();

        const optionRows = qs[i].options.map((text, j) => ({
          questionId: question.id,
          text,
          orderIndex: j,
        }));

        await tx.insert(options).values(optionRows);
      }

      res.status(201).json({ pollId: poll.id, publicSlug: slug });
    });
  } catch (err) {
    console.error('Error creating poll:', err);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// ==========================================
// 2. GET /api/polls/mine - Get creator's polls
// ==========================================
router.get('/mine', requireSession, async (req, res) => {
  try {
    const userPolls = await db.select().from(polls)
      .where(eq(polls.creatorId, req.session.userId))
      .orderBy(desc(polls.createdAt));
      
    res.json(userPolls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// ==========================================
// 3. GET /api/polls/details/:id - Load poll by ID (Owner only)
// Must be registered before /:slug so "details" is not captured as a slug.
// ==========================================
router.get('/details/:id', requireSession, requirePollOwner, async (req, res) => {
  try {
    const fullPoll = await db.query.polls.findFirst({
      where: eq(polls.id, req.params.id),
      with: {
        questions: {
          orderBy: (qs, { asc }) => [asc(qs.orderIndex)],
          with: {
            options: {
              orderBy: (opts, { asc }) => [asc(opts.orderIndex)],
            }
          }
        }
      }
    });

    if (!fullPoll) return res.status(404).json({ error: 'Poll not found' });
    res.json(fullPoll);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch poll details' });
  }
});

// ==========================================
// 4. GET /api/polls/:slug - Load poll for respondents (public slug)
// ==========================================
router.get('/:slug', async (req, res) => {
  try {
    // We use Drizzle's Relational Query API here to fetch the poll, 
    // its questions, and their options all in one nested JSON structure.
    const fullPoll = await db.query.polls.findFirst({
      where: eq(polls.publicSlug, req.params.slug),
      with: {
        questions: {
          orderBy: (qs, { asc }) => [asc(qs.orderIndex)],
          with: {
            options: {
              orderBy: (opts, { asc }) => [asc(opts.orderIndex)],
            }
          }
        }
      }
    });

    if (!fullPoll) return res.status(404).json({ error: 'Poll not found' });

    const isExpired = fullPoll.expiresAt && new Date(fullPoll.expiresAt) < new Date();
    const shouldShowResults = !fullPoll.isActive || fullPoll.isPublished || isExpired;

    if (shouldShowResults) {
      const { getPollAnalyticsData } = await import('../lib/analytics.js');
      const results = await getPollAnalyticsData(fullPoll.id);
      fullPoll.results = results;
    }

    res.json(fullPoll);
  } catch (err) {
    console.error('Error fetching poll:', err);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// ==========================================
// 5. PUT /api/polls/:id - Edit poll metadata
// ==========================================
router.put('/:id', requireSession, requirePollOwner, async (req, res) => {
  const { title, description, isAnonymous, isActive, isPublished, expiresAt } = req.body;
  
  try {
    const [updated] = await db.update(polls)
      .set({ 
        title, 
        description, 
        isAnonymous, 
        isActive,
        isPublished,
        expiresAt: expiresAt ? new Date(expiresAt) : null 
      })
      .where(eq(polls.id, req.params.id))
      .returning();
      
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update poll' });
  }
});

// ==========================================
// 5. DELETE /api/polls/:id
// ==========================================
router.delete('/:id', requireSession, requirePollOwner, async (req, res) => {
  try {
    // Drizzle handles cascade deletion because we set onDelete: 'cascade' in schema.js
    // This will automatically delete questions, options, and responses linked to this poll.
    await db.delete(polls).where(eq(polls.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete poll' });
  }
});

export default router;
