/**
 * Frontend-only session simulation: in-memory auth, profile snapshot, and event membership.
 * Replace SessionProvider internals later with API-backed auth without changing consumers.
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
 * @property {string} email
 * @property {string} [displayName]
 * @property {string} [username]
 */

export function SessionProvider({ children }) {
  useEffect(() => {
    try {
      LEGACY_AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }, []);

  const [signedIn, setSignedIn] = useState(false);
  /** @type {import('react').Dispatch<import('react').SetStateAction<SessionUser | null>>} */
  const [user, setUser] = useState(null);
  const [joinedEventIds, setJoinedEventIds] = useState(() => []);
  const [uiPreferences, setUiPreferences] = useState(() => ({}));

  const signIn = useCallback(({ email, displayName, username }) => {
    const e = String(email ?? '').trim();
    if (!e) return;
    setUser({
      email: e,
      displayName: displayName != null ? String(displayName).trim() : '',
      username: username != null ? String(username).trim() : '',
    });
    setSignedIn(true);
  }, []);

  const signOut = useCallback(() => {
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
      signedIn,
      user,
      joinedEventIds,
      uiPreferences,
      signIn,
      signOut,
      updateSessionUser,
      joinEvent,
      leaveEvent,
      toggleEventMembership,
      isJoinedToEvent,
      setUiPreference,
    }),
    [
      signedIn,
      user,
      joinedEventIds,
      uiPreferences,
      signIn,
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

/** Route wrapper: send anonymous users to login (replace with server checks later). */
export function RequireAuth({ children }) {
  const { signedIn } = useSession();
  const location = useLocation();
  if (!signedIn) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }
  return children;
}
