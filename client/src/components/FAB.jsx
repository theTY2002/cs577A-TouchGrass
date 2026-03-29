/**
 * Floating action button - create event. Primary green, soft shadow, hover scale.
 */
export default function FAB({ onClick, label = 'Create Event' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Create Event"
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))] z-40 flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-brand-forest p-0 text-white shadow-fab transition-[transform,box-shadow] duration-200 ease-out hover:scale-105 hover:shadow-fab-hover active:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-forest/35 focus-visible:ring-offset-2 focus-visible:ring-offset-page touch-manipulation"
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none h-7 w-7 shrink-0"
        aria-hidden
      >
        <path
          d="M12 5.5v13M5.5 12h13"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
