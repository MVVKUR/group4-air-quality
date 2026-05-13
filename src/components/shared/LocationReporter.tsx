import { useEffect } from 'react';
import { saveClientLocation, type ClientLocation } from '@/lib/client-location';
import { sendClientLocation } from '@/lib/client-location-api';

const LAST_SENT_KEY = 'childair:location:last-sent';
const REPORT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8_000,
  maximumAge: 5 * 60_000,
};

function recentlyReported(): boolean {
  try {
    const last = Number(window.localStorage.getItem(LAST_SENT_KEY));
    return Number.isFinite(last) && Date.now() - last < REPORT_INTERVAL_MS;
  } catch {
    return false;
  }
}

function markReported() {
  try {
    window.localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures; location reporting should never block the app.
  }
}

async function canAskForLocation(): Promise<boolean> {
  if (!('geolocation' in navigator)) return false;
  if (!('permissions' in navigator)) return true;

  try {
    const status = await navigator.permissions.query({
      name: 'geolocation' as PermissionName,
    });
    return status.state !== 'denied';
  } catch {
    return true;
  }
}

async function requestAndReport(signal: AbortSignal) {
  if (!(await canAskForLocation()) || signal.aborted) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (signal.aborted) return;
      const location: ClientLocation = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
        capturedAt: new Date(pos.timestamp).toISOString(),
      };
      saveClientLocation(location);
      void sendClientLocation(location, signal)
        .then(markReported)
        .catch(() => undefined);
    },
    () => undefined,
    GEO_OPTIONS,
  );
}

export function LocationReporter() {
  useEffect(() => {
    if (recentlyReported()) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void requestAndReport(controller.signal);
    }, 800);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return null;
}
