/**
 * Event Info Card: organizer, location, date, time, capacity, tags, Join/Leave.
 * Supporting sidebar styling — lighter elevation than main chat.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfileInitials } from '../profileSettingsStorage';
import { useProfileSettings } from '../ProfileSettingsContext';
import { useSession } from '../SessionContext';

function IconLocation({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10.11 19.02 10.31 18.933a16.136 16.136 0 008.597-8.597C19.02 10.11 19.02 9.89 18.933 9.69l-.001-.003-.002-.002a.75.75 0 00-1.061 0l-.002.002-.007.007-6.99 6.99a.75.75 0 001.06 1.061l7.012-7.013.018-.018.016-.016 3.536-3.535a1.25 1.25 0 00-1.768-1.768L10.06 15.94 3.53 9.406a1.25 1.25 0 00-1.768 1.768l3.536 3.536z" clipRule="evenodd" />
    </svg>
  );
}

function IconCalendar({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M5.25 3.5A2.75 2.75 0 002.5 6.25v9.5A2.75 2.75 0 005.25 18.5h9.5a2.75 2.75 0 002.75-2.75v-9.5a2.75 2.75 0 00-2.75-2.75h-.5V3a.75.75 0 00-1.5 0v.75h-5V3a.75.75 0 00-1.5 0v.75h-.5zM4 8.75h12v6.75A1.25 1.25 0 0114.75 16.75h-9.5A1.25 1.25 0 014 15.5V8.75z" />
    </svg>
  );
}

function IconClock({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  );
}

function IconUsers({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM4 7.5a1.5 1.5 0 113 0V8a.5.5 0 01-.5.5h-2A.5.5 0 014 8v-.5zm12 0a1.5 1.5 0 113 0V8a.5.5 0 00-.5.5h-2a.5.5 0 01-.5-.5v-.5zM4.5 10h11a1 1 0 011 1v5.5h-13V11a1 1 0 011-1z" />
    </svg>
  );
}

function MetaRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3.5 border-b border-stone-100/90 pb-5 last:border-0 last:pb-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-forest/[0.09] text-brand-forest transition-colors duration-200">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
        <dd className="mt-1 text-base font-semibold leading-snug text-gray-900">{children}</dd>
      </div>
    </div>
  );
}

export default function EventInfoCard({
  event,
  isOrganizer = false,
}) {
  const navigate = useNavigate();
  const { signedIn, isJoinedToEvent, toggleEventMembership } = useSession();
  const joined = isJoinedToEvent(event.id);

  const handleToggle = () => {
    if (!signedIn) {
      navigate('/login', {
        state: { from: `/event/${event.id}` },
      });
      return;
    }
    toggleEventMembership(event.id);
  };

  const dt = event.datetime || event.dateTime || '';
  const dateObj = dt ? new Date(dt) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '—';
  const formattedTime = dateObj
    ? dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '—';

  const { profile } = useProfileSettings();
  const org = event.organizer;
  const name = typeof org === 'string' ? org : org?.name ?? 'Unknown';
  const initials = typeof org === 'string'
    ? org.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : org?.initials ?? '?';
  const orgAvatarUrl = org?.avatarUrl;

  const { avatarUrl, hostInitials } = useMemo(() => {
    if (isOrganizer && profile?.avatarDataUrl) {
      return { avatarUrl: profile.avatarDataUrl, hostInitials: getProfileInitials(profile.name) };
    }
    if (isOrganizer) {
      return {
        avatarUrl: null,
        hostInitials: getProfileInitials(profile?.name) || initials,
      };
    }
    return { avatarUrl: orgAvatarUrl, hostInitials: orgAvatarUrl ? null : initials };
  }, [isOrganizer, profile?.avatarDataUrl, profile?.name, orgAvatarUrl, initials]);

  return (
    <aside
      className="rounded-2xl border border-stone-200/60 bg-white/85 p-6 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-stone-200/80 hover:shadow-[0_4px_28px_-8px_rgba(0,0,0,0.1)] sm:p-7"
      aria-labelledby="event-info-heading"
    >
      <div className="mb-6 border-b border-stone-100/80 pb-5">
        <h2 id="event-info-heading" className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Event details
        </h2>
        <p className="mt-1 text-xs text-gray-500">At a glance</p>
      </div>

      <div className="mb-7 flex items-start gap-4 rounded-xl bg-stone-50/50 p-4 ring-1 ring-stone-100/80">
        <div className="relative shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-brand-forest/25 to-brand-terracotta/35 shadow-lg ring-[3px] ring-white">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-brand-forest">
                {hostInitials ?? initials}
              </span>
            )}
          </div>
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Host</p>
          <p className="mt-0.5 truncate text-lg font-semibold text-gray-900">{name}</p>
          {isOrganizer && (
            <span className="mt-2 inline-flex items-center rounded-full border border-brand-forest/20 bg-gradient-to-r from-brand-terracotta/40 to-brand-terracotta/25 px-3 py-1.5 text-xs font-semibold leading-tight text-brand-forest shadow-sm ring-1 ring-white/60">
              You&apos;re the organizer
            </span>
          )}
        </div>
      </div>

      <dl className="space-y-0">
        <MetaRow icon={IconLocation} label="Location">
          {event.location || '—'}
        </MetaRow>
        <MetaRow icon={IconCalendar} label="Date">
          {formattedDate}
        </MetaRow>
        <MetaRow icon={IconClock} label="Time">
          {formattedTime}
        </MetaRow>
        <MetaRow icon={IconUsers} label="Group size">
          {event.joinedCount ?? 0} / {event.capacity ?? '—'} joined
        </MetaRow>
      </dl>

      {event.tags?.length > 0 && (
        <div className="mt-7 border-t border-stone-100/90 pt-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tags</p>
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-brand-forest/18 bg-brand-forest/[0.07] px-3 py-1.5 text-xs font-semibold text-brand-forest transition-all duration-200 hover:border-brand-forest/30 hover:bg-brand-forest/12 hover:shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {!isOrganizer && (
        <button
          type="button"
          onClick={handleToggle}
          className={`mt-7 w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2 active:scale-[0.99] ${
            joined
              ? 'border border-stone-200/90 bg-white text-gray-800 shadow-sm hover:border-stone-300 hover:bg-stone-50 hover:shadow-md'
              : 'bg-brand-forest text-white shadow-md shadow-brand-forest/25 hover:bg-brand-forest/90 hover:shadow-lg'
          }`}
          aria-label={
            joined ? 'Leave event' : signedIn ? 'Join event' : 'Sign in to join this event'
          }
          aria-pressed={joined}
        >
          {joined ? 'Leave Event' : signedIn ? 'Join Event' : 'Sign in to join'}
        </button>
      )}
    </aside>
  );
}
