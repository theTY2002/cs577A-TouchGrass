/**
 * Login: split-screen layout (hero left, form right).
 */
import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../tools/cache/SessionContext';
import { setTouchGrassTitle } from '../tools/ui/documentTitle';
import { TouchGrassMark } from '../components/TouchGrassIcon';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signedIn, signInWithPassword } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    setTouchGrassTitle('Login');
  }, []);

  useEffect(() => {
    if (signedIn) {
      const from = location.state?.from;
      const dest =
        typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
          ? from
          : '/feed';
      navigate(dest, { replace: true });
    }
  }, [signedIn, navigate, location.state]);

  useEffect(() => {
    const s = location.state;
    if (s?.registered && typeof s.email === 'string') {
      setEmail(s.email);
      setSuccess('Account created. Log in with your email and password.');
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await signInWithPassword({ email: email.trim(), password });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-[10px] border border-[#DBDBDB] bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-shadow focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/25';

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white lg:flex-row">
      {/* Left: brand + hero (desktop) */}
      <section
        className="relative hidden w-full flex-col justify-between overflow-hidden bg-white px-10 pb-10 pt-8 lg:flex lg:w-1/2 lg:px-14 lg:pb-14 lg:pt-10"
        aria-label="TouchGrass"
      >
        <Link
          to="/feed"
          className="flex w-fit items-center gap-3 rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-brand-forest"
        >
          <TouchGrassMark />
          <span className="text-lg font-semibold tracking-tight text-black">TouchGrass</span>
        </Link>

        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <h1 className="max-w-[420px] text-center text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-tight tracking-tight text-black">
            Discover plans happening{' '}
            <span className="bg-gradient-to-r from-[#3d5c42] via-[#5f8060] to-[#A68B5B] bg-clip-text text-transparent">
              around you.
            </span>
          </h1>
          <div className="relative mt-10 w-full max-w-[min(100%,420px)]">
            <div
              className="pointer-events-none absolute -left-6 top-1/4 h-24 w-16 rounded-2xl bg-gradient-to-br from-emerald-200/85 to-green-100/70 shadow-lg blur-sm"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-4 bottom-0 h-28 w-20 rounded-2xl bg-gradient-to-br from-green-200/90 to-[#c9b896]/80 shadow-lg blur-sm"
              aria-hidden
            />
            <img
              src="/login-hero.png"
              alt=""
              className="relative z-[1] mx-auto w-full max-w-[320px] drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-[#EFEFEF] px-5 py-4 lg:hidden">
        <Link
          to="/feed"
          className="flex items-center gap-2.5 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-brand-forest"
        >
          <TouchGrassMark small />
          <span className="font-semibold text-black">TouchGrass</span>
        </Link>
      </div>

      {/* Right: form */}
      <section
        className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:py-16"
        aria-labelledby="login-heading"
      >
        <div className="w-full max-w-[380px]">
          <h2
            id="login-heading"
            className="mb-8 text-center text-2xl font-bold tracking-tight text-black lg:text-left"
          >
            Log in to TouchGrass
          </h2>

          {/* Submitting this form triggers handleLogin (Log in button). */}
          <form onSubmit={handleLogin} className="space-y-3">
            {success && (
              <p className="rounded-[10px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </p>
            )}
            {error && (
              <p className="rounded-[10px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSuccess('');
                }}
                placeholder="Email or username"
                required
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSuccess('');
                }}
                placeholder="Password"
                required
                className={inputClass}
                autoComplete="current-password"
              />
            </div>

            {/* Primary login: POST /api/auth/login */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-brand-forest py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-forest/90 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="#"
              className="text-sm font-semibold text-black hover:text-neutral-700"
            >
              Forgot password?
            </Link>
          </div>

          <div className="mt-8">
            {/* Secondary CTA: navigates to sign-up (no API call here). */}
            <Link
              to="/signup"
              className="flex w-full items-center justify-center rounded-full border-2 border-brand-forest bg-white py-3 text-sm font-semibold text-brand-forest transition-colors hover:bg-brand-forest/10"
            >
              Create new account
            </Link>
          </div>

          <p className="mt-14 text-center text-xs text-neutral-400">TouchGrass</p>
        </div>
      </section>
    </div>
  );
}
