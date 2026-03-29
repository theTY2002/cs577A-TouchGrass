/**
 * Event Create / Edit page. Routes: /event/new, /event/:id/edit
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { setTouchGrassTitle } from '../documentTitle';
import { useSession } from '../SessionContext';
import { FALLBACK_CONTACT_LOCALPART } from '../sessionDefaults';
import {
  appendLocalEvent,
  buildEventFromForm,
  getEventById,
  isLocalUserEventId,
  updateLocalEvent,
} from '../localEventsStorage';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { FEED_HERO_IMAGE } from '../components/Hero';

const ALL_TAGS = ['Study', 'Coffee', 'Hiking', 'Food', 'Gaming', 'Music', 'Party', 'Sports', 'Event'];

const inputClass =
  'w-full rounded-2xl border border-gray-200/90 bg-white/95 px-4 py-3.5 text-[15px] text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-brand-forest/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-forest/25 focus:shadow-md disabled:opacity-60';

const labelClass = 'block text-xs font-bold uppercase tracking-[0.12em] text-brand-forest/90 mb-2';

const sectionTitleClass = 'text-sm font-semibold text-gray-800 tracking-tight';

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

function isAllowedImageFile(file) {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return true;
  if (file.type) return false;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'jpg' || ext === 'jpeg' || ext === 'png';
}

function todayISODateLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
  const [imageDropActive, setImageDropActive] = useState(false);
  const [createSuccessEmail, setCreateSuccessEmail] = useState(null);
  const [dateInPastError, setDateInPastError] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
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
        setForm({
          title: found.title || '',
          date: dateStr,
          location: found.location || '',
          tags: found.tags || [],
          details: found.description || '',
          imageUrl: found.imageUrl || '',
        });
      }
    } else {
      setForm({
        title: '',
        date: '',
        location: '',
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

  const handleChange = (field, value) => {
    if (field === 'date' && !isEdit) {
      const today = todayISODateLocal();
      setDateInPastError(Boolean(value && value < today));
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const loadImageFile = (file, resetInput) => {
    setImageError('');
    if (!file) return;
    if (!isAllowedImageFile(file)) {
      setImageError('Please choose a JPG or PNG image.');
      resetInput?.();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        imageUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.onerror = () => {
      setImageError('Could not read that file. Try another image.');
      resetInput?.();
    };
    reader.readAsDataURL(file);
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    loadImageFile(file, () => {
      e.target.value = '';
    });
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

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDropActive(false);
    const file = e.dataTransfer.files?.[0];
    loadImageFile(file, undefined);
  };

  const clearEventImage = () => {
    setImageError('');
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

  const handleSave = () => {
    if (isEdit) {
      if (isLocalUserEventId(id)) {
        const prev = getEventById(id);
        if (prev) {
          updateLocalEvent(buildEventFromForm(form, contactEmail, prev));
        }
      }
      navigate(`/event/${id}`);
      return;
    }
    if (dateInPastError || (form.date && form.date < todayISODateLocal())) {
      return;
    }
    const newEvent = buildEventFromForm(form, contactEmail);
    appendLocalEvent(newEvent);
    setCreateSuccessEmail(contactEmail);
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
      <div className="relative min-h-full bg-gradient-to-b from-[#f4f1eb] via-[#eef3ee] to-[#e6ebe4] px-4 py-14 sm:py-20 animate-fade-in">
        <CloseFormButton onClick={() => navigate('/feed')} />
        <div className="mx-auto w-[min(90vw,720px)]">
          <div
            className="rounded-[1.75rem] border border-white/70 bg-white/90 px-8 py-12 text-center shadow-[0_8px_40px_-12px_rgba(116,136,115,0.28)] ring-1 ring-brand-forest/10 backdrop-blur-sm sm:px-10 sm:py-14"
            role="status"
            aria-live="polite"
          >
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-forest/20 to-brand-terracotta/25 text-2xl"
              aria-hidden
            >
              ✓
            </div>
            <p className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Event created
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              Point of contact is{' '}
              <span className="font-medium text-brand-forest">{createSuccessEmail}</span>
            </p>
            <p className="mt-6 text-xs font-medium uppercase tracking-wider text-gray-400">
              Taking you to the feed…
            </p>
          </div>
        </div>
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
                <label htmlFor="event-title" className={labelClass}>
                  Title
                </label>
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
                    className={`${inputClass} pl-11`}
                    placeholder="e.g. Sunset study circle at Leavey"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="event-date" className={labelClass}>
                  When
                </label>
                <div className="relative">
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
                    onChange={(e) => handleChange('date', e.target.value)}
                    aria-invalid={!isEdit && dateInPastError}
                    className={`${inputClass} pl-11 ${
                      !isEdit && dateInPastError ? 'border-red-400 ring-red-200/50' : ''
                    }`}
                  />
                </div>
                {!isEdit && dateInPastError ? (
                  <p className="mt-2 text-sm font-medium text-red-600" role="alert">
                    Please select a date in the future
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">Pick the day your meetup happens.</p>
                )}
              </div>

              <div>
                <label htmlFor="event-location" className={labelClass}>
                  Where
                </label>
                <LocationAutocomplete
                  id="event-location"
                  value={form.location}
                  onChange={(v) => handleChange('location', v)}
                  leadingIcon={<IconMapPin className="h-5 w-5" />}
                  placeholder="Search campus, café, park, or address…"
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-gray-500">
                  We&apos;ll suggest places near you when location is on.
                </p>
              </div>
            </section>

            <section aria-labelledby="section-tags" className="space-y-4 border-t border-brand-forest/10 pt-10">
              <div className="flex items-center gap-2">
                <h2 id="section-tags" className={sectionTitleClass}>
                  Vibe & tags
                </h2>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-terracotta/35 to-transparent" aria-hidden />
              </div>
              <p className="text-sm text-gray-500">Tap one or more — helps friends discover your event.</p>
              <div className="rounded-2xl border border-brand-forest/10 bg-gradient-to-br from-brand-forest/[0.06] to-brand-terracotta/[0.06] p-4 sm:p-5">
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
                <label htmlFor="event-details" className={labelClass}>
                  Description
                </label>
                <textarea
                  id="event-details"
                  value={form.details}
                  onChange={(e) => handleChange('details', e.target.value)}
                  rows={5}
                  className={`${inputClass} min-h-[140px] resize-y leading-relaxed`}
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

            <div className="flex justify-center border-t border-brand-forest/10 pt-8 sm:justify-end">
              <button
                type="submit"
                disabled={!isEdit && dateInPastError}
                className="w-full rounded-2xl bg-gradient-to-r from-brand-forest to-[#5f7360] px-8 py-3.5 text-center text-sm font-bold uppercase tracking-wide text-white shadow-fab transition-all hover:shadow-fab-hover hover:brightness-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-terracotta focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:w-auto sm:min-w-[240px]"
                aria-label={isEdit ? 'Save changes' : 'Create event'}
              >
                {isEdit ? 'Save changes' : 'Create event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
