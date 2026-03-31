/**
 * Help & support — structured support content.
 */
import { useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { setTouchGrassTitle } from '../documentTitle';

function SectionIcon({ children }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-forest/12 text-brand-forest"
      aria-hidden
    >
      {children}
    </div>
  );
}

const supportCardClass =
  'overflow-hidden rounded-2xl border border-stone-200/85 bg-white/95 shadow-[0_10px_44px_-14px_rgba(0,0,0,0.09),0_2px_14px_-4px_rgba(116,136,115,0.11)] ring-1 ring-black/[0.035]';

const sectionRowClass =
  'flex gap-4 px-5 py-6 transition-colors duration-200 hover:bg-brand-forest/[0.035] sm:px-6 sm:py-7';

export default function Help() {
  useLayoutEffect(() => {
    setTouchGrassTitle('Help & support');
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 md:py-20">
      <div className="mx-auto w-full max-w-xl lg:max-w-2xl">
        <header className="mb-8 text-center sm:mb-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-[2rem]">
            Help &amp; support
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-forest/80 sm:text-[0.9375rem]">
            Find answers or get in touch.
          </p>
        </header>

        <div className={supportCardClass}>
          <section
            className={`${sectionRowClass} border-b border-stone-100/95`}
            aria-labelledby="help-getting-started"
          >
            <SectionIcon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.459.67-.484 1.564-1.317 2.416-2.539.887-1.273 1.532-2.786 1.755-4.251a6.5 6.5 0 00-12.98-.243c.223 1.465.868 2.978 1.755 4.251.852 1.222 1.746 2.055 2.416 2.539.311.22.571.363.757.459.115.058.217.094.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clipRule="evenodd"
                />
              </svg>
            </SectionIcon>
            <div className="min-w-0 flex-1">
              <h2 id="help-getting-started" className="text-base font-semibold tracking-tight text-stone-900">
                Getting started
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-stone-500 sm:text-[0.9375rem] sm:leading-relaxed">
                Browse the feed, filter events, and join ones you like. When you&apos;re signed in, tap the{' '}
                <span className="font-medium text-stone-600">+</span> button to create an event and share it with
                others.
              </p>
            </div>
          </section>

          <section className={sectionRowClass} aria-labelledby="help-account">
            <SectionIcon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.978 6.978 0 0010 17a6.978 6.978 0 004.793-2.61A5.99 5.99 0 0010 12z"
                  clipRule="evenodd"
                />
              </svg>
            </SectionIcon>
            <div className="min-w-0 flex-1">
              <h2 id="help-account" className="text-base font-semibold tracking-tight text-stone-900">
                Account
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-stone-500 sm:text-[0.9375rem] sm:leading-relaxed">
                Open the menu from your profile icon to access settings, help, or sign out.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-8 flex justify-center sm:mt-9">
          <Link
            to="/feed"
            className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-brand-forest/20 bg-white/90 px-5 py-3.5 text-sm font-semibold text-brand-forest shadow-sm shadow-brand-forest/5 transition-all duration-200 hover:border-brand-forest/35 hover:bg-brand-forest/[0.06] hover:shadow-md hover:shadow-brand-forest/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2 sm:w-auto sm:max-w-none sm:min-w-[200px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
