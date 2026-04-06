/**
 * True when the email domain is exactly usc.edu (case-insensitive).
 */
export function isUscEduEmail(value) {
  const normalized = String(value).trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at < 1) return false;
  const domain = normalized.slice(at + 1);
  return domain === 'usc.edu';
}
