/**
 * Full-bleed photo hero with brand-tinted overlay, large headline, subheading.
 * Edit: image URL, overlay gradient in :root --hero-overlay
 */
const HERO_IMAGE = '/bg.png';

export default function Hero() {
  return (
    <section
      className="relative w-full h-[min(50vh,420px)] min-h-[320px] overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Full-bleed image */}
      <img
        src={HERO_IMAGE}
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
      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-2xl">
          <h1
            id="hero-heading"
            className="text-hero font-extrabold text-white tracking-tight text-shadow-hero animate-[fadeSlide_0.6s_ease-out]"
          >
            Discover plans happening around you
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/95 leading-relaxed max-w-xl">
            Join study sessions, coffee meetups, hikes, and more. Connect with
            students who share your interests.
          </p>
        </div>
      </div>
    </section>
  );
}
