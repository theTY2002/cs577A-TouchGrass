/**
 * In-memory feed cache (first page only, per user + filter signature).
 * Not Redis — single-process only. Cleared on feed-affecting mutations.
 */
const TTL_MS = 60 * 1000;

const store = new Map();

function cacheKey(userId, signature) {
  return `${String(userId)}|${signature}`;
}

/**
 * Stable signature for the first-page cache key (must match SQL filter inputs).
 * @param {object} spec
 */
function signatureFromSpec(spec) {
  return JSON.stringify({
    tags: [...spec.tags].sort().join(','),
    q: spec.q,
    sort: spec.sort,
    date: spec.date,
    my_plans: spec.my_plans,
  });
}

function get(userId, signature) {
  const key = cacheKey(userId, signature);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.payload;
}

function set(userId, signature, payload) {
  const key = cacheKey(userId, signature);
  store.set(key, {
    payload,
    expiresAt: Date.now() + TTL_MS,
    storedAt: Date.now(),
  });
}

/** Clear all feed cache entries (e.g. after create/join). */
function invalidateFeedCache() {
  store.clear();
}

module.exports = {
  get,
  set,
  invalidateFeedCache,
  signatureFromSpec,
};
