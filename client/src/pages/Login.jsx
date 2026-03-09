/**
 * Login page: Header, Hero, left LOGIN text, right form card.
 * Matches project style (cream, paper, brand-forest, Inter).
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Login — TouchGrass';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        return;
      }
      navigate('/');
    } catch (err) {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      <Hero />

      {/* Main: left LOGIN text + form - form slightly toward center */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-6 lg:gap-16">
          {/* Left: LOGIN with Nabla font */}
          <div className="flex-shrink-0 flex justify-center lg:justify-end">
            <h2
              className="font-login text-[48px] text-black -rotate-2 tracking-wide"
              aria-hidden
            >
              LOGIN
            </h2>
          </div>

          {/* Right: form card - slightly right of center */}
          <div className="flex-1 flex justify-center lg:justify-start lg:ml-20">
            <div className="w-full max-w-[480px] bg-white rounded-card shadow-card p-8 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 transition-colors"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 transition-colors"
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-60 transition-all"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    to="#"
                    className="text-gray-500 hover:text-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 rounded"
                  >
                    Forgot password?
                  </Link>
                  <Link
                    to="#"
                    className="font-semibold text-gray-900 hover:text-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest focus:ring-offset-2 rounded uppercase tracking-wide"
                  >
                    Sign Up
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
