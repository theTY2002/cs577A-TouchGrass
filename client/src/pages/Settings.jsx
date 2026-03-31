/**
 * Account settings — single scrollable page, editable fields, local persistence until profile API exists.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../tools/cache/SessionContext';
import { setTouchGrassTitle } from '../tools/ui/documentTitle';
import {
  defaultProfileSettings,
  getProfileInitials,
  loadProfileSettings,
  saveProfileSettings,
} from '../tools/context/profileSettingsStorage';

const panelClass =
  'rounded-md border border-stone-200/90 bg-white shadow-sm';

/**
 * Resize image to max edge `maxPx`, return JPEG data URL.
 */
function fileToResizedDataUrl(file, maxPx = 384) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { naturalWidth: w, naturalHeight: h } = img;
      if (!w || !h) {
        reject(new Error('Invalid image'));
        return;
      }
      const scale = Math.min(1, maxPx / Math.max(w, h));
      const cw = Math.round(w * scale);
      const ch = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, cw, ch);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-stone-600">
      {children}
    </label>
  );
}

function TextInput({ id, value, onChange, disabled, autoComplete, type = 'text', ...rest }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      autoComplete={autoComplete}
      className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition-colors placeholder:text-stone-400 focus:border-brand-forest/50 focus:outline-none focus:ring-2 focus:ring-brand-forest/25 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
      {...rest}
    />
  );
}

function TextArea({ id, value, onChange, disabled, rows = 4 }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={rows}
      className="mt-1.5 w-full resize-y rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition-colors placeholder:text-stone-400 focus:border-brand-forest/50 focus:outline-none focus:ring-2 focus:ring-brand-forest/25 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
    />
  );
}

function SelectInput({ id, value, onChange, disabled, children }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="mt-1.5 w-full max-w-md rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition-colors focus:border-brand-forest/50 focus:outline-none focus:ring-2 focus:ring-brand-forest/25 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
    >
      {children}
    </select>
  );
}

function SubsectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-stone-800">{children}</h3>;
}

function SectionCard({ id, title, description, children }) {
  return (
    <section id={id} className={panelClass} aria-labelledby={`${id}-heading`}>
      <div className="border-b border-stone-200/80 px-4 py-4 sm:px-5 sm:py-4">
        <h2 id={`${id}-heading`} className="text-lg font-semibold tracking-tight text-stone-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-stone-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-8 px-4 py-6 sm:px-5 sm:py-7">{children}</div>
    </section>
  );
}

