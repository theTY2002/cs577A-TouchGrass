import { unsplashPhoto } from './data/events';

const DEFAULT_IMG = unsplashPhoto('1481627834876');
const BY_TAG = {
  Study: unsplashPhoto('1481627834876'),
  Coffee: unsplashPhoto('1501339847302'),
  Hiking: unsplashPhoto('1719425620991'),
  Sport: unsplashPhoto('1546519638'),
  Sports: unsplashPhoto('1546519638'),
  Food: unsplashPhoto('1513104890138'),
  Gaming: unsplashPhoto('1513104890138'),
  Party: unsplashPhoto('1514525253161'),
  Music: unsplashPhoto('1514525253161'),
};

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === 'string') {
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export function mapPostToEvent(row) {
  const tags = normalizeTags(row.tags);
  const author = row.author_name || 'Organizer';
  const parts = author.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0] || '?').slice(0, 2).toUpperCase();

  const primaryTag = tags.find((t) => BY_TAG[t]) || tags[0];
  const imageUrl = primaryTag && BY_TAG[primaryTag] ? BY_TAG[primaryTag] : DEFAULT_IMG;

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
  };
}
