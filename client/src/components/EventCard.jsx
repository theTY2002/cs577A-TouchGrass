/**
 * Image-first event card: 4:3 image, attendee avatars, tag pill.
 * Edit: card radius, truncation, avatar sizes
 */
import { useMemo, useState } from 'react';
import { getProfileInitials } from '../tools/context/profileSettingsStorage';
import { useProfileSettings } from '../tools/context/ProfileSettingsContext';

// Mock attendee avatars for overlap (using event organizer + a few placeholders)
const AVATAR_URLS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
];

const imageBadgeClass =
  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight bg-white/80 text-gray-800 backdrop-blur-sm border border-white/60 shadow-sm';

export default function EventCard({
  event,
  isJoined = false,
  isCreatedByUser = false,
  onViewDetails,
  onJoin,
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
    tags: tagsRaw,
    imageUrl,
  } = event;

  const tags = Array.isArray(tagsRaw) ? tagsRaw : [];

  /** ISO instant from posts.datetime_start (see feed / mapPostToEvent). */
  const rawDateTime =
    event.datetime_start ?? dateTime ?? event.datetime ?? '';
  let formattedDateTime = '';
  let timeDateTimeAttr = '';
  if (rawDateTime) {
    const d = new Date(rawDateTime);
    if (!Number.isNaN(d.getTime())) {
      timeDateTimeAttr = d.toISOString();
      // toLocaleDateString ignores hour/minute; use toLocaleString for start time.
      formattedDateTime = d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }

  const [tagsOpen, setTagsOpen] = useState(false);
  const visibleTags = tags.slice(0, 3);
  const hasMoreTags = tags.length > 3;

  const organizerName = typeof organizer === 'string' ? organizer : organizer?.name;
  const organizerInitials = typeof organizer === 'string'
    ? organizer.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : organizer?.initials ?? '?';

  const { profile } = useProfileSettings();
  const userPic = profile?.avatarDataUrl ?? null;
  const userInits = getProfileInitials(profile?.name);

  const avatarSlots = useMemo(() => {
    // 1. If the database provided the full members array, slice the first 3 to display
    if (event.members && event.members.length > 0) {
      return event.members.slice(0, 3).map((member) => ({
        url: member.avatarUrl,
        initials: member.initials || '?',
      }));
    }

    // 2. Fallback: If the members array isn't loaded on this screen yet, 
    // show the Organizer and the Current User (if they joined)
    const slots = [];
    
    if (isCreatedByUser) {
      slots.push({
        url: userPic,
        initials: userPic ? null : userInits || organizerInitials,
      });
    } else {
      slots.push({
        url: organizer?.avatarUrl ?? null,
        initials: organizer?.avatarUrl ? null : organizerInitials,
      });
    }

    if (isJoined && !isCreatedByUser) {
      slots.push({
        url: userPic,
        initials: userPic ? null : userInits,
      });
    }

    return slots;
  }, [
    event.members,
    isCreatedByUser,
    isJoined,
    organizer?.avatarUrl,
    organizerInitials,
    userPic,
    userInits,
  ]);

  return (
    <article
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-forest focus-within:ring-offset-2 focus-within:ring-offset-page"
      style={{ animationDelay: `${index * 80}ms` }}
      aria-labelledby={`event-title-${event.id}`}
    >
      {/* Image block - 4:3 aspect */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none"
          aria-hidden
        />

        {/* Tag pill - top left */}
        {tags[0] && (
          <span className={`absolute top-3 left-3 z-20 ${imageBadgeClass}`}>{tags[0]}</span>
        )}

        {/* Participant count - top right */}
        <span
          className={`absolute top-3 right-3 z-20 ${imageBadgeClass} tabular-nums`}
          aria-label={`${joinedCount} of ${capacity} participants`}
        >
          {joinedCount}/{capacity}
        </span>

        {/* Attendee avatars — above title strip */}
        <div className="absolute bottom-[4.25rem] left-3 z-20 flex -space-x-2">
          {avatarSlots.map((slot, i) => (
            <div
              key={i}
              className="h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white/90 bg-gray-200 shadow-sm ring-1 ring-black/5"
            >
              {slot.url ? (
                <img src={slot.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-brand-terracotta/40 text-xs font-semibold text-brand-forest">
                  {slot.initials || '?'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Title + quick meta — social-style strip */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3 pt-10 bg-gradient-to-t from-black/70 via-black/35 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <h2
              id={`event-title-${event.id}`}
              className="text-card-title font-semibold text-white tracking-tight line-clamp-2 drop-shadow-sm"
            >
              {title}
            </h2>
            {(formattedDateTime || location) && (
              <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-white/90">
                {formattedDateTime && (
                  <time dateTime={timeDateTimeAttr || undefined} className="font-medium text-white/95">
                    {formattedDateTime}
                  </time>
                )}
                {location && (
                  <p className="line-clamp-1 text-white/80">{location}</p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Content panel */}
      <div className="p-5 pt-4">
        {organizerName && (
          <p className="text-xs text-gray-500 mb-2">
            <span className="text-gray-400">Hosted by</span>{' '}
            <span className="font-medium text-gray-600">{organizerName}</span>
          </p>
        )}
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
          {description}
        </p>

        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden>
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
          {formattedDateTime && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              <time dateTime={timeDateTimeAttr || undefined}>{formattedDateTime}</time>
            </div>
          )}
        </div>

        <div className="relative flex flex-wrap items-center gap-2 mb-5">
          {isCreatedByUser && (
            <span
              className="rounded-full border-2 border-brand-forest bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-forest shadow-sm"
              title="You created this plan"
            >
              Owner
            </span>
          )}
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200/80"
            >
              {tag}
            </span>
          ))}
          {hasMoreTags && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setTagsOpen((o) => !o)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-forest/12 text-brand-forest border border-brand-forest/20 hover:bg-brand-forest/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-1"
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
                        <span className="block px-3 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onViewDetails?.(event)}
            className="flex-1 px-4 py-2.5 rounded-full border-2 border-brand-forest text-brand-forest text-sm font-semibold hover:bg-brand-forest hover:text-white active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 focus:ring-offset-white"
            aria-label={`View details for ${title}`}
          >
            View details
          </button>
          <button
            type="button"
            onClick={() => !isJoined && onJoin?.(event)}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 focus:ring-offset-white ${
              isJoined
                ? 'bg-brand-forest text-white cursor-not-allowed opacity-95'
                : 'bg-brand-forest/12 text-brand-forest border border-brand-forest/25 hover:bg-brand-forest hover:text-white hover:border-brand-forest'
            }`}
            aria-label={
              isCreatedByUser
                ? `You are hosting ${title} — joined`
                : isJoined
                  ? `Already joined ${title}`
                  : `Join ${title}`
            }
            disabled={isJoined}
          >
            {isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>
      </div>
    </article>
  );
}
