/**
 * Sign up: single-column form only (no hero / split layout).
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TouchGrassMark } from '../tools/ui/TouchGrassIcon';
import { useSession } from '../tools/cache/SessionContext';
import { signUpWithApi } from '../tools/api';
import { isUscEduEmail } from '../tools/ui/uscEmail';

const inputClass =
  'w-full rounded-[10px] border border-[#DBDBDB] bg-white px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-muted/60 outline-none transition-shadow focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/25';

const labelClass = 'mb-1.5 block text-sm font-medium text-ink';

const sectionTitleClass =
  'text-lg font-semibold leading-snug tracking-[-0.015em] text-brand-forest sm:text-xl';

const sectionClass =
  'mt-10 space-y-4 border-t border-[#DBDBDB] pt-10 first:mt-0 first:border-t-0 first:pt-0';

export default function Signup() {
  const navigate = useNavigate();
  const { signedIn } = useSession();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  /** After a submit with a bad/empty email, show the inline hint even if the field looks empty. */
  const [emailSubmitAttempted, setEmailSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailTrimmed = email.trim();
  const emailInvalid = !isUscEduEmail(email);
  const showEmailError =
    emailInvalid && (emailTrimmed.length > 0 || emailSubmitAttempted);

  useEffect(() => {
    document.title = 'TouchGrass · Sign up';
  }, []);

  useEffect(() => {
    if (signedIn) navigate('/', { replace: true });
  }, [signedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isUscEduEmail(email)) {
      setEmailSubmitAttempted(true);
      return;
    }

    setLoading(true);
    try {
      await signUpWithApi({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        username: username.trim(),
      });
      navigate('/login', {
        replace: true,
        state: { registered: true, email: email.trim() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#fafaf8]">
      <header className="px-5 py-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2.5 rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-brand-forest"
        >
          <TouchGrassMark small />
          <span className="font-medium text-ink">TouchGrass</span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-[440px]">
          <h1
            id="signup-heading"
            className="text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-ink"
          >
            Get started on TouchGrass
          </h1>
          <p className="mt-3 text-[15px] leading-[1.65] text-ink-muted">
            <span className="font-medium text-brand-forest">USC students only.</span> Create your account
            to join campus events and plans. You must use a{' '}
            <span className="font-mono text-[13px]">@usc.edu</span> email (for example,{' '}
            <span className="font-mono text-[13px]">you@usc.edu</span>).
          </p>

          {/* Submitting this form triggers handleSubmit (Sign up button). */}
          <form onSubmit={handleSubmit} className="mt-10 text-left" aria-labelledby="signup-heading">
            {error && (
              <p className="mb-6 rounded-[10px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>Profile</h2>
              <div className="space-y-4 pt-1">
                <div>
                  <label htmlFor="fullName" className={labelClass}>
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    required
                    className={inputClass}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="username" className={labelClass}>
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                    autoComplete="username"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>Contact</h2>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                <span className="font-mono">@usc.edu</span> email required.
              </p>
              <div className="pt-1">
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <label htmlFor="signup-email" className="text-sm font-medium text-ink">
                    USC email
                  </label>
                  {showEmailError ? (
                    <span
                      id="signup-email-error"
                      role="alert"
                      className="text-sm font-medium text-red-700"
                    >
                      Must be a USC student
                    </span>
                  ) : null}
                </div>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const next = e.target.value;
                    setEmail(next);
                    if (isUscEduEmail(next)) setEmailSubmitAttempted(false);
                  }}
                  placeholder="you@usc.edu"
                  required
                  className={
                    showEmailError
                      ? `${inputClass} border-red-300 focus:border-red-400 focus:ring-red-200/40`
                      : inputClass
                  }
                  autoComplete="email"
                  aria-invalid={showEmailError ? true : undefined}
                  aria-describedby={showEmailError ? 'signup-email-error' : undefined}
                />
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>Password</h2>
              <div className="space-y-4 pt-1">
                <div>
                  <label htmlFor="signup-password" className={labelClass}>
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={8}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className={labelClass}>
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    minLength={8}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Primary sign-up: POST /api/auth/signup */}
            <button
              type="submit"
              disabled={loading}
              className="mt-10 w-full rounded-full bg-brand-forest py-3 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-forest/90 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="mt-10 text-sm leading-relaxed">
            <span className="text-ink-muted">Already have an account? </span>
            {/* Navigates to login only (no sign-in API call from here). */}
            <Link to="/login" className="font-medium text-brand-forest hover:text-brand-forest/80">
              Log in
            </Link>
          </p>

          <p className="mt-16 text-center text-xs text-ink-muted/70">TouchGrass</p>
        </div>
      </main>
    </div>
  );
}
