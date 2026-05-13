import { useEffect, useState } from 'react';
import {
  CLIENT_LOCATION_KEY,
  CLIENT_LOCATION_UPDATED_EVENT,
  readClientLocation,
  type ClientLocation,
} from '@/lib/client-location';

export function useClientLocation(): ClientLocation | null {
  const [location, setLocation] = useState<ClientLocation | null>(() => readClientLocation());

  useEffect(() => {
    function handleLocationUpdated(event: Event) {
      setLocation((event as CustomEvent<ClientLocation>).detail ?? readClientLocation());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === CLIENT_LOCATION_KEY) {
        setLocation(readClientLocation());
      }
    }

    window.addEventListener(CLIENT_LOCATION_UPDATED_EVENT, handleLocationUpdated);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(CLIENT_LOCATION_UPDATED_EVENT, handleLocationUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return location;
}
