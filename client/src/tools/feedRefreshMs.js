/**
 * How often the feed refetches the first page from the server while the Feed page is open.
 * Default: 10 seconds. Override with VITE_FEED_REFRESH_MS (milliseconds), e.g. 300000 for 5 minutes in production.
 */
const DEFAULT_MS = 10 * 60 * 1000;
const MIN_MS = 500;
const MAX_MS = 24 * 60 * 60 * 1000;

export function getFeedRefreshIntervalMs() {
  const raw = import.meta.env.VITE_FEED_REFRESH_MS;
  if (raw === undefined || raw === '') return DEFAULT_MS;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return DEFAULT_MS;
  return Math.min(Math.max(n, MIN_MS), MAX_MS);
}
