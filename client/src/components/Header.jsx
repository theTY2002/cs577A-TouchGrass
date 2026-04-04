/**
 * Sticky top header: logo, optional centered discover filters (when docked), user menu.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../tools/cache/SessionContext';
import { setTouchGrassTitle } from '../tools/ui/documentTitle';
import { useFeedFilters } from '../tools/context/FeedFiltersContext';
import Filters, { MobileFeedFiltersMenu } from './Filters';
import { TouchGrassLogoImg } from './TouchGrassIcon';
import { getProfileInitials } from '../tools/context/profileSettingsStorage';
import { useProfileSettings } from '../tools/context/ProfileSettingsContext';

function menuItemClass() {
  return 'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-brand-forest hover:bg-bg-paper transition-colors focus:outline-none focus:bg-bg-paper';
}

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signedIn: authed, signOut, user } = useSession();
  const { profile } = useProfileSettings();
  const feedFilters = useFeedFilters();
  const showFeedFilters = authed && pathname === '/feed';
  const { filtersDocked } = feedFilters;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    setOpen(false);
    signOut();
    navigate('/login');
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-page/90 backdrop-blur-md border-b border-brand-forest/10 transition-shadow duration-300 ${
        showFeedFilters && filtersDocked ? 'shadow-md' : 'shadow-sm'
      }`}
      role="banner"
    >
      <div className="w-full px-2 sm:px-3 py-1.5 sm:py-2">
        <div
          className={`flex items-center gap-2 sm:gap-3 w-full min-h-12 sm:min-h-14 ${
            showFeedFilters ? '' : 'justify-between'
          }`}
        >
          <Link
            to="/feed"
            onClick={() => setTouchGrassTitle('Feed')}
            className="flex items-center gap-2 text-brand-forest font-semibold hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 rounded-lg p-1 shrink-0"
            aria-label="TouchGrass home"
          >
            <TouchGrassLogoImg className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
            <span className="hidden min-[380px]:inline">TouchGrass</span>
          </Link>

          {showFeedFilters && (
            <div
              className={`hidden md:flex flex-1 justify-center min-w-0 overflow-x-hidden overflow-y-auto transition-all duration-300 ease-out motion-reduce:transition-none ${
                filtersDocked
                  ? 'opacity-100 translate-y-0 max-h-[min(42vh,320px)] sm:max-h-[280px]'
                  : 'opacity-0 translate-y-2 max-h-0 pointer-events-none'
              }`}
            >
              {filtersDocked && (
                <div className="w-full max-w-5xl min-w-0 px-0 sm:px-1 animate-filter-dock-in">
                  <Filters
                    embedInHeader
                    selectedTags={feedFilters.selectedTags}
                    onToggleTag={feedFilters.toggleTag}
                    selectedDate={feedFilters.selectedDate}
                    onDateChange={feedFilters.setSelectedDate}
                    onClearFilters={feedFilters.clearFilters}
                    hasActiveFilters={feedFilters.hasActiveFilters}
                    myPlansOnly={feedFilters.myPlansOnly}
                    onToggleMyPlans={feedFilters.toggleMyPlans}
                  />
                </div>
              )}
            </div>
          )}

          {showFeedFilters && <div className="min-w-0 flex-1 md:hidden" aria-hidden />}

          <div className="flex items-center gap-2 shrink-0 sm:gap-3">
            {showFeedFilters && (
              <div className="md:hidden">
                <MobileFeedFiltersMenu
                  selectedTags={feedFilters.selectedTags}
                  onToggleTag={feedFilters.toggleTag}
                  selectedDate={feedFilters.selectedDate}
                  onDateChange={feedFilters.setSelectedDate}
                  onClearFilters={feedFilters.clearFilters}
                  hasActiveFilters={feedFilters.hasActiveFilters}
                  myPlansOnly={feedFilters.myPlansOnly}
                  onToggleMyPlans={feedFilters.toggleMyPlans}
                />
              </div>
            )}
            <div className="relative" ref={wrapRef}>
              <button
                type="button"
                id="user-menu-trigger"
                aria-expanded={open}
                aria-haspopup="menu"
                aria-controls={menuId}
                onClick={() => setOpen((v) => !v)}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-forest/20 bg-paper text-brand-forest font-semibold hover:bg-paper/80 focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 transition-all"
                aria-label="Account menu"
              >
                {authed && profile?.avatarDataUrl ? (
                  <img
                    src={profile.avatarDataUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : authed ? (
                  <span className="text-sm font-bold tracking-tight">
                    {getProfileInitials(profile?.name || user?.displayName)}
                  </span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {open && (
                <div
                  id={menuId}
                  role="menu"
                  aria-labelledby="user-menu-trigger"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-brand-forest/15 bg-white shadow-card py-1 z-[60] overflow-hidden"
                >
                  {authed ? (
                    <>
                      <Link
                        to="/settings"
                        role="menuitem"
                        className={menuItemClass()}
                        onClick={() => setOpen(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 shrink-0 opacity-80" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.127c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      <Link
                        to="/help"
                        role="menuitem"
                        className={menuItemClass()}
                        onClick={() => setOpen(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 shrink-0 opacity-80" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                        Help & support
                      </Link>
                      <div className="my-1 h-px bg-brand-forest/10" role="separator" />
                      <button
                        type="button"
                        role="menuitem"
                        className={`${menuItemClass()} text-red-700/90 hover:bg-red-50 focus:bg-red-50`}
                        onClick={handleSignOut}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 shrink-0 opacity-80" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        role="menuitem"
                        className={menuItemClass()}
                        onClick={() => setOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        role="menuitem"
                        className={menuItemClass()}
                        onClick={() => setOpen(false)}
                      >
                        Sign up
                      </Link>
                      <div className="my-1 h-px bg-brand-forest/10" role="separator" />
                      <Link
                        to="/help"
                        role="menuitem"
                        className={menuItemClass()}
                        onClick={() => setOpen(false)}
                      >
                        Help & support
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
