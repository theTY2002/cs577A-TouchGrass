/**
 * Filter bar (same UI for page + navbar). embedInHeader = compact navbar slot when docked.
 * Page variant: normal flow below hero (no second sticky row).
 * Edit: PRIMARY_PILLS, DROPDOWN_TAGS
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function IconSport({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8a4 4 0 11-8 0 4 4 0 018 0zM4 20c1.5-4 5.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function IconFood({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v7.5M8.25 10.5h7.5L14.25 21h-4.5L8.25 10.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5h12" />
    </svg>
  );
}

function IconEvent({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
    </svg>
  );
}

function IconMore({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9h.008v.008H6V9z" />
    </svg>
  );
}

export const PRIMARY_PILLS = [
  { label: 'Sport', value: 'Sports', Icon: IconSport },
  { label: 'Food', value: 'Food', Icon: IconFood },
  { label: 'Event', value: 'Event', Icon: IconEvent },
];

export const DROPDOWN_TAGS = [
  'Study',
  'Coffee',
  'Hiking',
  'Party',
  'Music',
  'Gaming',
];

export const ALL_TAG_VALUES = [...PRIMARY_PILLS.map((p) => p.value), ...DROPDOWN_TAGS];
export const CATEGORIES = ['All', ...ALL_TAG_VALUES];

const MAX_SUMMARY_VISIBLE = 3;

function tagLabel(value) {
  const pill = PRIMARY_PILLS.find((p) => p.value === value);
  if (pill) return pill.label;
  return value;
}

/** @returns {{ items: { key: string, label: string }[], visible: { key: string, label: string }[], overflow: number }} */
export function summarizeActiveFilters(selectedTags, selectedDate, myPlansOnly = false) {
  const items = [];
  (selectedTags ?? []).forEach((tag) => {
    items.push({ key: `tag:${tag}`, label: tagLabel(tag) });
  });
  if (selectedDate) {
    const d = new Date(`${selectedDate}T12:00:00`);
    const label = Number.isNaN(d.getTime())
      ? selectedDate
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    items.push({ key: 'date', label });
  }
  if (myPlansOnly) {
    items.push({ key: 'my-plans', label: 'My plans' });
  }
  const visible = items.slice(0, MAX_SUMMARY_VISIBLE);
  const overflow = Math.max(0, items.length - MAX_SUMMARY_VISIBLE);
  return { items, visible, overflow };
}

const pillBase =
  'inline-flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 focus:ring-offset-page active:scale-[0.97]';

const pillBaseEmbed =
  'inline-flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-1 focus:ring-offset-white active:scale-[0.97]';

const pillInactive =
  'bg-white/50 text-gray-700 border border-gray-200/90 shadow-sm hover:bg-white/80 hover:border-gray-300/90 hover:shadow';

const pillActive =
  'bg-brand-forest text-white border border-brand-forest shadow-md ring-1 ring-brand-forest/20 hover:bg-brand-forest/95 hover:shadow-md';

