/**
 * Main app: Header, Hero, Filters, Event grid, FAB.
 * Client-side filtering (pill toggle, date), like state, staggered card entrance.
 * Edit: spacing, filter logic
 */
import { useMemo, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Filters from './components/Filters';
import EventCard from './components/EventCard';
import FAB from './components/FAB';
import { MOCK_EVENTS } from './data/events';

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [likedIds, setLikedIds] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});

  const hasActiveFilters = activeCategory !== 'All' || selectedDate !== '';

  const handleCategoryChange = (cat) => {
    setActiveCategory((prev) => (prev === cat ? 'All' : cat));
  };

  const filteredEvents = useMemo(() => {
    let result = [...MOCK_EVENTS];

    if (activeCategory !== 'All') {
      result = result.filter((e) =>
        e.tags.some((t) => t.toLowerCase() === activeCategory.toLowerCase())
      );
    }

    if (selectedDate) {
      const target = selectedDate;
      result = result.filter((e) => e.dateTime.slice(0, 10) === target);
    }

    return result;
  }, [activeCategory, selectedDate]);

  const handleClearFilters = () => {
    setActiveCategory('All');
    setSelectedDate('');
  };

  const handleJoin = (event) => {
    setJoinedIds((prev) => new Set(prev).add(event.id));
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

  const getLikeCount = (event) =>
    likeCounts[event.id] ?? event.likes;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      <Hero />

      <main className="flex-1 relative">
        <Filters
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <section
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24"
          aria-label="Event listings"
        >
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${
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
                    isJoined={joinedIds.has(event.id)}
                    isLiked={likedIds.has(event.id)}
                    likeCount={getLikeCount(event)}
                    onViewDetails={(e) => console.log('View', e.title)}
                    onJoin={handleJoin}
                    onLike={handleLike}
                    index={index}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 text-gray-500">
                <p className="text-lg">No events match your filters.</p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 text-brand-forest hover:underline focus:outline-none focus:ring-2 focus:ring-brand-forest rounded"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        <FAB />
      </main>
    </div>
  );
}

export default App;
