/**
 * User-created events persisted in localStorage (until a backend exists).
 */
import { FEED_HERO_IMAGE } from './components/Hero';
import { MOCK_EVENTS, unsplashPhoto } from './data/events';

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

/** True for events created on this device (local-*) or the demo “your” mock event. */
export function isPlanCreatedByCurrentUser(event) {
  if (!event) return false;
  if (isLocalUserEventId(event.id)) return true;
  if (String(event.id) === DEMO_USER_OWNED_EVENT_ID) return true;
  return false;
}

/**
 * “My plans” filter: events you created, or events you’ve joined (joinedIds from feed state / localStorage).
 */
export function isPlanInMyPlans(event, joinedIds) {
  if (!event) return false;
  if (isPlanCreatedByCurrentUser(event)) return true;
  if (!(joinedIds instanceof Set)) return false;
  return joinedIds.has(event.id);
}

/**
 * Build a full event record from the create/edit form.
 * @param {object} form — title, date, location, tags[], details, imageUrl
 * @param {string} contactEmail — saved user email (organizer context)
 * @param {object|null} existing — when editing a local event, merge counts + id
 */
export function buildEventFromForm(form, contactEmail, existing = null) {
  const datePart =
    form.date?.trim() || (existing?.dateTime || existing?.datetime || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
  const dateTime = `${datePart}T12:00:00`;
  const tags = form.tags?.length ? [...form.tags] : ['Event'];
  const localPart = (contactEmail || 'you').split('@')[0] || 'You';
  const initials = localPart.slice(0, 2).toUpperCase();

  const base = {
    title: form.title.trim(),
    organizer: {
      name: localPart,
      initials,
      avatarUrl: unsplashPhoto('1522071820081-009f0129c71c', 100),
    },
    description: form.details?.trim() || '',
    location: form.location?.trim() || 'TBD',
    dateTime,
    capacity: existing?.capacity ?? 20,
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
