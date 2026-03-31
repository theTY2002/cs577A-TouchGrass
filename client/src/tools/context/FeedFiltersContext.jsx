/**
 * Feed filter state shared between Header (inline bar) and Feed (grid).
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const FeedFiltersContext = createContext(null);

export function FeedFiltersProvider({ children }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  /** Show only events/plans created by the current user (local + demo owned id). */
  const [myPlansOnly, setMyPlansOnly] = useState(false);
  /** True when the feed filter bar has scrolled up and is shown in the navbar (discover only). */
  const [filtersDocked, setFiltersDocked] = useState(false);

  const toggleTag = useCallback((tag) => {
    setSelectedTags((prev) => {
      const i = prev.findIndex((t) => t.toLowerCase() === tag.toLowerCase());
      if (i >= 0) return prev.filter((_, idx) => idx !== i);
      return [...prev, tag];
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTags([]);
    setSelectedDate('');
    setMyPlansOnly(false);
  }, []);

  const toggleMyPlans = useCallback(() => {
    setMyPlansOnly((v) => !v);
  }, []);

  const hasActiveFilters = selectedTags.length > 0 || selectedDate !== '' || myPlansOnly;

  const value = useMemo(
    () => ({
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
    }),
    [selectedTags, selectedDate, toggleTag, clearFilters, hasActiveFilters, myPlansOnly, toggleMyPlans, filtersDocked],
  );

  return (
    <FeedFiltersContext.Provider value={value}>{children}</FeedFiltersContext.Provider>
  );
}

export function useFeedFilters() {
  const ctx = useContext(FeedFiltersContext);
  if (!ctx) {
    throw new Error('useFeedFilters must be used within FeedFiltersProvider');
  }
  return ctx;
}
