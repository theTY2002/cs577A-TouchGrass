const { mapFeedRow } = require('./mapFeedRow');

/**
 * @param {import('pg').Pool} pool
 * @param {object} opts
 * @param {import('./feedQuerySpec').FeedQuerySpec} opts.spec
 * @param {string|number} opts.userId
 * @param {number} opts.offset
 * @param {number} opts.limit
 */
async function queryFeedPage(pool, { spec, userId, offset, limit }) {
  const limitPlusOne = limit + 1;
  const params = [];

  function addParam(v) {
    params.push(v);
    return `$${params.length}`;
  }

  const whereParts = [];

  if (spec.tags.length > 0) {
    const ors = spec.tags.map((t) => `p.tags ILIKE ${addParam(`%${t}%`)}`);
    whereParts.push(`(${ors.join(' OR ')})`);
  }

  if (spec.q) {
    const p1 = addParam(`%${spec.q}%`);
    const p2 = addParam(`%${spec.q}%`);
    whereParts.push(`(p.title ILIKE ${p1} OR p.plan_text ILIKE ${p2})`);
  }

  if (spec.date) {
    const d = addParam(spec.date);
    whereParts.push(`(p.datetime_start::date) = ${d}::date`);
  }

  if (spec.my_plans) {
    const uid1 = addParam(userId);
    const uid2 = addParam(userId);
    whereParts.push(`(
      p.owner_user_id = ${uid1} OR EXISTS (
        SELECT 1 FROM groups g2
        INNER JOIN group_members gm2 ON g2.g_id = gm2.group_id
        WHERE g2.post_id = p.p_id AND gm2.user_id = ${uid2}
      )
    )`);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
  const orderBy =
    spec.sort === 'date_asc' ? 'p.datetime_start ASC' : 'p.datetime_start DESC';

  const lim = addParam(limitPlusOne);
  const off = addParam(offset);

  const queryText = `
    SELECT
      p.p_id AS post_id,
      p.title,
      p.datetime_start AS date,
      p.location_text AS location,
      p.plan_text AS description,
      p.tags,
      p.capacity AS max_members,
      p.status,
      p.owner_user_id,
      SPLIT_PART(u.email, '@', 1) AS author_name,
      COALESCE(mc.cnt, 0)::int AS current_members
    FROM posts p
    JOIN users u ON p.owner_user_id = u.u_id
    LEFT JOIN (
      SELECT g.post_id, COUNT(gm.user_id)::int AS cnt
      FROM groups g
      LEFT JOIN group_members gm ON g.g_id = gm.group_id
      GROUP BY g.post_id
    ) mc ON mc.post_id = p.p_id
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT ${lim} OFFSET ${off}
  `;

  const result = await pool.query(queryText, params);
  const rows = result.rows;
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const events = slice.map(mapFeedRow);

  return {
    events,
    hasMore,
    offset,
    limit,
  };
}

module.exports = { queryFeedPage };
