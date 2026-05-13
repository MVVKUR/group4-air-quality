export interface ClientLocation {
  lat: number;
  lon: number;
  accuracy: number | null;
  capturedAt: string;
}

export const CLIENT_LOCATION_KEY = 'childair:location:latest';
export const CLIENT_LOCATION_UPDATED_EVENT = 'childair:location-updated';

function isLocation(value: unknown): value is ClientLocation {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ClientLocation>;
  return (
    typeof candidate.lat === 'number' &&
    Number.isFinite(candidate.lat) &&
    typeof candidate.lon === 'number' &&
    Number.isFinite(candidate.lon) &&
    (candidate.accuracy === null ||
      (typeof candidate.accuracy === 'number' && Number.isFinite(candidate.accuracy))) &&
    typeof candidate.capturedAt === 'string'
  );
}

export function readClientLocation(): ClientLocation | null {
  try {
    const raw = window.localStorage.getItem(CLIENT_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveClientLocation(location: ClientLocation) {
  try {
    window.localStorage.setItem(CLIENT_LOCATION_KEY, JSON.stringify(location));
  } catch {
    // The dashboard can still use the in-memory event even if storage is blocked.
  }

  window.dispatchEvent(
    new CustomEvent<ClientLocation>(CLIENT_LOCATION_UPDATED_EVENT, { detail: location }),
  );
}
