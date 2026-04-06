import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router does not reset window scroll on path changes. After a long feed scroll,
 * opening event details would keep that Y offset — useLayoutEffect runs before paint.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search, hash]);

  return null;
}
