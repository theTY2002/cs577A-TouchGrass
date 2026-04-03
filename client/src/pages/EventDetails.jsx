/**
 * Event Details page: hero banner, EventInfoCard, ChatPanel (inline on desktop, popup on mobile).
 * Dynamic route /event/:id.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useLayoutEffect } from 'react';
import { setTouchGrassTitle } from '../tools/ui/documentTitle';
import { getEvent } from '../tools/api';
import { isLocalUserEventId, DEMO_USER_OWNED_EVENT_ID } from '../tools/cache/localEventsStorage';
import EventInfoCard from '../components/EventInfoCard';
import ChatPanel from '../components/ChatPanel';
import AboutAboveChatCard from '../components/AboutCard';
import MembersCard from '../components/MembersCard';
import { useSession } from '../tools/cache/SessionContext';

const pageShellClass =
  'min-h-screen bg-gradient-to-b from-[#E8E2D8] via-[#F2EDE4] to-[#EAE4DA]';

const btnSecondaryClass =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-white/15 border border-white/25 backdrop-blur-md shadow-md shadow-black/10 transition-all duration-200 hover:bg-white/25 hover:border-white/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30';

const btnEditHeroClass =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white border-2 border-white/90 bg-white/10 backdrop-blur-sm shadow-md shadow-black/15 transition-all duration-200 hover:bg-white hover:text-brand-forest hover:border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isJoinedToEvent } = useSession();
  const [event, setEvent] = useState(null);
  const [lookupDone, setLookupDone] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    async function fetchEventDetails() {
      try {
        // Fetch the live data from PostgreSQL!
        const fetchedEvent = await getEvent(id);
        setEvent(fetchedEvent);
      } catch (error) {
        console.error("Could not fetch event:", error);
        setEvent(null);
      } finally {
        setLookupDone(true);
      }
    }
    
    fetchEventDetails();
  }, [id]);

  useLayoutEffect(() => {
    if (!lookupDone) {
      setTouchGrassTitle('Loading...');
      return;
    }
    if (!event) {
      setTouchGrassTitle('Event not found');
      return;
    }
    const name = (event.title || 'Event').trim() || 'Event';
    setTouchGrassTitle(name.length > 80 ? `${name.slice(0, 77)}…` : name);
  }, [event, lookupDone]);

  if (!lookupDone) {
    return (
      <div className={`${pageShellClass} flex items-center justify-center min-h-[60vh]`}>
        <p className="text-sm font-medium text-gray-500">Loading…</p>
      </div>
    );
  }

  if (lookupDone && !event) {
    return (
      <div className={`${pageShellClass} min-h-[60vh] flex flex-col items-center justify-center px-4`}>
        <div className="text-center max-w-md rounded-2xl bg-white/80 backdrop-blur-sm border border-stone-200/60 shadow-card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Event not found</h1>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            The event you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <button
            type="button"
            onClick={() => navigate('/feed')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-forest text-white text-sm font-semibold shadow-md shadow-brand-forest/25 hover:bg-brand-forest/90 hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2"
            aria-label="Back to feed"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const ownerUserId = event.ownerUserId != null ? String(event.ownerUserId) : '';
  const ownerEmail = String(event.ownerEmail || '').trim().toLowerCase();
  const userId = user?.id != null ? String(user.id) : '';
  const userEmail = String(user?.email || '').trim().toLowerCase();
  const isOrganizer =
    (ownerUserId && userId && ownerUserId === userId) ||
    (ownerEmail && userEmail && ownerEmail === userEmail) ||
    ((!ownerUserId && !ownerEmail) &&
      (isLocalUserEventId(event.id) || String(event.id) === DEMO_USER_OWNED_EVENT_ID));
  const joined = isJoinedToEvent(event.id);
  /** Hosts can always use chat; guests need to join first. */
  const chatUnlocked = joined || isOrganizer;
  const imageUrl = event.imageUrl;

  return (
    <div className={`animate-fade-in ${pageShellClass}`}>
      {/* Hero: cinematic header with title + actions */}
      <section className="relative" aria-labelledby="event-title">
        <div className="relative h-[min(48vh,420px)] min-h-[240px] sm:min-h-[280px] overflow-hidden">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
              />
              {/* Readable on any image: stack smooth gradients (bright-safe default, no JS). */}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 from-0% via-transparent via-[30%] to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.88] via-black/[0.42] via-[45%] to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/72 via-black/28 via-[48%] to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 125% 95% at 0% 100%, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.38) 48%, transparent 72%)',
                }}
                aria-hidden
              />
            </>
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-brand-forest/80 via-brand-forest/50 to-brand-terracotta/50"
              aria-hidden
            />
          )}

          <div className="absolute inset-0 z-10 flex flex-col p-4 sm:p-6 lg:px-10 lg:pb-10 lg:pt-8">
            <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className={btnSecondaryClass}
                aria-label="Back to feed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-90" aria-hidden>
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                Back to Feed
              </button>
              {isOrganizer && (
                <button
                  type="button"
                  onClick={() => navigate(`/event/${event.id}/edit`)}
                  className={`${btnEditHeroClass} sm:order-none`}
                  aria-label="Edit event"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d="M2.695 14.493l1.07 3.3a1 1 0 001.234.654l3.288-1.096a2 2 0 00.822-.55l8.783-8.784a1.875 1.875 0 000-2.651L17.65 1.857a1.875 1.875 0 00-2.652 0L6.214 10.63a2 2 0 00-.55.832l-1.096 3.29a1 1 0 00.127.743z" />
                  </svg>
                  Edit Event
                </button>
              )}
            </div>

            <div className="mt-auto max-w-4xl pb-6 pt-8 pr-2 sm:pb-8 sm:pt-12 sm:pr-6 lg:pr-8">
              <h1
                id="event-title"
                className="text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl text-shadow-hero-title"
              >
                {event.title}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Cards: sidebar (narrow) + chat (dominant) */}
      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-14 pt-8 sm:space-y-10 sm:px-6 sm:pt-10 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="animate-card-enter lg:col-span-4" style={{ animationDelay: '40ms' }}>
            <EventInfoCard
              event={event}
              isOrganizer={isOrganizer}
              onJoinSuccess={(data) => {
                if (data?.current_members == null) return;
                setEvent((prev) =>
                  prev ? { ...prev, joinedCount: data.current_members } : prev,
                );
              }}
              onLeaveSuccess={(data) => {
                const uid = user?.id != null ? String(user.id) : null;
                setEvent((prev) => {
                  if (!prev) return prev;
                  const members =
                    uid && Array.isArray(prev.members)
                      ? prev.members.filter((m) => String(m.id) !== uid)
                      : prev.members;
                  return {
                    ...prev,
                    joinedCount:
                      data?.current_members != null
                        ? data.current_members
                        : prev.joinedCount,
                    members,
                  };
                });
              }}
            />
          </div>
          <div className="animate-card-enter flex min-h-0 flex-col gap-5 lg:col-span-8 sm:gap-6" style={{ animationDelay: '70ms' }}>
            <AboutAboveChatCard description={event.description} />
            <div className="hidden min-h-0 lg:block lg:min-h-[min(580px,64vh)]">
              <ChatPanel eventId={event.id} chatUnlocked={chatUnlocked} />
            </div>
          </div>
        </div>

        <div className="animate-card-enter" style={{ animationDelay: '100ms' }}>
          <MembersCard
            event={event}
            joined={joined}
            organizer={event.organizer}
          />
        </div>
      </div>

      {/* Floating chat shortcut (mobile) */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-brand-forest text-white shadow-fab hover:shadow-fab-hover hover:scale-110 active:scale-105 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-forest/40 focus-visible:ring-offset-2"
        aria-label={
          chatUnlocked
            ? 'Open group chat'
            : 'Open group chat — join the event to read and send messages'
        }
      >
        <span className="text-2xl" aria-hidden>
          {chatUnlocked ? '💬' : '🔒'}
        </span>
      </button>

      {chatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Group chat"
        >
          <button
            type="button"
            onClick={() => setChatOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] focus:outline-none transition-opacity"
            aria-label="Close chat"
          />
          <div
            className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-stone-200/70 bg-bg-white shadow-[0_24px_64px_-12px_rgba(0,0,0,0.25),0_12px_32px_-8px_rgba(116,136,115,0.12)] animate-fade-in ring-1 ring-black/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100/90 bg-gradient-to-b from-stone-50/90 to-stone-50/40 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-gray-900">Group chat</h2>
                <p className="mt-0.5 text-xs text-gray-500">Plan together · this event</p>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-brand-forest hover:bg-brand-forest/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4">
              <AboutAboveChatCard description={event.description} className="shrink-0" />
              <div className="flex min-h-[min(42vh,320px)] flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200/70 bg-bg-white shadow-md ring-1 ring-black/[0.04]">
                <div className="flex h-full min-h-0 flex-1 flex-col">
                  <ChatPanel eventId={event.id} inModal chatUnlocked={chatUnlocked} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
