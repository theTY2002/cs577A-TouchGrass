/**
 * Full-bleed photo hero with brand-tinted overlay and headline.
 * Edit: image URL, overlay gradient in :root --hero-overlay
 */

import RotatingText from '../tools/ui/RotatingText';

/** Same asset as feed hero; used as default event cover when none is uploaded. */
export const FEED_HERO_IMAGE = '/bg.png';

const HERO_SUBTEXT_PHRASES = [
  'Find something to do, whenever you feel like it.',
  'See what others are up to and join when it feels right.',
  'A simple way to meet people and do things together.',
  'From study sessions to hangouts—there’s always something going on.',
  'See what’s happening and join when you feel like it.',
];

export default function Hero() {
  return (
    <section
      className="relative w-full h-[min(50vh,420px)] min-h-[320px] overflow-hidden bg-page"
      aria-labelledby="hero-heading"
    >
      {/* Full-bleed image */}
      <img
        src={FEED_HERO_IMAGE}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden
      />
      {/* Brand-tinted overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--hero-overlay)' }}
        aria-hidden
      />
      {/* Seamless fade into page background (matches --page-bg) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 sm:h-56"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--page-bg) 30%, transparent) 50%, var(--page-bg) 100%)',
        }}
        aria-hidden
      />
      {/* Content */}
      <div className="relative z-[1] h-full max-w-7xl mx-auto px-6 sm:px-8 flex flex-col justify-center">
        <div className="max-w-2xl">
          <h1
            id="hero-heading"
            className="text-hero font-extrabold text-white tracking-tight text-shadow-hero animate-[fadeSlide_0.6s_ease-out]"
          >
            Discover plans 
            <br />
            happening around you
          </h1>
          <RotatingText
            phrases={HERO_SUBTEXT_PHRASES}
            className="mt-4 text-lg sm:text-xl text-white/95 leading-relaxed max-w-xl"
          />
        </div>
      </div>
    </section>
  );
}
