/**
 * Feed page: Hero, Filters (docks into navbar on scroll), Event grid.
 */
import { useMemo, useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setTouchGrassTitle } from '../tools/ui/documentTitle';
import Hero from '../components/Hero';
import EventCard from '../components/EventCard';
import Filters from '../components/Filters';
import { useFeedFilters } from '../tools/context/FeedFiltersContext';
import FAB from '../components/FAB';
import { isPlanCreatedByCurrentUser, isPlanInMyPlans } from '../tools/cache/localEventsStorage';
import { useSession } from '../tools/cache/SessionContext';
import { fetchFeedPage, joinEvent as joinEventApi } from '../tools/api';
import { getFeedRefreshIntervalMs } from '../tools/feedRefreshMs';

const PAGE_SIZE = 30;

/** Pixels from viewport top; align with prior IntersectionObserver rootMargin -64px + small buffer. */
const DOCK_HEADROOM_PX = 72;
/** Scroll-Y gap: must scroll this far up past the dock line before undocking (prevents oscillation). */
const DOCK_UNDOCK_HYSTERESIS_PX = 56;
/** After undocking, require scrolling down this much again before docking (header/layout shifts sentinel doc position). */
const DOCK_AFTER_UNDOCK_BUFFER_PX = 40;

function normalizeEventForFeed(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  const tags = Array.isArray(e.tags) ? e.tags : [];
  return { ...e, tags };
}

async function fetchFeedFirstPage({ feedRefresh = false } = {}) {
  const res = await fetchFeedPage({
    offset: 0,
    limit: PAGE_SIZE,
    feedRefresh,
  });
  return {
    events: res.events.map(normalizeEventForFeed).filter(Boolean),
    hasMore: res.hasMore,
    nextOffset: res.events.length,
  };
}

/** YYYY-MM-DD in local time, for calendar-day comparisons. */
function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** True if the event falls on today or an earlier calendar day (local). */
function isPastOrTodayFeedEvent(event) {
  const raw = event?.dateTime || event?.datetime;
  if (!raw) return false;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  return localDateKey(d) <= localDateKey(new Date());
}