export default function Settings() {
  const { updateSessionUser, user } = useSession();
  const sessionEmail = user?.email || '';
  const fileInputRef = useRef(null);
  const saveHintTimerRef = useRef(null);
  const [settings, setSettings] = useState(() => loadProfileSettings(sessionEmail));
  const [saveHint, setSaveHint] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const nameId = useId();
  const emailId = useId();
  const bioId = useId();
  const photoInputId = useId();

  const patch = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  useLayoutEffect(() => {
    setTouchGrassTitle('Settings');
  }, []);

  useEffect(() => {
    setSettings(loadProfileSettings(sessionEmail));
  }, [sessionEmail]);

  useEffect(() => {
    const saveId = setTimeout(() => {
      saveProfileSettings(settings);
      const em = typeof settings.email === 'string' ? settings.email.trim() : '';
      if (em) updateSessionUser({ email: em });
      const nm = typeof settings.name === 'string' ? settings.name.trim() : '';
      if (nm) updateSessionUser({ displayName: nm });
      if (saveHintTimerRef.current) clearTimeout(saveHintTimerRef.current);
      setSaveHint('Saved');
      saveHintTimerRef.current = setTimeout(() => {
        setSaveHint('');
        saveHintTimerRef.current = null;
      }, 2000);
    }, 450);
    return () => {
      clearTimeout(saveId);
      if (saveHintTimerRef.current) {
        clearTimeout(saveHintTimerRef.current);
        saveHintTimerRef.current = null;
      }
    };
  }, [settings, updateSessionUser]);

  const onPickPhoto = () => {
    fileInputRef.current?.click();
  };

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAvatarError('Image must be under 8 MB.');
      return;
    }
    setAvatarError('');
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      patch({ avatarDataUrl: dataUrl });
    } catch {
      setAvatarError('Could not use that image. Try another file.');
    }
  };

  const removePhoto = () => {
    setAvatarError('');
    patch({ avatarDataUrl: null });
  };

  const disabled = false;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-3xl pb-16">
        <header className="mb-8 border-b border-stone-200/90 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
                Manage your profile, notifications, privacy, and appearance. Changes save automatically on this
                device.
              </p>
            </div>
            <p
              className="text-xs font-medium text-brand-forest/90 tabular-nums transition-opacity min-h-[1rem]"
              aria-live="polite"
            >
              {saveHint || '\u00a0'}
            </p>
          </div>
        </header>

        <div className="space-y-8">
          <SectionCard
            id="profile"
            title="Profile"
            description="How you appear to others on TouchGrass."
          >
            <div>
              <SubsectionTitle>Photo</SubsectionTitle>
              <p className="mt-1 text-sm text-stone-500">A square image works best. Shown on your profile and RSVPs.</p>
              <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-100 shadow-sm">
                  {settings.avatarDataUrl ? (
                    <img
                      src={settings.avatarDataUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand-forest/90"
                      aria-hidden
                    >
                      {getProfileInitials(settings.name)}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    id={photoInputId}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={onPhotoChange}
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={onPickPhoto}
                    disabled={disabled}
                    className="rounded-md border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-800 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Change photo
                  </button>
                  {settings.avatarDataUrl ? (
                    <button
                      type="button"
                      onClick={removePhoto}
                      disabled={disabled}
                      className="rounded-md px-3.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              {avatarError ? <p className="mt-2 text-sm text-red-600">{avatarError}</p> : null}
            </div>

            <div className="border-t border-stone-100 pt-8">
              <SubsectionTitle>Basic info</SubsectionTitle>
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor={nameId}>Name</Label>
                  <TextInput
                    id={nameId}
                    value={settings.name}
                    onChange={(v) => patch({ name: v })}
                    disabled={disabled}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor={emailId}>Email</Label>
                  <TextInput
                    id={emailId}
                    type="email"
                    value={settings.email}
                    onChange={(v) => patch({ email: v })}
                    disabled={disabled}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor={bioId}>Bio</Label>
                  <TextArea
                    id={bioId}
                    value={settings.bio}
                    onChange={(v) => patch({ bio: v })}
                    disabled={disabled}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="notifications"
            title="Notifications"
            description="Choose how we reach you about events and messages."
          >
            <div>
              <SubsectionTitle>Delivery</SubsectionTitle>
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="set-email-notif">Email notifications</Label>
                  <SelectInput
                    id="set-email-notif"
                    value={settings.emailNotifications ? 'on' : 'off'}
                    onChange={(v) => patch({ emailNotifications: v === 'on' })}
                    disabled={disabled}
                  >
                    <option value="on">On</option>
                    <option value="off">Off</option>
                  </SelectInput>
                </div>
                <div>
                  <Label htmlFor="set-reminders">Event reminders</Label>
                  <SelectInput
                    id="set-reminders"
                    value={settings.eventReminders}
                    onChange={(v) => patch({ eventReminders: v })}
                    disabled={disabled}
                  >
                    <option value="5">5 minutes before</option>
                    <option value="15">15 minutes before</option>
                    <option value="60">1 hour before</option>
                    <option value="1440">1 day before</option>
                  </SelectInput>
                </div>
                <div>
                  <Label htmlFor="set-messages">New messages</Label>
                  <SelectInput
                    id="set-messages"
                    value={settings.newMessages ? 'on' : 'off'}
                    onChange={(v) => patch({ newMessages: v === 'on' })}
                    disabled={disabled}
                  >
                    <option value="on">On</option>
                    <option value="off">Off</option>
                  </SelectInput>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="privacy"
            title="Privacy"
            description="Control who can see your profile and activity."
          >
            <div>
              <SubsectionTitle>Visibility</SubsectionTitle>
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="set-profile-vis">Profile visibility</Label>
                  <SelectInput
                    id="set-profile-vis"
                    value={settings.profileVisibility}
                    onChange={(v) => patch({ profileVisibility: v })}
                    disabled={disabled}
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends only</option>
                    <option value="private">Only me</option>
                  </SelectInput>
                </div>
                <div>
                  <Label htmlFor="set-activity-vis">Activity visibility</Label>
                  <SelectInput
                    id="set-activity-vis"
                    value={settings.activityVisibility}
                    onChange={(v) => patch({ activityVisibility: v })}
                    disabled={disabled}
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends only</option>
                    <option value="private">Only me</option>
                  </SelectInput>
                </div>
                <div>
                  <Label htmlFor="set-location">Location sharing</Label>
                  <SelectInput
                    id="set-location"
                    value={settings.locationSharing ? 'on' : 'off'}
                    onChange={(v) => patch({ locationSharing: v === 'on' })}
                    disabled={disabled}
                  >
                    <option value="off">Off</option>
                    <option value="on">On</option>
                  </SelectInput>
                </div>
              </div>
            </div>
          </SectionCard>


          <section id="help" className={panelClass} aria-labelledby="help-heading">
            <div className="px-4 py-5 sm:px-5 sm:py-6">
              <h2 id="help-heading" className="text-lg font-semibold tracking-tight text-stone-900">
                Help &amp; support
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">
                Guides, FAQs, and tips for using TouchGrass.
              </p>
              <div className="mt-5">
                <Link
                  to="/help"
                  className="inline-flex items-center justify-center rounded-md border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-800 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2"
                >
                  Open help center
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
