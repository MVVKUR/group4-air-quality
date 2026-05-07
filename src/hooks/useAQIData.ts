import { useQuery } from '@tanstack/react-query';
import {
  fetchJakartaFeed,
  fetchStationFeed,
  fetchStationsInJakarta,
} from '@/lib/waqi-api';
import { REFRESH_INTERVAL_MS, STALE_TIME_MS } from '@/lib/constants';

export function useJakartaFeed() {
  return useQuery({
    queryKey: ['waqi', 'feed', 'jakarta'],
    queryFn: ({ signal }) => fetchJakartaFeed(signal),
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

export function useStationFeed(uid: number | null) {
  return useQuery({
    enabled: typeof uid === 'number' && Number.isFinite(uid),
    queryKey: ['waqi', 'station', uid],
    queryFn: ({ signal }) => fetchStationFeed(uid as number, signal),
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

export function useJakartaStations() {
  return useQuery({
    queryKey: ['waqi', 'stations', 'jakarta'],
    queryFn: ({ signal }) => fetchStationsInJakarta(signal),
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}
