/**
 * “About this event” as its own card above the Group chat card (same visual language: icon tile, titles, body).
 */
export default function AboutAboveChatCard({ description = '', className = '' }) {
  const body = description?.trim() || '';
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-stone-200/80 bg-white/98 shadow-[0_8px_36px_-14px_rgba(0,0,0,0.11),0_2px_14px_-4px_rgba(116,136,115,0.09)] ring-1 ring-black/[0.04] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_12px_44px_-14px_rgba(0,0,0,0.13),0_4px_18px_-4px_rgba(116,136,115,0.1)] ${className}`.trim()}
      aria-labelledby="about-above-chat-heading"
    >
      <div className="bg-gradient-to-b from-stone-50/85 via-stone-50/40 to-white px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-forest/12 text-brand-forest"
            aria-hidden
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0-3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="about-above-chat-heading" className="text-lg font-semibold tracking-tight text-gray-900">
              About this event
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700 break-words whitespace-pre-wrap sm:text-[0.9375rem] sm:leading-[1.65]">
              {body || 'No description yet — say hi and ask the host anything.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
