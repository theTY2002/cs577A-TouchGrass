/** Use "" so requests go to `/api/*` (Vite proxy in dev) or set VITE_API_BASE for absolute URL. */
const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const SESSION_TOKEN_KEY = "touchgrass_session_token";

const BY_TAG = {
  Study:
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
  Coffee:
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
  Hiking:
    "https://images.unsplash.com/photo-1719425620991-fddb6534f82f?w=800&q=80",
  Sport: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
  Sports:
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
  Food: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
  Gaming:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
  Party:
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  Music:
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  Event:
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
};

const DEFAULT_IMG = BY_TAG.Study;

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export function mapPostToEvent(row) {
  const tags = normalizeTags(row.tags);

  // Format the tag to title case (e.g., "study" becomes "Study") so it matches our dictionary
  const primaryTag = tags.find((t) => {
    const formatted = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    return BY_TAG[formatted];
  });

  let imageUrl = DEFAULT_IMG;
  if (primaryTag) {
    const formattedTag =
      primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1).toLowerCase();
    imageUrl = BY_TAG[formattedTag];
  }

  const author = row.author_name || "Organizer";

  const parts = author.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0] || "?").slice(0, 2).toUpperCase();

  const dateRaw = row.date;
  let dateTime = "";
  if (dateRaw instanceof Date) {
    dateTime = dateRaw.toISOString();
  } else if (dateRaw != null && dateRaw !== "") {
    const d = new Date(dateRaw);
    dateTime = Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }

  // Format the members array from the database
  const mappedMembers = (row.members || []).map((member) => {
    const memberName = member.name || "User";
    const memberParts = memberName.trim().split(/\s+/).filter(Boolean);
    const memberInitials =
      memberParts.length >= 2
        ? (
            memberParts[0][0] + memberParts[memberParts.length - 1][0]
          ).toUpperCase()
        : (memberParts[0] || "?").slice(0, 2).toUpperCase();

    return {
      id: String(member.id),
      name: memberName,
      initials: memberInitials,
      avatarUrl:
        member.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=e2e8f0&color=475569`,
    };
  });

  return {
    id: String(row.post_id),
    ownerUserId: row.owner_user_id != null ? String(row.owner_user_id) : null,
    ownerEmail: row.owner_email || "",
    title: row.title,
    organizer: {
      name: author,
      initials,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=4d6b52&color=fff&size=128`,
    },
    description: row.description || "",
    location: row.location || "",
    dateTime,
    capacity: row.max_members ?? 0,
    joinedCount: row.current_members ?? 0,
    tags,
    imageUrl,
    likes: 0,
    comments: 0,
    status: row.status,
    members: mappedMembers, // Added the perfectly formatted members array here!
  };
}

/**
 * Paginated feed (authenticated). First page uses offset=0 & limit=30 for server-side cache.
 * @param {object} opts
 * @param {string} [opts.token]
 * @param {number} [opts.offset]
 * @param {number} [opts.limit]
 * @param {string[]} [opts.tags]
 * @param {string} [opts.date] YYYY-MM-DD
 * @param {string} [opts.q]
 * @param {'date_desc'|'date_asc'} [opts.sort]
 * @param {boolean} [opts.myPlans]
 */
export async function fetchFeedPage({
  token = getStoredSessionToken(),
  offset = 0,
  limit = 30,
  tags = [],
  date = "",
  q = "",
  sort,
  myPlans = false,
} = {}) {
  const params = new URLSearchParams();
  params.set("offset", String(offset));
  params.set("limit", String(limit));
  if (tags?.length) params.set("tags", tags.join(","));
  if (date) params.set("date", date);
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  if (myPlans) params.set("my_plans", "1");

  const url = `${API_BASE}/api/feed?${params.toString()}`;
  console.log(
    `[client/api] fetchFeedPage offset=${offset} limit=${limit} tags=${tags?.length ?? 0}`,
  );

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch feed");
  }

  /** New API: `{ events, hasMore, offset, limit }`. Legacy: bare row array from `res.json(rows)`. */
  let events;
  let hasMore;
  let outOffset = offset;
  let outLimit = limit;

  if (Array.isArray(data)) {
    events = data.map(mapPostToEvent);
    hasMore = false;
  } else if (data && Array.isArray(data.events)) {
    events = data.events;
    hasMore = Boolean(data.hasMore);
    outOffset = data.offset ?? offset;
    outLimit = data.limit ?? limit;
  } else {
    throw new Error("Invalid feed response");
  }

  return {
    events,
    hasMore,
    offset: outOffset,
    limit: outLimit,
  };
}

