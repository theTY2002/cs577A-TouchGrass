import { useEffect, useLayoutEffect, useState } from 'react';

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefers(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return prefers;
}

/**
 * Subtle rotating subtext: fade + small vertical motion.
 * Respects prefers-reduced-motion (static first phrase).
 */
export default function RotatingText({
  phrases,
  className = '',
  /** Time each phrase stays fully visible (ms). */
  visibleMs = 10000,
  /** Fade / slide duration (ms). */
  durationMs = 1500,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  /** idle | exit | enterPrep | enter */
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    if (reducedMotion) return;
    if (phase !== 'idle') return;
    const id = window.setTimeout(() => {
      setPhase('exit');
    }, visibleMs);
    return () => window.clearTimeout(id);
  }, [phase, reducedMotion, visibleMs]);

  useLayoutEffect(() => {
    if (phase !== 'enterPrep') return;
    const id = requestAnimationFrame(() => {
      setPhase('enter');
    });
    return () => cancelAnimationFrame(id);
  }, [phase]);

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'opacity') return;

    if (phase === 'exit') {
      setIndex((i) => (i + 1) % phrases.length);
      setPhase('enterPrep');
      return;
    }
    if (phase === 'enter') {
      setPhase('idle');
    }
  };

  const transition =
    phase === 'enterPrep'
      ? 'none'
      : `opacity ${durationMs}ms ease-in-out, transform ${durationMs}ms ease-in-out`;

  let opacity;
  let translateY;
  if (phase === 'idle') {
    opacity = 1;
    translateY = 0;
  } else if (phase === 'exit') {
    opacity = 0;
    translateY = -8;
  } else if (phase === 'enterPrep') {
    opacity = 0;
    translateY = 8;
  } else {
    opacity = 1;
    translateY = 0;
  }

  if (reducedMotion) {
    return (
      <p className={`relative m-0 min-h-[4.75rem] sm:min-h-[5.25rem] ${className}`}>
        {phrases[0]}
      </p>
    );
  }

  return (
    <p
      className={`relative m-0 min-h-[4.75rem] sm:min-h-[5.25rem] ${className}`}
      onTransitionEnd={handleTransitionEnd}
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        transition,
      }}
    >
      {phrases[index]}
    </p>
  );
}
