/**
 * Live profile settings (name, avatar, etc.) from localStorage — refreshes when Settings saves or storage changes.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  PROFILE_SETTINGS_CHANGED_EVENT,
  PROFILE_SETTINGS_STORAGE_KEY,
  defaultProfileSettings,
  loadProfileSettings,
} from './profileSettingsStorage';
import { useSession } from '../cache/SessionContext';

const ProfileSettingsContext = createContext(null);

function withSessionDisplayName(loaded, displayName) {
  const hasStoredName = Boolean(String(loaded.name || '').trim());
  const dn = String(displayName || '').trim();
  if (!hasStoredName && dn) return { ...loaded, name: dn };
  return loaded;
}

export function ProfileSettingsProvider({ children }) {
  const { signedIn, user } = useSession();
  const sessionEmail = signedIn && user?.email ? user.email : '';

  const [profile, setProfile] = useState(() => loadProfileSettings(sessionEmail));

  const refreshProfile = useCallback(() => {
    setProfile(withSessionDisplayName(loadProfileSettings(sessionEmail), user?.displayName));
  }, [sessionEmail, user?.displayName]);

  useEffect(() => {
    if (signedIn) {
      setProfile(
        withSessionDisplayName(loadProfileSettings(sessionEmail), user?.displayName),
      );
    } else {
      setProfile({ ...defaultProfileSettings, email: '' });
    }
  }, [signedIn, sessionEmail, user?.displayName]);

  useEffect(() => {
    const onLocalSave = () => {
      setProfile(withSessionDisplayName(loadProfileSettings(sessionEmail), user?.displayName));
    };
    const onStorage = (e) => {
      if (e.key === PROFILE_SETTINGS_STORAGE_KEY) onLocalSave();
    };
    window.addEventListener(PROFILE_SETTINGS_CHANGED_EVENT, onLocalSave);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(PROFILE_SETTINGS_CHANGED_EVENT, onLocalSave);
      window.removeEventListener('storage', onStorage);
    };
  }, [sessionEmail, user?.displayName]);

  const value = useMemo(() => ({ profile, refreshProfile }), [profile, refreshProfile]);

  return <ProfileSettingsContext.Provider value={value}>{children}</ProfileSettingsContext.Provider>;
}

export function useProfileSettings() {
  const ctx = useContext(ProfileSettingsContext);
  if (!ctx) {
    return { profile: loadProfileSettings(''), refreshProfile: () => {} };
  }
  return ctx;
}
