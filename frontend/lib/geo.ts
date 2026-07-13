/**
 * Client-location helper (docs/15): browser geolocation → OpenStreetMap reverse
 * geocode → validated against our seeded city list. The detected city is cached
 * in localStorage so the search page and homepage CTAs can reuse it.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const CITY_KEY = 'lm-city';

export function getSavedCity(): string | null {
  try {
    return localStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}

export function saveCity(name: string) {
  try {
    localStorage.setItem(CITY_KEY, name);
  } catch {
    /* private mode */
  }
}

interface CitySuggestion {
  name: string;
}

async function matchOurCity(raw: string): Promise<string | null> {
  const clean = raw.replace(/\s+(district|taluk|rural|urban)$/i, '').trim();
  if (clean.length < 3) return null;
  try {
    const res = await fetch(`${API_BASE}/lawyers/cities?q=${encodeURIComponent(clean.slice(0, 24))}`);
    if (!res.ok) return null;
    const hits = (await res.json()) as CitySuggestion[];
    const exact = hits.find((h) => h.name.toLowerCase() === clean.toLowerCase());
    return (exact ?? hits[0])?.name ?? null;
  } catch {
    return null;
  }
}

/** Ask for the browser location and resolve it to a city we actually serve. */
export async function detectCity(): Promise<string | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  const pos = await new Promise<GeolocationPosition | null>((resolve) =>
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
      timeout: 10_000,
      maximumAge: 600_000,
    }),
  );
  if (!pos) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { address?: Record<string, string> };
    const a = body.address ?? {};
    const candidates = [a.city, a.town, a.municipality, a.village, a.county, a.state_district].filter(
      Boolean,
    ) as string[];
    for (const c of candidates) {
      const match = await matchOurCity(c);
      if (match) {
        saveCity(match);
        return match;
      }
    }
  } catch {
    /* geocoder unreachable */
  }
  return null;
}
