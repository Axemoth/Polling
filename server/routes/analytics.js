import { Router } from 'express';
import { requireSession } from '../middleware/requireSession.js';
import { requirePollOwner } from '../middleware/requirePollOwner.js';
import { getPollAnalyticsData } from '../lib/analytics.js';

const router = Router();

// ==========================================
// GET /api/analytics/:id - Get poll results
// ==========================================
router.get('/:id', requireSession, requirePollOwner, async (req, res) => {
  try {
    const data = await getPollAnalyticsData(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
