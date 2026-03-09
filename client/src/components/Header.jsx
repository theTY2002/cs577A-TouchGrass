/**
 * Sticky top header with logo, avatar, and create button.
 * Edit: spacing in px-*, logo SVG
 */
import { Link, useLocation } from 'react-router-dom';

function LogoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-brand-forest"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const isLoginPage = pathname === '/login';

  return (
    <header
      className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md shadow-sm"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 text-brand-forest font-semibold hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 rounded-lg px-1"
            aria-label="TouchGrass home"
          >
            <LogoIcon />
            <span>TouchGrass</span>
          </Link>

          {/* Right: Avatar / Login */}
          <div className="flex items-center gap-3">
            <Link
              to={isLoginPage ? '/' : '/login'}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-paper text-brand-forest font-semibold hover:bg-paper/80 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 transition-all border border-brand-forest/20"
              aria-label={isLoginPage ? 'Back to home' : 'Log in'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
