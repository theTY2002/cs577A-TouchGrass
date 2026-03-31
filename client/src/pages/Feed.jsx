/**
 * Feed page: Hero, Filters (docks into navbar on scroll), Event grid.
 */
import { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setTouchGrassTitle } from '../documentTitle';
import Hero from '../components/Hero';
import EventCard from '../components/EventCard';
import Filters from '../components/Filters';
import { useFeedFilters } from '../FeedFiltersContext';
import FAB from '../components/FAB';
import { MOCK_EVENTS } from '../data/events';
import { loadLocalEvents, isPlanCreatedByCurrentUser, isPlanInMyPlans } from '../localEventsStorage';
import { useSession } from '../SessionContext';

const STORAGE_LIKES = 'liked_';
const STORAGE_LIKE_COUNTS = 'like_counts';

function loadLikeCounts() {
  try {
    const s = localStorage.getItem(STORAGE_LIKE_COUNTS);
    return s ? JSON.parse(s) : {};
  } catch (_) {
    return {};
  }
}

function saveLikeCounts(counts) {
  try {
    localStorage.setItem(STORAGE_LIKE_COUNTS, JSON.stringify(counts));
  } catch (_) {}
}

function normalizeEventForFeed(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  const tags = Array.isArray(e.tags) ? e.tags : [];
  return { ...e, tags };
}

export default function Feed() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { joinedEventIds, joinEvent } = useSession();
  const sentinelRef = useRef(null);

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

  const events = useMemo(() => {
    const merged = [...loadLocalEvents(), ...MOCK_EVENTS];
    return merged.map(normalizeEventForFeed).filter(Boolean);
  }, [pathname]);

  const joinedIds = useMemo(() => new Set(joinedEventIds), [joinedEventIds]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [likeCounts, setLikeCounts] = useState(loadLikeCounts);

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
    if (!events.length) return;
    setLikedIds((prev) => {
      const next = new Set(prev);
      events.forEach((e) => {
        try {
          if (localStorage.getItem(`${STORAGE_LIKES}${e.id}`) === 'true') next.add(e.id);
        } catch (_) {}
      });
      return next;
    });
  }, [events]);

  useEffect(() => {
    events.forEach((e) => {
      const key = `${STORAGE_LIKES}${e.id}`;
      try {
        localStorage.setItem(key, likedIds.has(e.id) ? 'true' : 'false');
      } catch (_) {}
    });
  }, [likedIds, events]);

  useEffect(() => {
    saveLikeCounts(likeCounts);
  }, [likeCounts]);

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
      const target = selectedDate;
      result = result.filter((e) => (e.dateTime || e.datetime || '').slice(0, 10) === target);
    }
    if (myPlansOnly) {
      result = result.filter((e) => isPlanInMyPlans(e, joinedIds));
    }
    return result;
  }, [events, selectedTags, selectedDate, myPlansOnly, joinedIds]);

  const handleJoin = (event) => {
    joinEvent(event.id);
  };

  const handleLike = (event) => {
    const baseCount = event.likes;
    const delta = likedIds.has(event.id) ? -1 : 1;
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(event.id)) next.delete(event.id);
      else next.add(event.id);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [event.id]: (prev[event.id] ?? baseCount) + delta,
    }));
  };

  const getLikeCount = (event) => likeCounts[event.id] ?? event.likes;

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
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 transition-opacity duration-300 ${
              filteredEvents.length ? 'opacity-100' : 'opacity-70'
            }`}
          >
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="animate-card-enter opacity-0"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <EventCard
                    event={event}
                    isCreatedByUser={isPlanCreatedByCurrentUser(event)}
                    isJoined={joinedIds.has(event.id) || isPlanCreatedByCurrentUser(event)}
                    isLiked={likedIds.has(event.id)}
                    likeCount={getLikeCount(event)}
                    onViewDetails={handleViewEvent}
                    onJoin={handleJoin}
                    onLike={handleLike}
                    index={index}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 text-gray-500">
                <p className="text-lg font-medium text-gray-600">
                  {myPlansOnly
                    ? 'No plans yet — join an event or create your own to see it here.'
                    : 'No events match your filters.'}
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
            )}
          </div>
        </section>
        <FAB onClick={handleCreateEvent} label="Create Event" />
      </div>
    </>
  );
}