export default function Feed() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, joinedEventIds, joinEvent, sessionReady, signedIn } = useSession();
  const sentinelRef = useRef(null);
  const loadMoreSentinelRef = useRef(null);
  /** Scroll thresholds derived only while undocked — layout changes from docking do not move `window.scrollY`, so state stays stable. */
  const dockScrollYRef = useRef(Number.POSITIVE_INFINITY);
  const undockScrollYRef = useRef(0);
  const dockScrollRafRef = useRef(0);
  /** Tracks previous docked state for layout (bump thresholds before sync on undock). */
  const prevDockedForFeedLayoutRef = useRef(false);

  const {
    selectedTags,
    selectedDate,
    setSelectedDate,
    toggleTag,
    clearFilters,
    hasActiveFilters,
    myPlansOnly,
    toggleMyPlans,
    filtersDocked,
    setFiltersDocked,
  } = useFeedFilters();
  const filtersDockedRef = useRef(filtersDocked);
  filtersDockedRef.current = filtersDocked;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [joinNotice, setJoinNotice] = useState(null);
  /** Event id that returned GROUP_FULL on last Join — shown on that card only. */
  const [groupFullEventId, setGroupFullEventId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const [showPastEvents, setShowPastEvents] = useState(false);

  const joinedIds = useMemo(() => new Set(joinedEventIds), [joinedEventIds]);

  useLayoutEffect(() => {
    setTouchGrassTitle('Discover Plans');
  }, []);

  useEffect(() => {
    setFiltersDocked(false);
  }, [pathname, setFiltersDocked]);

  const recalibrateDockScrollThresholds = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    if (!mq.matches) return;
    const el = sentinelRef.current;
    if (!el) return;
    const docY = el.getBoundingClientRect().top + window.scrollY;
    const dockAt = Math.max(0, docY - DOCK_HEADROOM_PX);
    dockScrollYRef.current = dockAt;
    undockScrollYRef.current = Math.max(0, dockAt - DOCK_UNDOCK_HYSTERESIS_PX);
  }, []);

  const syncFiltersDockedFromScroll = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    if (!mq.matches) {
      setFiltersDocked(false);
      return;
    }
    const y = window.scrollY;
    setFiltersDocked((docked) => {
      if (!docked) {
        if (y >= dockScrollYRef.current) return true;
        return false;
      }
      if (y < undockScrollYRef.current) return false;
      return true;
    });
  }, [setFiltersDocked]);

  /**
   * Recompute dock/undock scroll-Y lines only in undocked layout.
   * After a dock→undock transition, bump the dock line before syncing so layout/header shifts
   * cannot cause an immediate re-dock in the same frame as useLayoutEffect (must run before paint).
   */
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    if (!mq.matches) return;

    if (filtersDocked) {
      prevDockedForFeedLayoutRef.current = true;
      return;
    }

    recalibrateDockScrollThresholds();

    const wasDocked = prevDockedForFeedLayoutRef.current;
    prevDockedForFeedLayoutRef.current = false;

    if (wasDocked) {
      const y = window.scrollY;
      dockScrollYRef.current = Math.max(
        dockScrollYRef.current,
        y + DOCK_AFTER_UNDOCK_BUFFER_PX,
      );
      undockScrollYRef.current = Math.max(0, dockScrollYRef.current - DOCK_UNDOCK_HYSTERESIS_PX);
    }

    syncFiltersDockedFromScroll();
  }, [
    filtersDocked,
    loading,
    pathname,
    recalibrateDockScrollThresholds,
    syncFiltersDockedFromScroll,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return undefined;
    }
    const mq = window.matchMedia('(min-width: 768px)');

    const runSync = () => {
      if (!mq.matches) {
        setFiltersDocked(false);
        return;
      }
      syncFiltersDockedFromScroll();
    };

    const onScroll = () => {
      cancelAnimationFrame(dockScrollRafRef.current);
      dockScrollRafRef.current = requestAnimationFrame(runSync);
    };

    const onResize = () => {
      cancelAnimationFrame(dockScrollRafRef.current);
      dockScrollRafRef.current = requestAnimationFrame(() => {
        if (!mq.matches) {
          setFiltersDocked(false);
          return;
        }
        if (!filtersDockedRef.current) {
          recalibrateDockScrollThresholds();
        }
        syncFiltersDockedFromScroll();
      });
    };

    const onMqChange = () => {
      if (!mq.matches) {
        setFiltersDocked(false);
        return;
      }
      recalibrateDockScrollThresholds();
      syncFiltersDockedFromScroll();
    };

    runSync();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    mq.addEventListener('change', onMqChange);
    return () => {
      cancelAnimationFrame(dockScrollRafRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      mq.removeEventListener('change', onMqChange);
    };
  }, [recalibrateDockScrollThresholds, syncFiltersDockedFromScroll, setFiltersDocked]);

  useEffect(() => {
    if (!sessionReady || !signedIn) return undefined;

    let cancelled = false;

    async function loadFirstPage() {
      setLoading(true);
      setError(null);
      setEvents([]);
      setHasMore(true);
      setNextOffset(0);
      try {
        const data = await fetchFeedFirstPage();
        if (cancelled) return;
        setEvents(data.events);
        setHasMore(data.hasMore);
        setNextOffset(data.nextOffset);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load feed');
          setEvents([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [sessionReady, signedIn]);

  /** Periodic refresh of the first feed page while signed in (does not show full-page loading). */
  useEffect(() => {
    if (!sessionReady || !signedIn) return undefined;
    const intervalMs = getFeedRefreshIntervalMs();
    let cancelled = false;
    const id = setInterval(() => {
      void (async () => {
        try {
          const data = await fetchFeedFirstPage({ feedRefresh: true });
          if (cancelled) return;
          setEvents(data.events);
          setHasMore(data.hasMore);
          setNextOffset(data.nextOffset);
        } catch {
          /* keep existing list on background refresh failure */
        }
      })();
    }, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sessionReady, signedIn]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await fetchFeedPage({
        offset: nextOffset,
        limit: PAGE_SIZE,
      });
      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        const merged = [...prev];
        for (const raw of res.events) {
          const e = normalizeEventForFeed(raw);
          if (!e || seen.has(e.id)) continue;
          seen.add(e.id);
          merged.push(e);
        }
        return merged;
      });
      setHasMore(res.hasMore);
      setNextOffset((o) => o + res.events.length);
    } catch (e) {
      setError(e?.message || 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, nextOffset]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const el = loadMoreSentinelRef.current;
    if (!el || !hasMore || loading) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { root: null, rootMargin: '240px', threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadMore]);

  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (selectedTags.length > 0) {
      result = result.filter((e) =>
        selectedTags.some((tag) =>
          (e.tags ?? []).some((t) => String(t).toLowerCase() === tag.toLowerCase()),
        ),
      );
    }
    if (selectedDate) {
      result = result.filter((e) => (e.dateTime || e.datetime || '').slice(0, 10) === selectedDate);
    }
    if (myPlansOnly) {
      result = result.filter((e) => isPlanInMyPlans(e, joinedIds, user));
    }
    return result;
  }, [events, selectedTags, selectedDate, myPlansOnly, joinedIds, user]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const past = [];
    const upcoming = [];
    for (const e of filteredEvents) {
      if (isPastOrTodayFeedEvent(e)) past.push(e);
      else upcoming.push(e);
    }
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [filteredEvents]);

  const handleJoin = async (event) => {
    if (user?.id == null) return;
    setJoinNotice(null);
    setGroupFullEventId(null);
    try {
      const data = await joinEventApi(event.id, user.id);
      if (data?.current_members != null) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === event.id ? { ...e, joinedCount: data.current_members } : e,
          ),
        );
      }
      joinEvent(event.id);
    } catch (e) {
      const full = e?.status === 409 && e?.code === "GROUP_FULL";
      if (full) {
        setGroupFullEventId(event.id);
      } else {
        setJoinNotice(e?.message || "Could not join this event.");
      }
    }
  };

  const handleViewEvent = (event) => {
    navigate(`/event/${event.id}`);
  };

  const handleCreateEvent = () => {
    navigate('/event/new');
  };

  const filterProps = {
    selectedTags,
    onToggleTag: toggleTag,
    selectedDate,
    onDateChange: setSelectedDate,
    onClearFilters: clearFilters,
    hasActiveFilters,
    myPlansOnly,
    onToggleMyPlans: toggleMyPlans,
  };

  const showEmpty = !loading && !error && filteredEvents.length === 0;
  const showUpcomingEmpty =
    !loading &&
    !error &&
    filteredEvents.length > 0 &&
    upcomingEvents.length === 0;

  return (
    <>
      <Hero />
      <div className="relative bg-page">
        <div className="hidden md:block">
          <div ref={sentinelRef} className="h-px w-full shrink-0" aria-hidden />

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
              filtersDocked ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                className={`max-w-7xl mx-auto px-6 sm:px-8 pt-2 pb-4 transition-all duration-300 ease-out motion-reduce:transition-none ${
                  filtersDocked
                    ? 'opacity-0 -translate-y-1 pointer-events-none'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                <Filters embedInHeader={false} {...filterProps} />
              </div>
            </div>
          </div>
        </div>

        <section
          className="max-w-7xl mx-auto px-6 sm:px-8 py-8 pb-28"
          aria-label="Event listings"
        >
          {error && (
            <div
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          {joinNotice && (
            <div
              className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="alert"
              aria-live="polite"
            >
              <span>{joinNotice}</span>
              <button
                type="button"
                onClick={() => setJoinNotice(null)}
                className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold text-amber-900/80 hover:bg-amber-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Dismiss notice"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-20 text-neutral-500" aria-busy="true">
              Loading events…
            </div>
          )}

          {!loading && (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 transition-opacity duration-300 ${
                filteredEvents.length ? 'opacity-100' : 'opacity-70'
              }`}
            >
              {showUpcomingEmpty && (
                <div className="col-span-full rounded-xl border border-neutral-200 bg-white/60 px-4 py-8 text-center text-neutral-600">
                  <p className="text-base font-medium text-neutral-800">
                    No upcoming events{hasActiveFilters ? ' match your filters' : ''}.
                  </p>
                  {pastEvents.length > 0 && (
                    <p className="mt-2 text-sm text-neutral-500">
                      Past events are below — use Show to reveal them.
                    </p>
                  )}
                </div>
              )}

              {upcomingEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="animate-card-enter h-full min-h-0 opacity-0"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <EventCard
                    event={event}
                    isCreatedByUser={isPlanCreatedByCurrentUser(event, user)}
                    isJoined={
                      joinedIds.has(event.id) || isPlanCreatedByCurrentUser(event, user)
                    }
                    showGroupFull={groupFullEventId === event.id}
                    onViewDetails={handleViewEvent}
                    onJoin={handleJoin}
                    index={index}
                  />
                </div>
              ))}

              {pastEvents.length > 0 && (
                <div className="col-span-full mt-2 border-t border-neutral-200 pt-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-neutral-900">Past events</h2>
                    <button
                      type="button"
                      onClick={() => setShowPastEvents((v) => !v)}
                      className="inline-flex w-fit items-center justify-center rounded-full border-2 border-brand-forest bg-white px-5 py-2.5 text-sm font-semibold text-brand-forest shadow-sm transition-all duration-200 hover:bg-brand-forest hover:text-white active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 focus:ring-offset-page"
                      aria-expanded={showPastEvents}
                    >
                      {showPastEvents ? 'Hide past events' : 'Show past events'}
                    </button>
                  </div>
                  {showPastEvents && (
                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
                      {pastEvents.map((event, index) => (
                        <div
                          key={event.id}
                          className="animate-card-enter h-full min-h-0 opacity-0"
                          style={{ animationDelay: `${index * 80}ms` }}
                        >
                          <EventCard
                            event={event}
                            isCreatedByUser={isPlanCreatedByCurrentUser(event, user)}
                            isJoined={
                              joinedIds.has(event.id) ||
                              isPlanCreatedByCurrentUser(event, user)
                            }
                            showGroupFull={groupFullEventId === event.id}
                            onViewDetails={handleViewEvent}
                            onJoin={handleJoin}
                            index={index}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {hasMore && !showEmpty && (
                <div
                  ref={loadMoreSentinelRef}
                  className="col-span-full flex min-h-[48px] justify-center py-6 text-sm text-neutral-500"
                  aria-hidden
                >
                  {loadingMore ? 'Loading more…' : null}
                </div>
              )}

              {showEmpty ? (
                <div className="col-span-full text-center py-16 text-gray-500">
                  <p className="text-lg font-medium text-gray-600">
                    {myPlansOnly
                      ? 'No plans yet — join an event or create your own to see it here.'
                      : hasActiveFilters
                        ? 'No events match your filters.'
                        : 'No events yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-full border-2 border-brand-forest bg-white px-5 py-2.5 text-sm font-semibold text-brand-forest shadow-sm transition-all duration-200 hover:bg-brand-forest hover:text-white active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 focus:ring-offset-page"
                    aria-label="Clear filters"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </section>
        <FAB onClick={handleCreateEvent} label="Create Event" />
      </div>
    </>
  );
}
