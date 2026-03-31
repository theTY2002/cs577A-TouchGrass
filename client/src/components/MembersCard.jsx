/**
 * Members card: display joined members (mocked + local user if joined).
 */
import { getProfileInitials } from '../profileSettingsStorage';
import { useProfileSettings } from '../ProfileSettingsContext';

const MOCK_MEMBERS = [
  { name: 'Alex C.', initials: 'AC', avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=80&h=80&fit=crop' },
  { name: 'Jordan S.', initials: 'JS', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop' },
  { name: 'Sam R.', initials: 'SR', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop' },
];

const MAX_VISIBLE_PILLS = 6;
const STACK_MAX = 5;

export default function MembersCard({ event, joined, organizer }) {
  const { profile } = useProfileSettings();
  const localUser = {
    name: 'You',
    initials: getProfileInitials(profile?.name),
    avatarUrl: profile?.avatarDataUrl || null,
    isLocal: true,
  };

  const members = [...MOCK_MEMBERS];
  if (joined && !members.some((m) => m.isLocal)) {
    members.unshift(localUser);
  }
  const orgName = typeof organizer === 'string' ? organizer : organizer?.name;
  const displayCount = members.length;
  const visiblePills = members.slice(0, MAX_VISIBLE_PILLS);
  const overflowPills = Math.max(0, members.length - MAX_VISIBLE_PILLS);
  const stackMembers = members.slice(0, STACK_MAX);
  const stackOverflow = Math.max(0, members.length - STACK_MAX);

  return (
    <section
      className="rounded-2xl border border-stone-200/70 bg-white/90 p-6 shadow-[0_4px_32px_-10px_rgba(0,0,0,0.1),0_2px_12px_-6px_rgba(116,136,115,0.06)] ring-1 ring-black/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-stone-200/90 hover:shadow-[0_8px_36px_-10px_rgba(0,0,0,0.12)] sm:p-7"
      aria-labelledby="members-heading"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-stone-100/90 pb-5">
        <div>
          <h2 id="members-heading" className="text-sm font-semibold tracking-tight text-gray-900">
            Who&apos;s going
          </h2>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">Joined members</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-gray-900">{displayCount}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center pr-1">
            {stackMembers.map((m, i) => (
              <div
                key={`stack-${m.initials}-${i}`}
                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-br from-brand-forest/15 to-brand-terracotta/25 shadow-md transition-transform duration-200 hover:z-20 hover:scale-110"
                style={{ marginLeft: i === 0 ? 0 : -12 }}
                title={m.name}
              >
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-bold text-brand-forest">
                    {m.initials}
                  </span>
                )}
              </div>
            ))}
            {stackOverflow > 0 && (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-stone-100 text-[11px] font-bold text-gray-600 shadow-md"
                style={{ marginLeft: -12 }}
              >
                +{stackOverflow}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">Going to this event</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {visiblePills.map((m, i) => (
          <div
            key={`${m.initials}-${m.name}-${i}`}
            className="group flex items-center gap-2.5 rounded-full border border-stone-200/70 bg-stone-50/60 py-1.5 pl-1.5 pr-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-forest/25 hover:bg-white hover:shadow-md"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-brand-forest/12 to-brand-terracotta/20 ring-2 ring-white shadow-sm">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-brand-forest">
                  {m.initials}
                </span>
              )}
            </div>
            <span className="max-w-[9rem] truncate text-sm font-semibold text-gray-800">
              {m.name}
              {orgName && m.name === orgName ? ' (Organizer)' : ''}
            </span>
          </div>
        ))}
        {overflowPills > 0 && (
          <div
            className="inline-flex items-center rounded-full border border-dashed border-stone-300/90 bg-white/70 px-4 py-2 text-xs font-semibold text-gray-500 transition-colors duration-200 hover:border-brand-forest/30 hover:text-brand-forest"
            title={`${overflowPills} more not shown`}
          >
            +{overflowPills} more
          </div>
        )}
      </div>
    </section>
  );
}
