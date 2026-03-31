/**
 * Location field with device geolocation (optional) + map search autocomplete.
 * Uses Photon (https://photon.komoot.io) — OpenStreetMap data, no API key.
 * Biases suggestions toward lat/lon when the browser grants location access.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';

const PHOTON_SEARCH = 'https://photon.komoot.io/api/';
const DEBOUNCE_MS = 320;
const MIN_QUERY_LEN = 2;
const MAX_SUGGESTIONS = 8;

function photonFeatureToLabel(feature) {
  const p = feature?.properties || {};
  const bits = [];
  if (p.name) bits.push(p.name);
  const streetLine = [p.housenumber, p.street].filter(Boolean).join(' ').trim();
  if (streetLine) bits.push(streetLine);
  const locality = p.city || p.town || p.village || p.district;
  if (locality) bits.push(locality);
  if (p.state) bits.push(p.state);
  if (p.country) bits.push(p.country);
  const seen = new Set();
  const out = [];
  for (const b of bits) {
    if (b && !seen.has(b)) {
      seen.add(b);
      out.push(b);
    }
  }
  return out.join(', ') || 'Selected place';
}

export default function LocationAutocomplete({
  id: idProp,
  value,
  onChange,
  placeholder = 'Venue or address',
  className = '',
  disabled = false,
  leadingIcon = null,
}) {
  const reactId = useId();
  const inputId = idProp || `location-autocomplete-${reactId}`;
  const listId = `${inputId}-suggestions`;

  const wrapRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const proximityAppliedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [geoHint, setGeoHint] = useState(null);
  const [proximity, setProximity] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoHint('Location not available in this browser — search works without it.');
      return undefined;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProximity({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setGeoHint('Using your location to prioritize nearby places.');
      },
      () => {
        setGeoHint('Location permission not granted — you can still search any address.');
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 12_000 },
    );

    return undefined;
  }, []);

  const runSearch = useCallback(
    async (q) => {
      const query = q.trim();
      if (query.length < MIN_QUERY_LEN) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const params = new URLSearchParams({
        q: query,
        limit: String(MAX_SUGGESTIONS),
        lang: 'en',
      });
      if (proximity) {
        params.set('lat', String(proximity.lat));
        params.set('lon', String(proximity.lon));
      }

      setLoading(true);
      try {
        const res = await fetch(`${PHOTON_SEARCH}?${params.toString()}`, {
          signal: ac.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const feats = Array.isArray(data?.features) ? data.features : [];
        setSuggestions(
          feats.map((f) => ({
            id: `${f.geometry?.coordinates?.join(',')}-${f.properties?.osm_id ?? Math.random()}`,
            label: photonFeatureToLabel(f),
          })),
        );
        setOpen(true);
        setHighlightIndex(-1);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [proximity],
  );

  useEffect(() => {
    if (!proximity || proximityAppliedRef.current) return;
    proximityAppliedRef.current = true;
    const q = value.trim();
    if (q.length >= MIN_QUERY_LEN) runSearch(value);
  }, [proximity, value, runSearch]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < MIN_QUERY_LEN) {
      setSuggestions([]);
      setOpen(false);
      return undefined;
    }

    debounceRef.current = setTimeout(() => {
      runSearch(value);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, runSearch]);

  useEffect(() => {
    const onDocDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  const pick = (label) => {
    onChange(label);
    setOpen(false);
    setSuggestions([]);
    setHighlightIndex(-1);
  };

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      pick(suggestions[highlightIndex].label);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const inputEl = (
    <input
      id={inputId}
      type="text"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => {
        if (suggestions.length > 0) setOpen(true);
      }}
      onKeyDown={onKeyDown}
      autoComplete="off"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-busy={loading}
      className={leadingIcon ? `${className} pl-11` : className}
      placeholder={placeholder}
    />
  );

  return (
    <div ref={wrapRef} className="relative">
      {leadingIcon ? (
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-brand-forest/55"
            aria-hidden
          >
            {leadingIcon}
          </span>
          {inputEl}
        </div>
      ) : (
        inputEl
      )}
      {geoHint ? (
        <p className="mt-2 text-xs leading-relaxed text-gray-500" role="status">
          {geoHint}
        </p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-brand-forest/15 bg-white py-1.5 shadow-card-hover ring-1 ring-black/5"
        >
          {suggestions.map((s, idx) => (
            <li key={s.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={idx === highlightIndex}
                className={`flex w-full px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-brand-forest/10 ${
                  idx === highlightIndex ? 'bg-brand-forest/15' : ''
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s.label)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {loading && value.trim().length >= MIN_QUERY_LEN ? (
        <p className="mt-1 text-xs text-gray-400">Searching…</p>
      ) : null}
    </div>
  );
}
