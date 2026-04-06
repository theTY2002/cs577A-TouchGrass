/**
 * App-wide TouchGrass globe mark (favicon asset: /touchgrass-icon.png).
 */
export const TOUCHGRASS_ICON_SRC = '/touchgrass-icon.png';

/** Navbar / compact inline logo */
export function TouchGrassLogoImg({ className = 'h-7 w-7 sm:h-8 sm:w-8' }) {
  return (
    <img
      src={TOUCHGRASS_ICON_SRC}
      alt=""
      className={`${className} shrink-0 object-contain`}
      width={256}
      height={256}
      decoding="async"
      aria-hidden
    />
  );
}

/** Login / signup rounded tile */
export function TouchGrassMark({ small = false }) {
  const box = small ? 'h-9 w-9' : 'h-10 w-10';
  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-md ring-1 ring-stone-200/70`}
      aria-hidden
    >
      <img
        src={TOUCHGRASS_ICON_SRC}
        alt=""
        className="h-full w-full object-contain"
        width={256}
        height={256}
        decoding="async"
      />
    </div>
  );
}

/** Feed hero: wordmark on photo background */
export function TouchGrassHeroWordmark() {
  return (
    <div className="mb-6 flex items-center gap-2.5 sm:mb-8 sm:gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/92 p-1 shadow-lg ring-1 ring-white/50 sm:h-12 sm:w-12">
        <img
          src={TOUCHGRASS_ICON_SRC}
          alt=""
          className="h-full w-full object-contain"
          width={256}
          height={256}
          decoding="async"
          aria-hidden
        />
      </div>
      <span className="text-lg font-semibold tracking-tight text-white text-shadow-hero sm:text-xl">
        TouchGrass
      </span>
    </div>
  );
}
