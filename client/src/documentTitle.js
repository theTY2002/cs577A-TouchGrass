/** Central helper for browser tab titles — use from page-level useLayoutEffect so routes stay in sync. */

export const BRAND = 'TouchGrass';

/**
 * @param {string} suffix - Shown after "TouchGrass · " (e.g. "Feed", "Settings", or an event name).
 */
export function setTouchGrassTitle(suffix) {
  const raw = typeof suffix === 'string' ? suffix.trim() : '';
  if (!raw) {
    document.title = BRAND;
    return;
  }
  document.title = `${BRAND} · ${raw}`;
}
