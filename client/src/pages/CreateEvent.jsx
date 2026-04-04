/**
 * Event Create / Edit page. Routes: /event/new, /event/:id/edit
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { setTouchGrassTitle } from '../tools/ui/documentTitle';
import { useSession } from '../tools/cache/SessionContext';
import { FALLBACK_CONTACT_LOCALPART } from '../tools/cache/sessionDefaults';
import {
  appendLocalEvent,
  buildEventFromForm,
  getEventById,
  isLocalUserEventId,
  updateLocalEvent,
} from '../tools/cache/localEventsStorage';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { FEED_HERO_IMAGE } from '../components/Hero';
import { createEvent, isPayloadTooLargeError } from '../tools/api';

const ALL_TAGS = ['Study', 'Coffee', 'Hiking', 'Food', 'Gaming', 'Music', 'Party', 'Sports', 'Event'];

const inputClass =
  'w-full rounded-2xl border border-gray-200/90 bg-white/95 px-4 py-3.5 text-[15px] text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-brand-forest/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/25 focus:shadow-md disabled:opacity-60';

const labelClass = 'block text-xs font-bold uppercase tracking-[0.12em] text-brand-forest/90 mb-2';

const fieldLabelTextClass = 'text-xs font-bold uppercase tracking-[0.12em] text-brand-forest/90';

const sectionTitleClass = 'text-sm font-semibold text-gray-800 tracking-tight';

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Create flow only: which required fields are still empty (cover image optional). */
function getCreateFormMissing(form) {
  const missing = new Set();
  if (!isNonEmptyString(form.title)) missing.add('title');
  if (!isNonEmptyString(form.date)) missing.add('date');
  if (!form.time || !String(form.time).trim()) missing.add('time');
  if (!isNonEmptyString(form.location)) missing.add('location');
  if (!isNonEmptyString(form.details)) missing.add('details');
  if (!form.tags || form.tags.length < 1) missing.add('tags');
  return missing;
}

function IconCalendar({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
      />
    </svg>
  );
}

function IconMapPin({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  );
}

function CloseFormButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed top-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-red-600 shadow-md transition hover:scale-105 hover:border-gray-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
      aria-label="Close and go back"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0 text-red-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

