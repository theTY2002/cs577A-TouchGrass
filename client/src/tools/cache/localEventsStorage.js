/**
 * User-created events persisted in localStorage (until a backend exists).
 */
import { FEED_HERO_IMAGE } from '../../components/Hero';
import { MOCK_EVENTS, unsplashPhoto } from '../../data/events';

const KEY = 'touchgrass_local_events';

export function loadLocalEvents() {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return [];
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLocalEvents(events) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Newest local events first (prepended on create). */
export function appendLocalEvent(event) {
  saveLocalEvents([event, ...loadLocalEvents()]);
}

export function updateLocalEvent(updated) {
  const cur = loadLocalEvents();
  const idx = cur.findIndex((e) => String(e.id) === String(updated.id));
  if (idx < 0) return;
  const next = [...cur];
  next[idx] = updated;
  saveLocalEvents(next);
}

export function getEventById(id) {
  const local = loadLocalEvents().find((e) => String(e.id) === String(id));
  if (local) return local;
  return MOCK_EVENTS.find((e) => String(e.id) === String(id)) ?? null;
}

export function isLocalUserEventId(id) {
  return String(id).startsWith('local-');
}

/** Mock feed event id treated as owned by the logged-in user (matches EventDetails organizer edit). */
export const DEMO_USER_OWNED_EVENT_ID = '4';

/** True when this event is owned by the active user session. */
export function isPlanCreatedByCurrentUser(event, currentUser = null) {
  if (!event) return false;
  const currentUserId = currentUser?.id != null ? String(currentUser.id) : '';
  const currentEmail = String(currentUser?.email || '').trim().toLowerCase();
  const ownerUserId = event.ownerUserId != null ? String(event.ownerUserId) : '';
  const ownerEmail = String(event.ownerEmail || '').trim().toLowerCase();

  if (ownerUserId && currentUserId && ownerUserId === currentUserId) return true;
  if (ownerEmail && currentEmail && ownerEmail === currentEmail) return true;
  if (isLocalUserEventId(event.id) && !ownerUserId && !ownerEmail) return true;
  if (String(event.id) === DEMO_USER_OWNED_EVENT_ID && !ownerUserId && !ownerEmail) return true;
  return false;
}

/**
 * “My plans” filter: events you created, or events you’ve joined (joinedIds from feed state / localStorage).
 */
export function isPlanInMyPlans(event, joinedIds, currentUser = null) {
  if (!event) return false;
  if (isPlanCreatedByCurrentUser(event, currentUser)) return true;
  if (!(joinedIds instanceof Set)) return false;
  return joinedIds.has(event.id);
}

/**
 * Build a full event record from the create/edit form.
 * @param {object} form — title, date, time, location, capacity, tags[], details, imageUrl
 * @param {string} contactEmail — saved user email (organizer context)
 * @param {{ id?: number|string, email?: string } | null} [currentUser]
 * @param {object|null} existing — when editing a local event, merge counts + id
 */
function timeWithSeconds(timeStr) {
  const t = (timeStr && String(timeStr).trim()) || '12:00';
  return t.length === 5 ? `${t}:00` : t;
}

export function buildEventFromForm(form, contactEmail, currentUser = null, existing = null) {
  const datePart =
    form.date?.trim() || (existing?.dateTime || existing?.datetime || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
  const dateTime = `${datePart}T${timeWithSeconds(form.time)}`;
  const tags = form.tags?.length ? [...form.tags] : ['Event'];
  const localPart = (contactEmail || 'you').split('@')[0] || 'You';
  const initials = localPart.slice(0, 2).toUpperCase();
  const capRaw = Number(form.capacity);
  const capacity =
    Number.isFinite(capRaw) && capRaw >= 1
      ? Math.min(500, Math.floor(capRaw))
      : (existing?.capacity ?? 10);

  const base = {
    title: form.title.trim(),
    ownerUserId:
      currentUser?.id != null
        ? String(currentUser.id)
        : existing?.ownerUserId != null
          ? String(existing.ownerUserId)
          : null,
    ownerEmail:
      (currentUser?.email && String(currentUser.email).trim()) ||
      (existing?.ownerEmail && String(existing.ownerEmail).trim()) ||
      (contactEmail && String(contactEmail).trim()) ||
      '',
    organizer: {
      name: localPart,
      initials,
      avatarUrl: unsplashPhoto('1522071820081-009f0129c71c', 100),
    },
    description: form.details?.trim() || '',
    location: form.location?.trim() || 'TBD',
    dateTime,
    capacity,
    joinedCount: existing?.joinedCount ?? 0,
    tags,
    imageUrl: form.imageUrl?.trim() || FEED_HERO_IMAGE,
    likes: existing?.likes ?? 0,
    comments: existing?.comments ?? 0,
  };

  if (existing?.id) {
    return { ...existing, ...base, id: existing.id };
  }

  return {
    ...base,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
}
