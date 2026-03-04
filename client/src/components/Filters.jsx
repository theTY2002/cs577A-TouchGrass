/**
 * Filter pills: Sport, Food, Event (visible) + All (dropdown with remaining tags).
 * Edit: PRIMARY_PILLS, DROPDOWN_TAGS
 */
import { useState } from 'react';

export const PRIMARY_PILLS = [
  { label: 'None', value: 'None' },
  { label: 'Sport', value: 'Sports' },
  { label: 'Food', value: 'Food' },
  { label: 'Event', value: 'Event' },
];

export const DROPDOWN_TAGS = [
  'Study',
  'Coffee',
  'Hiking',
  'Party',
  'Music',
  'Gaming',
];

export const CATEGORIES = ['All', ...PRIMARY_PILLS.map((p) => p.value), ...DROPDOWN_TAGS];

export default function Filters({
  activeCategory,
  onCategoryChange,
  selectedDate,
  onDateChange,
  onClearFilters,
  hasActiveFilters,
}) {
  const [allDropdownOpen, setAllDropdownOpen] = useState(false);

  const isActive = (value) => {
    if (value === 'None') return activeCategory === value || activeCategory === 'All';
    return activeCategory === value;
  };

  const handlePillClick = (value) => {
    if (value === 'None') {
      onCategoryChange('All');
    } else {
      onCategoryChange(isActive(value) ? 'All' : value);
    }
  };

  const handleDropdownSelect = (tag) => {
    onCategoryChange(activeCategory === tag ? 'All' : tag);
    setAllDropdownOpen(false);
  };

  const isDropdownTagActive = DROPDOWN_TAGS.includes(activeCategory);

  return (
    <section className="bg-cream py-6" aria-label="Filter events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Pills: Sport, Food, Event, All (dropdown) */}
          <div className="flex flex-wrap items-center gap-3">
            {PRIMARY_PILLS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => handlePillClick(value)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-pill text-sm font-medium whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 hover:scale-105 ${
                  isActive(value)
                    ? 'bg-brand-forest text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                }`}
                aria-pressed={isActive(value)}
                aria-label={`Filter by ${label}`}
              >
                {label}
              </button>
            ))}

            {/* All - dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAllDropdownOpen((o) => !o)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-pill text-sm font-medium whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 hover:scale-105 ${
                  isDropdownTagActive
                    ? 'bg-brand-forest text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                }`}
                aria-expanded={allDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Show all tags"
              >
                All
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-4 h-4 transition-transform ${allDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {allDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setAllDropdownOpen(false)}
                  />
                  <ul
                    role="listbox"
                    className="absolute left-0 top-full mt-1 z-20 py-2 min-w-[140px] rounded-xl bg-white shadow-lg border border-gray-100"
                  >
                    {DROPDOWN_TAGS.map((tag) => (
                      <li key={tag}>
                        <button
                          type="button"
                          role="option"
                          onClick={() => handleDropdownSelect(tag)}
                          className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-inset ${
                            activeCategory === tag
                              ? 'bg-brand-forest/10 text-brand-forest font-medium'
                              : 'text-gray-700 hover:bg-paper'
                          }`}
                        >
                          {tag}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Date + My Event + Clear */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <label htmlFor="event-date" className="sr-only">
              Filter by date
            </label>
            <input
              id="event-date"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-4 py-2.5 rounded-pill border border-gray-200 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
              aria-label="Filter events by date"
            />
            <a
              href="#"
              className="px-5 py-2.5 rounded-pill bg-brand-forest text-white font-medium hover:bg-brand-forest/90 shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2"
              aria-label="Go to My Event"
            >
              My Event
            </a>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="px-3 py-2 text-sm text-brand-forest hover:underline focus:outline-none focus:ring-2 focus:ring-brand-forest rounded"
                aria-label="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