function IconSparkles({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

/** Resize to max edge, return JPEG data URL (smaller request body for API + DB). */
function fileToResizedDataUrl(file, maxPx = 960) {
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
        resolve(canvas.toDataURL('image/jpeg', 0.85));
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

function isAllowedImageFile(file) {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return true;
  if (file.type) return false;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'jpg' || ext === 'jpeg' || ext === 'png';
}

/** Local calendar date + time (no Z) → UTC instant for API / timestamptz. */
function combineLocalDateTimeToISO(dateStr, timeStr) {
  if (!dateStr || !String(dateStr).trim()) return null;
  const rawT = (timeStr && String(timeStr).trim()) || '12:00';
  const withSec = rawT.length === 5 ? `${rawT}:00` : rawT;
  const d = new Date(`${dateStr.trim()}T${withSec}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isEventStartInPast(dateStr, timeStr) {
  const iso = combineLocalDateTimeToISO(dateStr, timeStr);
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

function todayISODateLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** `HH:mm` in local time, for `<input type="time" min="…">`. */
function localTimeHHMM(d = new Date()) {
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSession();
  const contactEmail =
    user?.email?.trim() || `${FALLBACK_CONTACT_LOCALPART}@local`;
  const isEdit = id && id !== 'new';
  const imageInputRef = useRef(null);
  const [imageError, setImageError] = useState('');
  const [imageTooLargeServer, setImageTooLargeServer] = useState(false);
  const [createEventError, setCreateEventError] = useState('');
  const [imageDropActive, setImageDropActive] = useState(false);
  const [createSuccessEmail, setCreateSuccessEmail] = useState(null);
  const [dateInPastError, setDateInPastError] = useState(false);
  const [createSubmitAttempted, setCreateSubmitAttempted] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '12:00',
    location: '',
    capacity: 10,
    tags: [],
    details: '',
    imageUrl: '',
  });

  useEffect(() => {
    setDateInPastError(false);
    if (isEdit) {
      const found = getEventById(id);
      if (found) {
        const dt = found.datetime || found.dateTime || '';
        const dateStr = dt ? dt.slice(0, 10) : '';
        let timeStr = '12:00';
        if (dt) {
          const parsed = new Date(dt);
          if (!Number.isNaN(parsed.getTime())) {
            const h = String(parsed.getHours()).padStart(2, '0');
            const m = String(parsed.getMinutes()).padStart(2, '0');
            timeStr = `${h}:${m}`;
          }
        }
        const cap = found.capacity ?? found.max_members ?? found.maxMembers;
        setForm({
          title: found.title || '',
          date: dateStr,
          time: timeStr,
          location: found.location || '',
          capacity:
            typeof cap === 'number' && Number.isFinite(cap) && cap >= 1
              ? Math.min(500, Math.floor(cap))
              : 10,
          tags: found.tags || [],
          details: found.description || '',
          imageUrl: found.imageUrl || '',
        });
      }
    } else {
      setForm({
        title: '',
        date: '',
        time: '12:00',
        location: '',
        capacity: 10,
        tags: [],
        details: '',
        imageUrl: '',
      });
    }
  }, [id, isEdit]);

  useLayoutEffect(() => {
    const t = (form.title || '').trim();
    if (isEdit) {
      setTouchGrassTitle(t ? `Edit · ${t.length > 60 ? `${t.slice(0, 57)}…` : t}` : 'Edit event');
    } else {
      setTouchGrassTitle(t ? `New event · ${t.length > 50 ? `${t.slice(0, 47)}…` : t}` : 'Create event');
    }
  }, [isEdit, form.title]);

  useEffect(() => {
    setCreateSuccessEmail(null);
  }, [id]);

  useEffect(() => {
    setCreateSubmitAttempted(false);
  }, [id, isEdit]);

  const missingCreateFields = !isEdit ? getCreateFormMissing(form) : new Set();
  const showCreateRequired = !isEdit && createSubmitAttempted;
  const todayLocal = todayISODateLocal();
  const minTimeToday = !isEdit && form.date === todayLocal ? localTimeHHMM() : undefined;

  const handleChange = (field, value) => {
    setForm((prev) => {
      if (!isEdit && field === 'date' && value && value < todayISODateLocal()) {
        return prev;
      }

      let next = { ...prev, [field]: value };

      if (!isEdit && (field === 'date' || field === 'time')) {
        const today = todayISODateLocal();
        if (next.date === today && isEventStartInPast(next.date, next.time)) {
          next = { ...next, time: localTimeHHMM() };
        }
        setDateInPastError(isEventStartInPast(next.date, next.time));
      }

      return next;
    });
  };

  const loadImageFile = async (file, resetInput) => {
    setImageError('');
    setImageTooLargeServer(false);
    setCreateEventError('');
    if (!file) return;
    if (!isAllowedImageFile(file)) {
      setImageError('Please choose a JPG or PNG image.');
      resetInput?.();
      return;
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file, 960);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch {
      setImageError('Could not use that image. Try another file.');
      resetInput?.();
    }
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    const input = e.target;
    await loadImageFile(file, () => {
      input.value = '';
    });
    input.value = '';
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDropActive(true);
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setImageDropActive(false);
    }
  };

  const handleImageDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDropActive(false);
    const file = e.dataTransfer.files?.[0];
    await loadImageFile(file, undefined);
  };

  const clearEventImage = () => {
    setImageError('');
    setImageTooLargeServer(false);
    setCreateEventError('');
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleCancel = () => {
    if (isEdit) {
      navigate(`/event/${id}`);
    } else {
      navigate('/feed');
    }
  };

  // const handleSave = () => {
  //   if (isEdit) {
  //     if (isLocalUserEventId(id)) {
  //       const prev = getEventById(id);
  //       if (prev) {
  //         updateLocalEvent(buildEventFromForm(form, contactEmail, prev));
  //       }
  //     }
  //     navigate(`/event/${id}`);
  //     return;
  //   }
  //   if (dateInPastError || (form.date && isEventStartInPast(form.date, form.time))) {
  //     return;
  //   }
  //   const newEvent = buildEventFromForm(form, contactEmail);
  //   appendLocalEvent(newEvent);
  //   setCreateSuccessEmail(contactEmail);
  // };
  const handleSave = async () => {
    if (isEdit) {
      if (isLocalUserEventId(id)) {
        const prev = getEventById(id);
        if (prev) {
          updateLocalEvent(buildEventFromForm(form, contactEmail, user, prev));
        }
      }
      navigate(`/event/${id}`);
      return;
    }
    const missing = getCreateFormMissing(form);
    if (missing.size > 0) {
      setCreateSubmitAttempted(true);
      return;
    }

    if (dateInPastError || (form.date && isEventStartInPast(form.date, form.time))) {
      return;
    }

    try {
      setCreateEventError('');
      const cap = Number(form.capacity);
      const capacity =
        Number.isFinite(cap) && cap >= 1 ? Math.min(500, Math.floor(cap)) : 10;

      const imageTrimmed = typeof form.imageUrl === 'string' ? form.imageUrl.trim() : '';
      const eventPayload = {
        owner_user_id: user?.id ?? 1,
        title: form.title,
        tags: form.tags.join(','),
        datetime_start: combineLocalDateTimeToISO(form.date, form.time),
        location_text: form.location,
        plan_text: form.details,
        capacity,
        image_url: imageTrimmed || null,
        imageUrl: imageTrimmed || null,
      };

      const result = await createEvent(eventPayload);
      setImageTooLargeServer(false);
      if (imageTrimmed && result?.image_saved === false) {
        setCreateEventError(
          'Cover image was not saved. From the server folder run: npm run db:ensure-image-column',
        );
        return;
      }
      setCreateSuccessEmail(contactEmail);
    } catch (error) {
      if (isPayloadTooLargeError(error)) {
        setImageTooLargeServer(true);
        return;
      }
      const msg = error instanceof Error ? error.message : 'Failed to create event';
      setCreateEventError(msg);
      console.error('Database failed to create event:', error);
    }
  };

  useEffect(() => {
    if (!createSuccessEmail) return undefined;
    const t = setTimeout(() => {
      navigate('/feed');
    }, 4000);
    return () => clearTimeout(t);
  }, [createSuccessEmail, navigate]);

  if (createSuccessEmail) {
    return (
      <div className="relative min-h-screen animate-fade-in">
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#ebe6de] via-[#f3efe8] to-[#e8ebe5]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,rgba(116,136,115,0.14),transparent_58%),radial-gradient(ellipse_70%_45%_at_100%_85%,rgba(209,169,128,0.1),transparent_55%),radial-gradient(ellipse_55%_40%_at_0%_100%,rgba(116,136,115,0.06),transparent_50%)]"
          aria-hidden
        />
        <main
          className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-12"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Event created. Redirecting to feed."
        >
          <div className="w-full max-w-[20rem] text-center sm:max-w-[22rem]">
            <div className="mx-auto mb-5 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-gradient-to-br from-brand-forest to-[#5f7360] text-white shadow-[0_8px_24px_-6px_rgba(116,136,115,0.55),0_2px_8px_rgba(0,0,0,0.06)] ring-[3px] ring-white/80">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[1.35rem] w-[1.35rem] translate-y-[1px]"
                aria-hidden
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight text-gray-900 sm:text-[1.875rem]">
              Event created
            </h1>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-gray-600 sm:text-base">
              Your event is ready. Redirecting you to the feed…
            </p>
            <div className="mx-auto mt-7 flex max-w-[17rem] items-center gap-3 sm:max-w-none sm:gap-3.5">
              <div
                className="event-created-spinner size-[1.125rem] shrink-0 rounded-full border-2 border-brand-forest/20 border-t-brand-forest"
                aria-hidden
              />
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-brand-forest/[0.12] shadow-inner shadow-black/[0.03]">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-brand-forest to-brand-forest/75 animate-event-created-bar" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="mt-8 w-full rounded-xl border border-brand-forest/25 bg-white/60 px-4 py-2.5 text-sm font-semibold text-brand-forest shadow-sm shadow-brand-forest/5 backdrop-blur-sm transition-all duration-200 hover:border-brand-forest/40 hover:bg-white/90 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:min-w-[11rem]"
            >
              Go to feed now
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-gradient-to-b from-[#f4f1eb] via-[#eef3ee] to-[#e6ebe4] py-8 sm:py-12 animate-fade-in">
      <CloseFormButton onClick={handleCancel} />
      <div className="mx-auto w-[min(90vw,1600px)] px-2 sm:px-4">
        <div className="rounded-[1.75rem] border border-white/60 bg-white/90 p-6 shadow-[0_4px_32px_-8px_rgba(116,136,115,0.18),0_12px_40px_-12px_rgba(0,0,0,0.07)] ring-1 ring-brand-forest/10 backdrop-blur-sm sm:p-9 lg:p-10 xl:p-12">
          <header className="mb-8 border-b border-brand-forest/10 pb-8 sm:mb-10 sm:pb-9">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-terracotta">
              {isEdit ? 'Update your listing' : 'TouchGrass · USC campus'}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-[2rem] sm:leading-tight">
              {isEdit ? 'Edit event' : 'Create event'}
            </h1>
            {!isEdit ? (
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-600">
                Share a hike, study session, pickup game, or campus hangout — help Trojans find something
                fun to do.
              </p>
            ) : (
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                Tweak the details below and save when you&apos;re happy with it.
              </p>
            )}
          </header>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-10"
          >
            <section aria-labelledby="section-basics" className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 id="section-basics" className={sectionTitleClass}>
                  The basics
                </h2>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-forest/25 to-transparent" aria-hidden />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="event-title" className={`${fieldLabelTextClass} mb-0`}>
                    Title
                  </label>
                  {showCreateRequired && missingCreateFields.has('title') ? (
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-red-600">
                      Required
                    </span>
                  ) : null}
                </div>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-brand-forest/45"
                    aria-hidden
                  >
                    <IconSparkles className="h-5 w-5" />
                  </span>
                  <input
                    id="event-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    aria-invalid={showCreateRequired && missingCreateFields.has('title')}
                    className={`${inputClass} pl-11 ${
                      showCreateRequired && missingCreateFields.has('title')
                        ? 'border-red-400 ring-1 ring-red-200/60'
                        : ''
                    }`}
                    placeholder="e.g. Sunset study circle at Leavey"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p id="event-when-label" className={`${fieldLabelTextClass} mb-0`}>
                    When
                  </p>
                  {showCreateRequired &&
                  (missingCreateFields.has('date') || missingCreateFields.has('time')) ? (
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-red-600">
                      Required
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <div className="relative min-w-0 flex-1">
                    <label htmlFor="event-date" className="sr-only">
                      Date
                    </label>
                    <span
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-brand-forest/45"
                      aria-hidden
                    >
                      <IconCalendar className="h-5 w-5" />
                    </span>
                    <input
                      id="event-date"
                      type="date"
                      value={form.date}
                      min={!isEdit ? todayLocal : undefined}
                      onChange={(e) => handleChange('date', e.target.value)}
                      aria-labelledby="event-when-label"
                      aria-invalid={
                        (!isEdit && dateInPastError) ||
                        (showCreateRequired && missingCreateFields.has('date'))
                      }
                      className={`${inputClass} pl-11 ${
                        !isEdit && dateInPastError
                          ? 'border-red-400 ring-red-200/50'
                          : showCreateRequired && missingCreateFields.has('date')
                            ? 'border-red-400 ring-1 ring-red-200/60'
                            : ''
                      }`}
                    />
                  </div>
                  <div className="relative min-w-0 flex-1 sm:max-w-[11rem]">
                    <label htmlFor="event-time" className="sr-only">
                      Start time
                    </label>
                    <input
                      id="event-time"
                      type="time"
                      value={form.time}
                      min={minTimeToday}
                      onChange={(e) => handleChange('time', e.target.value)}
                      aria-labelledby="event-when-label"
                      aria-invalid={
                        (!isEdit && dateInPastError) ||
                        (showCreateRequired && missingCreateFields.has('time'))
                      }
                      className={`${inputClass} ${
                        !isEdit && dateInPastError
                          ? 'border-red-400 ring-red-200/50'
                          : showCreateRequired && missingCreateFields.has('time')
                            ? 'border-red-400 ring-1 ring-red-200/60'
                            : ''
                      }`}
                    />
                  </div>
                </div>
                {!isEdit && dateInPastError ? (
                  <p className="mt-2 text-sm font-medium text-red-600" role="alert">
                    Please choose a start date and time in the future
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                    Choose today or a later day; if it&apos;s today, the time must be no earlier than now.
                    Stored in your timezone on the server.
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="event-location" className={`${fieldLabelTextClass} mb-0`}>
                    Where
                  </label>
                  {showCreateRequired && missingCreateFields.has('location') ? (
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-red-600">
                      Required
                    </span>
                  ) : null}
                </div>
                <LocationAutocomplete
                  id="event-location"
                  value={form.location}
                  onChange={(v) => handleChange('location', v)}
                  leadingIcon={<IconMapPin className="h-5 w-5" />}
                  placeholder="Search campus, café, park, or address…"
                  className={`${inputClass}${
                    showCreateRequired && missingCreateFields.has('location')
                      ? ' border-red-400 ring-1 ring-red-200/60'
                      : ''
                  }`}
                  invalid={showCreateRequired && missingCreateFields.has('location')}
                />
                <p className="mt-2 text-xs text-gray-500">
                  We&apos;ll suggest places near you when location is on.
                </p>
              </div>

              <div>
                <label htmlFor="event-capacity" className={labelClass}>
                  Max people
                </label>
                <input
                  id="event-capacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  step={1}
                  value={form.capacity}
                  onChange={(e) => {
                    const n = e.target.valueAsNumber;
                    if (Number.isNaN(n)) return;
                    handleChange('capacity', Math.min(500, Math.max(1, Math.floor(n))));
                  }}
                  className={inputClass}
                  aria-describedby="event-capacity-hint"
                />
                <p id="event-capacity-hint" className="mt-2 text-xs text-gray-500">
                  Maximum attendees for this plan (default 10). You can change it anytime before the event
                  fills up.
                </p>
              </div>
            </section>

            <section aria-labelledby="section-tags" className="space-y-4 border-t border-brand-forest/10 pt-10">
              <div className="flex items-center gap-2">
                <h2 id="section-tags" className={sectionTitleClass}>
                  Vibe & tags
                </h2>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-terracotta/35 to-transparent" aria-hidden />
                {showCreateRequired && missingCreateFields.has('tags') ? (
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-red-600">
                    Required
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-gray-500">Tap one or more — helps friends discover your event.</p>
              <div
                className={`rounded-2xl border bg-gradient-to-br from-brand-forest/[0.06] to-brand-terracotta/[0.06] p-4 sm:p-5 ${
                  showCreateRequired && missingCreateFields.has('tags')
                    ? 'border-red-400 ring-1 ring-red-200/60'
                    : 'border-brand-forest/10'
                }`}
              >
                <div className="flex flex-wrap gap-2.5">
                  {ALL_TAGS.map((tag) => {
                    const on = form.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2 ${
                          on
                            ? 'bg-gradient-to-br from-brand-forest to-[#5f7360] text-white shadow-md shadow-brand-forest/20 ring-2 ring-brand-forest/25'
                            : 'border border-gray-200/90 bg-white/90 text-gray-700 shadow-sm hover:border-brand-forest/35 hover:bg-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                        aria-pressed={on}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section aria-labelledby="section-details" className="space-y-4 border-t border-brand-forest/10 pt-10">
              <div className="flex items-center gap-2">
                <h2 id="section-details" className={sectionTitleClass}>
                  Tell the story
                </h2>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-forest/25 to-transparent" aria-hidden />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="event-details" className={`${fieldLabelTextClass} mb-0`}>
                    Description
                  </label>
                  {showCreateRequired && missingCreateFields.has('details') ? (
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-red-600">
                      Required
                    </span>
                  ) : null}
                </div>
                <textarea
                  id="event-details"
                  value={form.details}
                  onChange={(e) => handleChange('details', e.target.value)}
                  rows={5}
                  aria-invalid={showCreateRequired && missingCreateFields.has('details')}
                  className={`${inputClass} min-h-[140px] resize-y leading-relaxed ${
                    showCreateRequired && missingCreateFields.has('details')
                      ? 'border-red-400 ring-1 ring-red-200/60'
                      : ''
                  }`}
                  placeholder="What should people expect? Any gear, cost, or meeting spot details?"
                />
              </div>
            </section>

            <section aria-labelledby="section-photo" className="space-y-4 border-t border-brand-forest/10 pt-10">
              <div className="flex items-center gap-2">
                <h2 id="section-photo" className={sectionTitleClass}>
                  Cover photo
                </h2>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-terracotta/35 to-transparent" aria-hidden />
                {imageTooLargeServer ? (
                  <span
                    className="shrink-0 text-sm font-semibold text-red-600"
                    role="alert"
                  >
                    image too large
                  </span>
                ) : null}
              </div>
              <span id="event-image-label" className="sr-only">
                Upload event image
              </span>
              <input
                ref={imageInputRef}
                id="event-image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                onChange={handleImageFile}
                className="sr-only"
                aria-labelledby="event-image-label"
              />
              {!form.imageUrl ? (
                <label
                  htmlFor="event-image"
                  onDragEnter={handleImageDragEnter}
                  onDragOver={handleImageDragOver}
                  onDragLeave={handleImageDragLeave}
                  onDrop={handleImageDrop}
                  className={`group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-12 text-center shadow-sm transition-all duration-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-forest/40 focus-within:ring-offset-2 sm:min-h-[300px] sm:px-10 sm:py-14 ${
                    imageDropActive
                      ? 'border-brand-forest/60 ring-2 ring-brand-forest/25'
                      : 'border-white/70 ring-1 ring-brand-forest/15 hover:border-brand-terracotta/50 hover:shadow-md'
                  }`}
                >
                  <img
                    src={FEED_HERO_IMAGE}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    aria-hidden
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/82 to-white/78"
                    aria-hidden
                  />
                  <div
                    className="absolute inset-0 opacity-[0.35]"
                    style={{ background: 'var(--hero-overlay)' }}
                    aria-hidden
                  />
                  <div className="relative z-[1] flex flex-col items-center">
                    <div
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 text-brand-forest shadow-md ring-1 ring-white/90 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
                      aria-hidden
                    >
                      <svg
                        viewBox="0 0 200 120"
                        className="h-14 w-auto text-brand-forest/85"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 22v76h20M18 22h22"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M182 22v76h-20M182 22h-22"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M52 88L78 48l22 28 18-22 26 34H52z" fill="currentColor" />
                        <circle cx="128" cy="38" r="8" fill="currentColor" />
                      </svg>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                      Upload an event photo
                    </span>
                    <span className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
                      Drag and drop, or click to browse — JPG or PNG looks great on the feed. If you skip
                      this, we&apos;ll use the same campus photo as the feed header.
                    </span>
                    <span className="mt-4 inline-flex items-center rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-forest shadow-sm ring-1 ring-brand-forest/15 backdrop-blur-sm">
                      Optional
                    </span>
                  </div>
                </label>
              ) : null}
              {imageError ? (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {imageError}
                </p>
              ) : null}
              {form.imageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-brand-forest/15 bg-gradient-to-br from-gray-50 to-white shadow-card ring-1 ring-black/5">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-forest/80">
                      Preview
                    </p>
                    <span className="text-xs text-gray-400">How it&apos;ll look on cards</span>
                  </div>
                  <div className="relative bg-gradient-to-b from-gray-100/80 to-gray-50 p-4">
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="mx-auto max-h-52 w-auto max-w-full rounded-xl object-contain shadow-image"
                    />
                    <button
                      type="button"
                      onClick={clearEventImage}
                      className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md ring-1 ring-black/10 transition-all hover:scale-105 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label="Remove image"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <div className="flex flex-col items-stretch gap-3 border-t border-brand-forest/10 pt-8 sm:items-end">
              {createEventError ? (
                <p
                  className="w-full text-right text-sm font-semibold text-red-600 sm:max-w-xl"
                  role="alert"
                >
                  {createEventError}
                </p>
              ) : null}
              <div className="flex justify-center sm:justify-end">
                <button
                  type="submit"
                  disabled={!isEdit && dateInPastError}
                  className="w-full rounded-2xl bg-gradient-to-r from-brand-forest to-[#5f7360] px-8 py-3.5 text-center text-sm font-bold uppercase tracking-wide text-white shadow-fab transition-all hover:shadow-fab-hover hover:brightness-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-terracotta focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:w-auto sm:min-w-[240px]"
                  aria-label={isEdit ? 'Save changes' : 'Create event'}
                >
                  {isEdit ? 'Save changes' : 'Create event'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
