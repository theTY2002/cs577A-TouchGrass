/**
 * Session: API-backed auth (Bearer token in localStorage) plus client-only event membership.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  clearStoredSessionToken,
  fetchCurrentUser,
  getStoredSessionToken,
  loginWithApi,
  logoutWithApi,
} from '../api';

const SessionContext = createContext(null);

/** Remove pre-session-layer keys (not used for auth anymore). */
const LEGACY_AUTH_KEYS = [
  'touchgrass_authenticated',
  'touchgrass_user_email',
  'touchgrass_access_token',
  'touchgrass_refresh_token',
  'touchgrass_user',
];

/**
 * @typedef {object} SessionUser
 * @property {number|string} [id]
 * @property {string} email
 * @property {string} [displayName]
 * @property {string} [username]
 */

/** @param {{ id?: number|string, email?: string, displayName?: string, username?: string } | null | undefined} u */
function mapApiUserToSession(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: String(u.email ?? '').trim(),
    displayName: u.displayName != null ? String(u.displayName).trim() : '',
    username: u.username != null ? String(u.username).trim() : '',
  };
}

export function SessionProvider({ children }) {
  useEffect(() => {
    try {
      LEGACY_AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }, []);

  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  /** @type {import('react').Dispatch<import('react').SetStateAction<SessionUser | null>>} */
  const [user, setUser] = useState(null);
  const [joinedEventIds, setJoinedEventIds] = useState(() => []);
  const [uiPreferences, setUiPreferences] = useState(() => ({}));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getStoredSessionToken();
      if (!token) {
        if (!cancelled) setSessionReady(true);
        return;
      }
      try {
        const u = await fetchCurrentUser(token);
        if (cancelled) return;
        if (u) {
          setUser(mapApiUserToSession(u));
          setSignedIn(true);
        } else {
          clearStoredSessionToken();
        }
      } catch {
        if (!cancelled) clearStoredSessionToken();
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithPassword = useCallback(async ({ email, password }) => {
    const data = await loginWithApi({ email, password });
    const u = data?.user;
    if (!u) throw new Error('Invalid response from server');
    setUser(mapApiUserToSession(u));
    setSignedIn(true);
  }, []);

  const signOut = useCallback(() => {
    void logoutWithApi();
    setSignedIn(false);
    setUser(null);
    setJoinedEventIds([]);
    setUiPreferences({});
  }, []);

  const updateSessionUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (patch.email !== undefined) next.email = String(patch.email).trim();
      if (patch.displayName !== undefined) next.displayName = String(patch.displayName).trim();
      if (patch.username !== undefined) next.username = String(patch.username).trim();
      return next;
    });
  }, []);

  const joinEvent = useCallback((eventId) => {
    const id = String(eventId);
    setJoinedEventIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const leaveEvent = useCallback((eventId) => {
    const id = String(eventId);
    setJoinedEventIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggleEventMembership = useCallback((eventId) => {
    const id = String(eventId);
    setJoinedEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const isJoinedToEvent = useCallback(
    (eventId) => joinedEventIds.includes(String(eventId)),
    [joinedEventIds],
  );

  const setUiPreference = useCallback((key, value) => {
    setUiPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo(
    () => ({
      sessionReady,
      signedIn,
      user,
      joinedEventIds,
      uiPreferences,
      signInWithPassword,
      signOut,
      updateSessionUser,
      joinEvent,
      leaveEvent,
      toggleEventMembership,
      isJoinedToEvent,
      setUiPreference,
    }),
    [
      sessionReady,
      signedIn,
      user,
      joinedEventIds,
      uiPreferences,
      signInWithPassword,
      signOut,
      updateSessionUser,
      joinEvent,
      leaveEvent,
      toggleEventMembership,
      isJoinedToEvent,
      setUiPreference,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}

/** Route wrapper: send anonymous users to login. */
export function RequireAuth({ children }) {
  const { sessionReady, signedIn } = useSession();
  const location = useLocation();
  if (!sessionReady) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-500" aria-busy="true">
        Loading…
      </div>
    );
  }
  if (!signedIn) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }
  return children;
}
