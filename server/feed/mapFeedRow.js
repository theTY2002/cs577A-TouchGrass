/**
 * Maps a DB row to the same event object shape the React feed expects
 * (aligned with client mapPostToEvent; no raw owner email).
 */

const BY_TAG = {
  Study:
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
  Coffee:
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
  Hiking:
    'https://images.unsplash.com/photo-1719425620991-fddb6534f82f?w=800&q=80',
  Sport: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
  Sports:
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
  Food: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  Gaming:
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  Party:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  Music:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  Event:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
};

const DEFAULT_IMG = BY_TAG.Study;

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function mapFeedRow(row) {
  const tags = normalizeTags(row.tags);

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

  return {
    id: String(row.post_id),
    ownerUserId: row.owner_user_id != null ? String(row.owner_user_id) : null,
    ownerEmail: '',
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
    members: [],
  };
}

module.exports = { mapFeedRow };