export default function Filters({
  embedInHeader = false,
  selectedTags = [],
  onToggleTag,
  selectedDate = '',
  onDateChange,
  onClearFilters,
  hasActiveFilters = false,
  myPlansOnly = false,
  onToggleMyPlans,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState(null);
  const moreTriggerRef = useRef(null);
  const menuPanelRef = useRef(null);
  const menuListId = useId();

  const pill = embedInHeader ? pillBaseEmbed : pillBase;
  const dateInputId = embedInHeader ? 'event-date-navbar' : 'event-date-page';
  /** Portal menu above sticky header (z-50) and page chrome */
  const portalBackdropZ = embedInHeader ? 'z-[140]' : 'z-[60]';
  const portalMenuZ = embedInHeader ? 'z-[150]' : 'z-[70]';

  const dropdownSelectedCount = useMemo(
    () => DROPDOWN_TAGS.filter((t) => selectedTags.some((s) => s.toLowerCase() === t.toLowerCase())).length,
    [selectedTags],
  );

  const summary = useMemo(
    () => summarizeActiveFilters(selectedTags, selectedDate, myPlansOnly),
    [selectedTags, selectedDate, myPlansOnly],
  );

  const isTagSelected = (value) =>
    selectedTags.some((t) => t.toLowerCase() === value.toLowerCase());

  const handleDropdownToggle = (tag) => {
    onToggleTag?.(tag);
  };

  const updateMenuPlacement = useCallback(() => {
    const el = moreTriggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const minW = Math.max(Math.ceil(r.width), 168);
    const margin = 6;
    const pad = 8;
    const maxH = Math.min(260, Math.max(120, window.innerHeight - r.bottom - margin - pad));
    let left = r.left;
    if (left + minW > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - minW - pad);
    }
    setMenuPlacement({
      top: r.bottom + margin,
      left,
      minWidth: minW,
      maxHeight: maxH,
    });
  }, []);

  useLayoutEffect(() => {
    if (!moreOpen) {
      setMenuPlacement(null);
      return undefined;
    }
    updateMenuPlacement();
    const onReposition = () => updateMenuPlacement();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [moreOpen, updateMenuPlacement]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onPointerDown = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (moreTriggerRef.current?.contains(t)) return;
      if (menuPanelRef.current?.contains(t)) return;
      setMoreOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [moreOpen]);

  const inner = (
    <>
      {hasActiveFilters && (
        <div
          className={`flex flex-wrap items-center gap-1.5 min-w-0 ${embedInHeader ? 'mb-1 text-[10px] sm:text-xs' : 'mb-2 text-xs sm:text-sm'}`}
          aria-live="polite"
        >
          <span className="text-gray-500 font-medium shrink-0">Active</span>
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            {summary.visible.map(({ key, label }) => (
              <span
                key={key}
                className="inline-flex items-center rounded-full bg-brand-forest/10 text-brand-forest px-2 py-0.5 font-semibold border border-brand-forest/15"
              >
                {label}
              </span>
            ))}
            {summary.overflow > 0 && (
              <span className="text-gray-500 font-medium tabular-nums px-0.5">
                +{summary.overflow} more
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={
          embedInHeader
            ? 'rounded-xl border border-white/70 bg-white/60 backdrop-blur-md px-2 py-1.5 shadow-sm'
            : 'rounded-2xl border border-white/60 bg-white/55 backdrop-blur-xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.5)_inset]'
        }
      >
        <div
          className={
            embedInHeader
              ? 'flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between xl:gap-2'
              : 'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4'
          }
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide scroll-px-1 pb-0.5 -mx-0.5 px-0.5 sm:flex-wrap sm:overflow-visible sm:gap-2">
              {PRIMARY_PILLS.map(({ label, value, Icon }) => {
                const on = isTagSelected(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onToggleTag?.(value)}
                    className={`${pill} ${on ? pillActive : pillInactive}`}
                    aria-pressed={on}
                    aria-label={`${on ? 'Remove' : 'Add'} ${label} filter`}
                  >
                    <Icon className={`${embedInHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0 ${on ? 'text-white' : 'text-brand-forest/80'}`} />
                    {label}
                  </button>
                );
              })}

              <div className="relative shrink-0">
                <button
                  ref={moreTriggerRef}
                  type="button"
                  id={`${menuListId}-trigger`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoreOpen((o) => !o);
                  }}
                  className={`${pill} ${dropdownSelectedCount > 0 ? pillActive : pillInactive}`}
                  aria-expanded={moreOpen}
                  aria-haspopup="listbox"
                  aria-controls={moreOpen ? menuListId : undefined}
                  aria-label="More activity tags"
                >
                  <IconMore className={`${embedInHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0 ${dropdownSelectedCount > 0 ? 'text-white' : 'text-brand-forest/80'}`} />
                  More
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`${embedInHeader ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0 opacity-80 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {moreOpen &&
                  menuPlacement &&
                  typeof document !== 'undefined' &&
                  document.body &&
                  createPortal(
                    <>
                      <div
                        className={`fixed inset-0 ${portalBackdropZ} bg-transparent`}
                        aria-hidden
                        onMouseDown={(e) => e.preventDefault()}
                      />
                      <ul
                        ref={menuPanelRef}
                        id={menuListId}
                        role="listbox"
                        aria-labelledby={`${menuListId}-trigger`}
                        style={{
                          position: 'fixed',
                          top: menuPlacement.top,
                          left: menuPlacement.left,
                          minWidth: menuPlacement.minWidth,
                          maxHeight: menuPlacement.maxHeight,
                        }}
                        className={`${portalMenuZ} origin-top overflow-y-auto rounded-lg border border-gray-200/90 bg-white py-1.5 shadow-lg shadow-black/10 ring-1 ring-black/5`}
                      >
                        {DROPDOWN_TAGS.map((tag) => {
                          const on = isTagSelected(tag);
                          return (
                            <li key={tag} role="presentation">
                              <button
                                type="button"
                                role="option"
                                aria-selected={on}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDropdownToggle(tag);
                                  setMoreOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors duration-150 focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-inset ${
                                  on
                                    ? 'bg-brand-forest/10 font-semibold text-brand-forest'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span>{tag}</span>
                                {on && (
                                  <svg className="h-4 w-4 shrink-0 text-brand-forest" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                    <path
                                      fillRule="evenodd"
                                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>,
                    document.body,
                  )}
              </div>
            </div>
          </div>

          <div
            className={
              embedInHeader
                ? 'flex flex-wrap items-center gap-1.5 shrink-0 xl:justify-end'
                : 'flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 lg:justify-end'
            }
          >
            <label htmlFor={dateInputId} className="sr-only">
              Filter by date
            </label>
            <input
              id={dateInputId}
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange?.(e.target.value)}
              className={
                embedInHeader
                  ? 'min-h-[2rem] px-2 py-1 rounded-lg border border-gray-200/90 bg-white/90 text-gray-800 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:border-transparent'
                  : 'min-h-[2.5rem] px-3 py-2 rounded-xl border border-gray-200/90 bg-white/85 text-gray-800 text-sm shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all duration-200 hover:border-gray-300 hover:bg-white'
              }
              aria-label="Filter events by date"
            />
            <button
              type="button"
              onClick={() => onToggleMyPlans?.()}
              aria-pressed={myPlansOnly}
              className={
                embedInHeader
                  ? `inline-flex items-center justify-center min-h-[2rem] px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-1 ${
                      myPlansOnly
                        ? 'bg-brand-forest text-white ring-2 ring-white/40 hover:bg-brand-forest/92'
                        : 'border border-brand-forest/40 bg-white/90 text-brand-forest hover:bg-brand-forest/10'
                    }`
                  : `inline-flex items-center justify-center min-h-[2.5rem] px-4 py-2 rounded-xl text-sm font-semibold shadow-sm active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 focus:ring-offset-white/80 ${
                      myPlansOnly
                        ? 'bg-brand-forest text-white shadow-md shadow-brand-forest/25 ring-2 ring-brand-forest/30 hover:bg-brand-forest/92 hover:shadow-lg'
                        : 'border-2 border-brand-forest/35 bg-white/90 text-brand-forest hover:bg-brand-forest/8 hover:border-brand-forest/55'
                    }`
              }
              aria-label={myPlansOnly ? 'Show all events' : 'Show only my plans'}
            >
              My Plans
            </button>
            <button
              type="button"
              onClick={() => onClearFilters?.()}
              disabled={!hasActiveFilters}
              className={
                embedInHeader
                  ? 'inline-flex items-center justify-center min-h-[2rem] px-2 py-1 rounded-lg text-xs font-semibold border border-gray-300 bg-gray-50/90 text-gray-700 shadow-sm hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:opacity-40 disabled:pointer-events-none'
                  : 'inline-flex items-center justify-center min-h-[2.5rem] px-3.5 py-2 rounded-xl text-sm font-semibold border border-gray-300 bg-gray-50/90 text-gray-700 shadow-sm hover:bg-gray-100 hover:border-gray-400 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white/80 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none'
              }
              aria-label="Clear all filters"
            >
              {embedInHeader ? 'Clear' : 'Clear filters'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (embedInHeader) {
    return (
      <div className="w-full min-w-0" aria-label="Filter events">
        {inner}
      </div>
    );
  }

  return (
    <div className="w-full" aria-label="Filter events">
      {inner}
    </div>
  );
}

/** Reusable alias — same component as default export */
export function FilterBar(props) {
  return <Filters {...props} />;
}

function IconFunnel({ className = 'h-5 w-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591V20.25A2.25 2.25 0 0112 18.75h-1.5a2.25 2.25 0 01-2.25-2.25v-4.552a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
      />
    </svg>
  );
}

const mobilePanelZ = 'z-[160]';
const mobileBackdropZ = 'z-[140]';

/**
 * Compact filter entry for small screens: funnel button opens a panel listing every event tag (+ date / my plans / clear).
 */
export function MobileFeedFiltersMenu({
  selectedTags = [],
  onToggleTag,
  selectedDate = '',
  onDateChange,
  onClearFilters,
  hasActiveFilters = false,
  myPlansOnly = false,
  onToggleMyPlans,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [placement, setPlacement] = useState(null);
  const menuId = useId();
  const dateFieldId = `${menuId}-date`;

  const isTagSelected = (value) =>
    selectedTags.some((t) => t.toLowerCase() === value.toLowerCase());

  const tagRows = useMemo(
    () =>
      ALL_TAG_VALUES.map((value) => {
        const pill = PRIMARY_PILLS.find((p) => p.value === value);
        return { value, label: pill ? pill.label : value, Icon: pill?.Icon ?? null };
      }),
    [],
  );

  const updatePlacement = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelW = Math.min(320, window.innerWidth - 16);
    let left = r.right - panelW;
    if (left < 8) left = 8;
    const below = r.bottom + 8;
    const maxH = Math.max(180, Math.min(420, window.innerHeight - below - 12));
    setPlacement({ top: below, left, width: panelW, maxHeight: maxH });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return undefined;
    }
    updatePlacement();
    const r = () => updatePlacement();
    window.addEventListener('resize', r);
    window.addEventListener('scroll', r, true);
    return () => {
      window.removeEventListener('resize', r);
      window.removeEventListener('scroll', r, true);
    };
  }, [open, updatePlacement]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const portalReady = open && placement && typeof document !== 'undefined' && document.body;

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        id={`${menuId}-trigger`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-forest/30 bg-white text-brand-forest shadow-sm transition-colors hover:bg-brand-forest/10 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 focus:ring-offset-page ${
          hasActiveFilters ? 'ring-2 ring-brand-forest/35' : ''
        }`}
        aria-label="Filters and tags"
      >
        <IconFunnel />
        {hasActiveFilters ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-forest ring-2 ring-white" aria-hidden />
        ) : null}
      </button>

      {portalReady &&
        createPortal(
          <>
            <div
              role="presentation"
              className={`fixed inset-0 ${mobileBackdropZ} cursor-default bg-black/25`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${menuId}-title`}
              style={{
                position: 'fixed',
                top: placement.top,
                left: placement.left,
                width: placement.width,
                maxHeight: placement.maxHeight,
              }}
              className={`${mobilePanelZ} flex max-h-[min(420px,85vh)] flex-col overflow-hidden rounded-xl border border-stone-200/95 bg-white shadow-xl ring-1 ring-black/5`}
            >
              <div className="shrink-0 border-b border-stone-100 px-4 py-3">
                <h2 id={`${menuId}-title`} className="text-base font-semibold text-stone-900">
                  Filters
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">Tap tags to show matching events</p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Event tags
                </p>
                {tagRows.map(({ value, label, Icon }) => {
                  const on = isTagSelected(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onToggleTag?.(value)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors focus:outline-none focus-visible:bg-stone-50 ${
                        on
                          ? 'bg-brand-forest/10 font-semibold text-brand-forest'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {Icon ? (
                        <Icon className="h-4 w-4 shrink-0 text-brand-forest/85" aria-hidden />
                      ) : (
                        <span className="w-4 shrink-0" aria-hidden />
                      )}
                      <span className="min-w-0 flex-1">{label}</span>
                      {on ? (
                        <svg
                          className="h-4 w-4 shrink-0 text-brand-forest"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="shrink-0 space-y-3 border-t border-stone-100 bg-stone-50/90 p-4">
                <div>
                  <label htmlFor={dateFieldId} className="mb-1 block text-xs font-medium text-stone-600">
                    Date
                  </label>
                  <input
                    id={dateFieldId}
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange?.(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-brand-forest/50 focus:outline-none focus:ring-2 focus:ring-brand-forest/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onToggleMyPlans?.()}
                  aria-pressed={myPlansOnly}
                  className={`w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2 ${
                    myPlansOnly
                      ? 'bg-brand-forest text-white shadow-md shadow-brand-forest/20'
                      : 'border border-brand-forest/40 bg-white text-brand-forest hover:bg-brand-forest/10'
                  }`}
                >
                  My plans
                </button>
                <button
                  type="button"
                  onClick={() => onClearFilters?.()}
                  disabled={!hasActiveFilters}
                  className="w-full rounded-lg border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-40"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
