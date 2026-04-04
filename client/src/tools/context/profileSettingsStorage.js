/** Persist settings in localStorage until a profile API exists. */

export const PROFILE_SETTINGS_STORAGE_KEY = 'touchgrass_profile_settings_v1';

/** Fired on same window after save; use with `storage` for other tabs. */
export const PROFILE_SETTINGS_CHANGED_EVENT = 'touchgrass-profile-settings-changed';

const STORAGE_KEY = PROFILE_SETTINGS_STORAGE_KEY;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function readAllProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    // Backward compatibility: migrate older single-profile payload to per-email map.
    if (typeof parsed.email === 'string' && (parsed.name || parsed.bio || parsed.avatarDataUrl)) {
      const email = normalizeEmail(parsed.email);
      return email ? { [email]: parsed } : {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function writeAllProfiles(profilesByEmail) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profilesByEmail));
}

export const defaultProfileSettings = {
  name: '',
  bio: '',
  email: '',
  avatarDataUrl: null,
  emailNotifications: true,
  eventReminders: '15',
  newMessages: true,
  profileVisibility: 'friends',
  activityVisibility: 'public',
  locationSharing: false,
  theme: 'system',
  feedDensity: 'comfortable',
  reduceMotion: false,
};

/**
 * @param {string} [sessionEmail] — from frontend session when signed in (not persisted as auth).
 */
export function loadProfileSettings(sessionEmail = '') {
  const fallbackEmail =
    typeof sessionEmail === 'string' && sessionEmail.trim() ? sessionEmail.trim() : '';
  const normalizedEmail = normalizeEmail(fallbackEmail);
  try {
    const allProfiles = readAllProfiles();
    const parsed = normalizedEmail ? allProfiles[normalizedEmail] : null;
    if (!parsed) {
      return { ...defaultProfileSettings, email: fallbackEmail };
    }
    const merged = { ...defaultProfileSettings, ...parsed };
    if (!merged.email || typeof merged.email !== 'string') {
      merged.email = fallbackEmail;
    }
    return merged;
  } catch {
    return { ...defaultProfileSettings, email: fallbackEmail };
  }
}

export function saveProfileSettings(settings) {
  try {
    const email = normalizeEmail(settings?.email);
    if (!email) return;
    const allProfiles = readAllProfiles();
    allProfiles[email] = { ...settings };
    writeAllProfiles(allProfiles);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PROFILE_SETTINGS_CHANGED_EVENT));
    }
  } catch {
    /* quota or private mode */
  }
}

/** Initials for avatar fallbacks (same rules as Settings preview). */
export function getProfileInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
