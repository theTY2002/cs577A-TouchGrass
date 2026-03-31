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

const PAGE_SIZE = 30;

function normalizeEventForFeed(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  const tags = Array.isArray(e.tags) ? e.tags : [];
  return { ...e, tags };
}

export default function Feed() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, joinedEventIds, joinEvent, sessionReady, signedIn } = useSession();
  const sentinelRef = useRef(null);
  const loadMoreSentinelRef = useRef(null);

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

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);

  const joinedIds = useMemo(() => new Set(joinedEventIds), [joinedEventIds]);

  useLayoutEffect(() => {
    setTouchGrassTitle('Discover Plans');
  }, []);

  useEffect(() => {
    setFiltersDocked(false);
  }, [pathname, setFiltersDocked]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || typeof window.matchMedia === 'undefined') {
      return undefined;
    }
    const mq = window.matchMedia('(min-width: 768px)');
    let obs = null;

    const sync = () => {
      const el = sentinelRef.current;
      if (obs) {
        obs.disconnect();
        obs = null;
      }
      if (!mq.matches) {
        setFiltersDocked(false);
        return;
      }
      if (!el) return;
      obs = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (!e) return;
          setFiltersDocked(!e.isIntersecting);
        },
        { root: null, rootMargin: '-64px 0px 0px 0px', threshold: 0 },
      );
      obs.observe(el);
    };

    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      if (obs) obs.disconnect();
    };
  }, [pathname, setFiltersDocked]);

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
        const res = await fetchFeedPage({
          offset: 0,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setEvents(res.events.map(normalizeEventForFeed).filter(Boolean));
        setHasMore(res.hasMore);
        setNextOffset(res.events.length);
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

  const handleJoin = async (event) => {
    try {
      if (user?.id != null) {
        const data = await joinEventApi(event.id, user.id);
        if (data?.current_members != null) {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === event.id ? { ...e, joinedCount: data.current_members } : e,
            ),
          );
        }
      }
    } catch {
      /* still update local session for UX */
    }
    joinEvent(event.id);
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
              {filteredEvents.length > 0 ? (
                <>
                  {filteredEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="animate-card-enter opacity-0"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <EventCard
                        event={event}
                        isCreatedByUser={isPlanCreatedByCurrentUser(event, user)}
                        isJoined={
                          joinedIds.has(event.id) || isPlanCreatedByCurrentUser(event, user)
                        }
                        onViewDetails={handleViewEvent}
                        onJoin={handleJoin}
                        index={index}
                      />
                    </div>
                  ))}
                  {hasMore && (
                    <div
                      ref={loadMoreSentinelRef}
                      className="col-span-full flex min-h-[48px] justify-center py-6 text-sm text-neutral-500"
                      aria-hidden
                    >
                      {loadingMore ? 'Loading more…' : null}
                    </div>
                  )}
                </>
              ) : showEmpty ? (
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
