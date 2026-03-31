import { unsplashPhoto } from './data/events';

const API_BASE = 'http://localhost:5001';

const BY_TAG = {
  Study: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
  Coffee: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
  Hiking: 'https://images.unsplash.com/photo-1719425620991-fddb6534f82f?w=800&q=80',
  Sport: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
  Sports: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
  Food: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  Gaming: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  Party: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  Music: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  Event: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80'
};

const DEFAULT_IMG = BY_TAG.Study;

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === 'string') {
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
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
    const formattedTag = primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1).toLowerCase();
    imageUrl = BY_TAG[formattedTag];
  }

  const author = row.author_name || 'Organizer';

  const parts = author.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0] || '?').slice(0, 2).toUpperCase();

  const dateRaw = row.date;
  let dateTime = '';
  if (dateRaw instanceof Date) {
    dateTime = dateRaw.toISOString();
  } else if (dateRaw != null && dateRaw !== '') {
    const d = new Date(dateRaw);
    dateTime = Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }

  // Format the members array from the database
  const mappedMembers = (row.members || []).map(member => {
    const memberName = member.name || 'User';
    const memberParts = memberName.trim().split(/\s+/).filter(Boolean);
    const memberInitials = memberParts.length >= 2
        ? (memberParts[0][0] + memberParts[memberParts.length - 1][0]).toUpperCase()
        : (memberParts[0] || '?').slice(0, 2).toUpperCase();

    return {
      id: String(member.id),
      name: memberName,
      initials: memberInitials,
      avatarUrl: member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=e2e8f0&color=475569`,
    };
  });

  return {
    id: String(row.post_id),
    title: row.title,
    organizer: {
      name: author,
      initials,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=4d6b52&color=fff&size=128`,
    },
    description: row.description || '',
    location: row.location || '',
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

// Fetch the feed, optionally filtered by a tag
export async function fetchFeed(tag = '') {
  const url = tag && tag !== 'All' && tag !== 'None' 
    ? `${API_BASE}/api/feed?tag=${encodeURIComponent(tag)}` 
    : `${API_BASE}/api/feed`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch feed');
  
  const data = await response.json();
  return data.map(mapPostToEvent);
}

// Join an event
export async function joinEvent(postId, userId) {
  const response = await fetch(`${API_BASE}/api/events/${postId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  
  if (!response.ok) throw new Error('Failed to join event');
  return response.json();
}

// Create a new event
export async function createEvent(eventData) {
  const response = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });
  
  if (!response.ok) throw new Error('Failed to create event');
  return response.json();
}

// Fetch a user profile
export async function getUserProfile(userId) {
  const response = await fetch(`${API_BASE}/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
}

// Fetch a single event by ID
export async function getEvent(postId) {
  const response = await fetch(`${API_BASE}/api/events/${postId}`);
  if (!response.ok) throw new Error('Failed to fetch event');
  
  const data = await response.json();
  return mapPostToEvent(data); // We re-use your awesome mapping function!
}