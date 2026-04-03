/**
 * @typedef {object} FeedQuerySpec
 * @property {string[]} tags
 * @property {string} q
 * @property {'date_desc'|'date_asc'} sort
 * @property {string} date
 * @property {boolean} my_plans
 */

/**
 * Parse query params into a stable spec shared by cache keys and SQL.
 * @param {import('express').Request['query']} q
 * @returns {FeedQuerySpec}
 */
function parseFeedQuerySpec(q) {
  const query = q || {};
  const tags = [];
  if (query.tags) {
    tags.push(
      ...String(query.tags)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  } else if (query.tag) {
    tags.push(String(query.tag).trim());
  }
  const sort = query.sort === "date_asc" ? "date_asc" : "date_desc";
  return {
    tags: tags.filter(Boolean),
    q: String(query.q || query.search || "").trim(),
    sort,
    date: String(query.date || "").trim(),
    my_plans: query.my_plans === "1" || query.my_plans === "true",
  };
}

module.exports = { parseFeedQuerySpec };
