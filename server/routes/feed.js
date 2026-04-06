const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { parseFeedQuerySpec } = require('../feed/feedQuerySpec');
const { queryFeedPage } = require('../feed/feedService');
const { get, set, signatureFromSpec, TTL_MS } = require('../feed/feedCache');

const router = express.Router();

/**
 * Authenticated feed with pagination. First page (offset=0, limit=30) may be served
 * from an in-memory cache keyed by user + filter signature (see ../feed/feedCache.js).
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 50);

    const isPeriodicRefresh =
      req.query.feed_refresh === '1' || req.query.feed_refresh === 'true';

    if (isPeriodicRefresh) {
      console.log(
        `[server] /api/feed refreshing (scheduled client poll) user=${req.user.id}`,
      );
    }

    const spec = parseFeedQuerySpec(req.query);
    const sig = signatureFromSpec(spec);
    const canCacheFirstPage = offset === 0 && limit === 30;

    if (canCacheFirstPage) {
      const cached = get(req.user.id, sig);
      if (cached) {
        console.log(
          `[server] /api/feed data source=in-memory cache (first page, TTL ${TTL_MS}ms) user=${req.user.id}`,
        );
        res.set('Cache-Control', 'private, no-store');
        return res.json(cached);
      }
    }

    const paginated = !canCacheFirstPage;
    console.log(
      paginated
        ? `[server] /api/feed data source=database (paginated request; in-memory first-page cache not used) user=${req.user.id} offset=${offset} limit=${limit}`
        : `[server] /api/feed data source=database (query) user=${req.user.id} offset=${offset} limit=${limit} tagFilters=${spec.tags.length} q=${spec.q ? 'yes' : 'no'}`,
    );

    const result = await queryFeedPage(pool, {
      spec,
      userId: req.user.id,
      offset,
      limit,
    });

    const body = {
      events: result.events,
      hasMore: result.hasMore,
      offset: result.offset,
      limit: result.limit,
    };

    if (canCacheFirstPage) {
      set(req.user.id, sig, body);
    }

    res.set('Cache-Control', 'private, no-store');
    res.json(body);
  } catch (err) {
    console.error('[server] /api/feed error:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch the feed' });
  }
});

module.exports = router;
