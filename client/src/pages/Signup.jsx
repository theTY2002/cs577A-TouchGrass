/**
 * Sign up: single-column form only (no hero / split layout).
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TouchGrassMark } from '../components/TouchGrassIcon';
import { useSession } from '../tools/cache/SessionContext';
import { signUpWithApi } from '../tools/api';

const inputClass =
  'w-full rounded-[10px] border border-[#DBDBDB] bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-shadow focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/25';

const labelClass = 'mb-1.5 block text-sm font-bold text-black';

const sectionTitleClass = 'text-lg font-bold text-brand-forest sm:text-xl';

const sectionClass =
  'mt-8 space-y-4 border-t border-[#DBDBDB] pt-8 first:mt-0 first:border-t-0 first:pt-0';

function isUscEmail(value) {
  return String(value).trim().toLowerCase().includes('@usc');
}

export default function Signup() {
  const navigate = useNavigate();
  const { signedIn } = useSession();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    if (!isUscEmail(email)) {
      setError('USC students only: use a USC email that includes @usc (for example, name@usc.edu).');
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
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <header className="px-5 py-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2.5 rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-brand-forest"
        >
          <TouchGrassMark small />
          <span className="font-semibold text-black">TouchGrass</span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col px-6 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-[440px]">
          <h1
            id="signup-heading"
            className="text-2xl font-bold tracking-tight text-black"
          >
            Get started on TouchGrass
          </h1>
          <p className="mt-2 text-[15px] leading-snug text-neutral-800">
            <span className="font-semibold text-brand-forest">USC students only.</span> Create your account
            to join campus events and plans. You must sign up with a USC email address that includes{' '}
            <span className="font-mono text-[13px]">@usc</span> (for example,{' '}
            <span className="font-mono text-[13px]">you@usc.edu</span>).
          </p>

          {/* Submitting this form triggers handleSubmit (Sign up button). */}
          <form onSubmit={handleSubmit} className="mt-8 text-left" aria-labelledby="signup-heading">
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
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                USC email required — your address must contain <span className="font-mono">@usc</span>{' '}
                (e.g. <span className="font-mono">you@usc.edu</span>).
              </p>
              <div className="pt-1">
                <label htmlFor="signup-email" className={labelClass}>
                  USC email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@usc.edu"
                  required
                  className={inputClass}
                  autoComplete="email"
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
              className="mt-10 w-full rounded-full bg-brand-forest py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-forest/90 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="mt-8 text-sm">
            <span className="text-neutral-600">Already have an account? </span>
            {/* Navigates to login only (no sign-in API call from here). */}
            <Link to="/login" className="font-semibold text-brand-forest hover:text-brand-forest/80">
              Log in
            </Link>
          </p>

          <p className="mt-14 text-center text-xs text-neutral-400">TouchGrass</p>
        </div>
      </main>
    </div>
  );
}
