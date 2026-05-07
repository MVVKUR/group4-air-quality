import { useCallback, useState } from 'react';

export interface GeoPosition {
  lat: number;
  lon: number;
  accuracy: number;
}

interface GeoState {
  position: GeoPosition | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    position: null,
    loading: false,
    error: null,
  });

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: 'Geolocation not supported in this browser.' }));
      return;
    }
    setState({ position: null, loading: true, error: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({ position: null, loading: false, error: err.message });
      },
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
    );
  }, []);

  return { ...state, locate };
}
