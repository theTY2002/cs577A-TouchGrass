/**
 * Floating action button - create post. Elevated with halo, hover scale.
 * Edit: position (bottom/right), halo color
 */
export default function FAB({ onClick, label = 'Create new post' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-brand-forest text-white shadow-fab hover:shadow-fab-hover hover:scale-110 active:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-brand-forest/40 focus:ring-offset-2"
      aria-label={label}
    >
      {/* Halo / glow */}
      <span
        className="absolute inset-0 rounded-full bg-brand-forest opacity-30 blur-xl -z-10"
        aria-hidden
      />
      <span className="text-2xl font-light leading-none" aria-hidden>
        +
      </span>
    </button>
  );
}
