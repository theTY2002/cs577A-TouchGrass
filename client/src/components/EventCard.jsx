/**
 * Image-first event card: 4:3 image, attendee avatars, likes/comments, tag pill, hover social buttons.
 * Edit: card radius, truncation, avatar sizes
 */
import { useState } from 'react';

// Mock attendee avatars for overlap (using event organizer + a few placeholders)
const AVATAR_URLS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
];

function HeartIcon({ filled, className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

export default function EventCard({
  event,
  isJoined = false,
  onViewDetails,
  onJoin,
  onLike,
  isLiked = false,
  likeCount,
  index = 0,
}) {
  const {
    title,
    organizer,
    description,
    location,
    dateTime,
    capacity,
    joinedCount,
    tags,
    imageUrl,
    comments,
  } = event;

  const [heartAnim, setHeartAnim] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const displayLikes = likeCount ?? event.likes;
  const visibleTags = tags.slice(0, 3);
  const hasMoreTags = tags.length > 3;

  const formattedDate = new Date(dateTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const organizerName = typeof organizer === 'string' ? organizer : organizer?.name;
  const organizerInitials = typeof organizer === 'string'
    ? organizer.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : organizer?.initials ?? '?';

  const handleLike = () => {
    setHeartAnim(true);
    onLike?.(event);
    setTimeout(() => setHeartAnim(false), 300);
  };

  return (
    <article
      className="group bg-white rounded-card overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-forest focus-within:ring-offset-2"
      style={{ animationDelay: `${index * 80}ms` }}
      aria-labelledby={`event-title-${event.id}`}
    >
      {/* Image block - 4:3 aspect */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Top-to-bottom overlay for legible text */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"
          aria-hidden
        />

        {/* Tag pill - top left */}
        {tags[0] && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium bg-white/95 text-gray-800 shadow-sm">
            {tags[0]}
          </span>
        )}

        {/* Participant count - top right */}
        <span
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 text-white"
          aria-label={`${joinedCount} of ${capacity} participants`}
        >
          {joinedCount}/{capacity}
        </span>

        {/* Attendee avatars - bottom left, overlapping */}
        <div className="absolute bottom-3 left-3 flex -space-x-2">
          {[
            organizer?.avatarUrl ?? null,
            AVATAR_URLS[0],
            AVATAR_URLS[1],
          ].slice(0, 3).map((url, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden flex-shrink-0 shadow-sm"
            >
              {url ? (
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-xs font-semibold text-brand-forest bg-brand-terracotta/40">
                  {organizerInitials}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Hover overlay - heart & share */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 duration-200">
          <button
            type="button"
            onClick={handleLike}
            className={`p-2.5 rounded-full bg-white shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white ${
              heartAnim ? 'animate-heart' : ''
            } ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-400'}`}
            aria-label={isLiked ? 'Unlike' : 'Like'}
            aria-pressed={isLiked}
          >
            <HeartIcon filled={isLiked} />
          </button>
          <button
            type="button"
            className="p-2.5 rounded-full bg-white shadow-lg text-gray-600 hover:text-brand-forest transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Share"
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      {/* Content panel */}
      <div className="p-5">
        <h2
          id={`event-title-${event.id}`}
          className="text-card-title font-bold text-gray-900 mb-2 line-clamp-2"
        >
          {title}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
          {description}
        </p>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            <time dateTime={dateTime}>{formattedDate}</time>
          </div>
        </div>

        {/* Social counts */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <span className="flex items-center gap-1" aria-label={`${displayLikes} likes`}>
            <HeartIcon filled={isLiked} className="w-4 h-4" />
            {displayLikes}
          </span>
          <span aria-label={`${comments} comments`}>{comments} comments</span>
        </div>

        {/* Tag chips - max 3 visible, All Tags dropdown for rest */}
        <div className="relative flex flex-wrap items-center gap-2 mb-5">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-paper text-gray-700"
            >
              {tag}
            </span>
          ))}
          {hasMoreTags && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setTagsOpen((o) => !o)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-forest/20 text-brand-forest hover:bg-brand-forest/30 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-1"
                aria-expanded={tagsOpen}
                aria-haspopup="listbox"
                aria-label="Show all tags"
              >
                All Tags
              </button>
              {tagsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setTagsOpen(false)}
                  />
                  <ul
                    role="listbox"
                    className="absolute left-0 top-full mt-1 z-20 py-2 px-2 min-w-[120px] rounded-xl bg-white shadow-lg border border-gray-100"
                  >
                    <li className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
                      All tags
                    </li>
                    {tags.map((tag) => (
                      <li key={tag}>
                        <span className="block px-3 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-paper">
                          {tag}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* CTA row */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onViewDetails?.(event)}
            className="flex-1 px-4 py-2.5 rounded-full border-2 border-brand-forest text-brand-forest font-medium hover:bg-brand-forest hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2"
            aria-label={`View details for ${title}`}
          >
            View details
          </button>
          <button
            type="button"
            onClick={() => onJoin?.(event)}
            className={`px-4 py-2.5 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 ${
              isJoined
                ? 'bg-brand-forest text-white cursor-default'
                : 'bg-brand-forest/15 text-brand-forest hover:bg-brand-forest hover:text-white'
            }`}
            aria-label={isJoined ? `Already joined ${title}` : `Join ${title}`}
            disabled={isJoined}
          >
            {isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>
      </div>
    </article>
  );
}