// Join an event (throws Error with optional .status and .code e.g. GROUP_FULL)
export async function joinEvent(postId, userId) {
  console.log(`[client/api] joinEvent start postId=${postId} userId=${userId}`);
  const response = await fetch(`${API_BASE}/api/events/${postId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const err = new Error(data?.error || "Failed to join event");
    err.code = data?.code;
    err.status = response.status;
    throw err;
  }
  console.log(`[client/api] joinEvent success postId=${postId}`);
  return data || {};
}

/** Leave an event (authenticated; server uses session user). */
export async function leaveEvent(postId) {
  const token = getStoredSessionToken();
  console.log(`[client/api] leaveEvent start postId=${postId}`);
  const response = await fetch(`${API_BASE}/api/events/${postId}/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const err = new Error(data?.error || "Failed to leave event");
    err.code = data?.code;
    err.status = response.status;
    throw err;
  }
  console.log(`[client/api] leaveEvent success postId=${postId}`);
  return data || {};
}

// Create a new event
export async function createEvent(eventData) {
  console.log("[client/api] createEvent start");
  const response = await fetch(`${API_BASE}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) throw new Error("Failed to create event");
  console.log("[client/api] createEvent success");
  return response.json();
}

// Fetch a user profile
export async function getUserProfile(userId) {
  const response = await fetch(`${API_BASE}/api/users/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch user profile");
  return response.json();
}

// Fetch a single event by ID
export async function getEvent(postId) {
  const response = await fetch(`${API_BASE}/api/events/${postId}`);
  if (!response.ok) throw new Error("Failed to fetch event");

  const data = await response.json();
  return mapPostToEvent(data); // We re-use your awesome mapping function!
}

function getApiErrorMessage(status, fallback = "Request failed") {
  if (status === 401) return "Invalid email or password.";
  return fallback;
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function getStoredSessionToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY) || "";
}

export function clearStoredSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

export async function signUpWithApi(payload) {
  console.log(`[client/api] signup start email=${payload?.email || "unknown"}`);
  const response = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(
      data?.error || getApiErrorMessage(response.status, "Failed to sign up"),
    );
  }
  console.log("[client/api] signup success");
  return data;
}

export async function loginWithApi({ email, password }) {
  console.log(`[client/api] login start email=${email || "unknown"}`);
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.error || getApiErrorMessage(response.status));
  }
  if (data?.token) {
    localStorage.setItem(SESSION_TOKEN_KEY, data.token);
  }
  console.log(
    `[client/api] login success userId=${data?.user?.id || "unknown"}`,
  );
  return data;
}

/**
 * @returns {Promise<{ user: object, joinedPostIds: string[] } | null>}
 */
export async function fetchCurrentUser(token = getStoredSessionToken()) {
  console.log(`[client/api] /me start tokenPresent=${token ? "yes" : "no"}`);
  if (!token) return null;
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.error || "Session expired");
  }
  const user = data?.user || null;
  if (!user) return null;
  const joinedPostIds = Array.isArray(data?.joined_post_ids)
    ? data.joined_post_ids.map((id) => String(id))
    : [];
  console.log(
    `[client/api] /me success userId=${user?.id || "unknown"} joinedPosts=${joinedPostIds.length}`,
  );
  return { user, joinedPostIds };
}

export async function logoutWithApi() {
  const token = getStoredSessionToken();
  clearStoredSessionToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    /* network errors — session already cleared client-side */
  }
}
