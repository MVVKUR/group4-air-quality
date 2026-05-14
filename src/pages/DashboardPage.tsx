import { useQuery } from '@tanstack/react-query';
import { useJakartaFeed } from '@/hooks/useAQIData';
import { useClientLocation } from '@/hooks/useClientLocation';
import { HeroAQI } from '@/components/dashboard/HeroAQI';
import { PollutantGrid } from '@/components/dashboard/PollutantGrid';
import { WeatherStrip } from '@/components/dashboard/WeatherStrip';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { ForecastCards } from '@/components/dashboard/ForecastCards';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { HealthAdvisory } from '@/components/shared/HealthAdvisory';
import { useUserProfile } from '@/hooks/useUserProfile';
import { fetchNearestStation } from '@/lib/waqi-api';
import { REFRESH_INTERVAL_MS, STALE_TIME_MS } from '@/lib/constants';

export function DashboardPage() {
  const jakartaFeed = useJakartaFeed();
  const location = useClientLocation();
  const nearestFeed = useQuery({
    enabled: location !== null,
    queryKey: ['waqi', 'feed', 'nearest', location?.lat, location?.lon],
    queryFn: ({ signal }) => {
      if (!location) throw new Error('Location not available.');
      return fetchNearestStation(location.lat, location.lon, signal);
    },
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  const data = nearestFeed.data ?? jakartaFeed.data;
  const isLoading =
    !data && (jakartaFeed.isLoading || (location !== null && nearestFeed.isLoading));
  const isError =
    !data &&
    (location !== null ? nearestFeed.isError && jakartaFeed.isError : jakartaFeed.isError);
  const isFetching = jakartaFeed.isFetching || nearestFeed.isFetching;
  const { profile } = useUserProfile();
  const firstName = profile?.name.trim().split(/\s+/)[0] ?? null;
  const hasLocationFeed = Boolean(location && nearestFeed.data);

  const refetch = () => {
    void jakartaFeed.refetch();
    if (location) {
      void nearestFeed.refetch();
    }
  };

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <ErrorState
        message="We couldn't load Jakarta air quality data. The backend may still be warming up — try again in a moment."
        onRetry={() => refetch()}
      />
    );
  }

  const aqi = typeof data.aqi === 'number' ? data.aqi : 0;
  // The outlook follows whichever location the dashboard is showing — the
  // nearest-station feed when location is shared, otherwise the WAQI Jakarta
  // feed — so the forecast stays consistent with the hero, pollutants, and
  // the station detail page. The backend serialises an empty forecast as
  // `{pm25: null, ...}` rather than omitting it, so fall back to the Jakarta
  // feed only when the displayed station has no forecast points at all.
  const stationForecast = data.forecast?.daily;
  const hasStationForecast = Boolean(
    stationForecast?.pm25?.length ||
      stationForecast?.pm10?.length ||
      stationForecast?.o3?.length,
  );
  const forecastDaily = hasStationForecast
    ? stationForecast
    : jakartaFeed.data?.forecast?.daily;
  const forecastSource = hasStationForecast
    ? data.attributions?.[0]?.name
    : jakartaFeed.data?.attributions?.[0]?.name;

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      {firstName && (
        <div className="-mb-1 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[13px] font-bold text-slate-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-400 sm:inline-flex sm:text-sm">
          Halo, <span className="text-slate-900 dark:text-white">{firstName}</span> — here's{' '}
          {hasLocationFeed ? 'the air near your location.' : "today's air for Jakarta."}
        </div>
      )}
      <HeroAQI feed={data} isRefreshing={isFetching} onRefresh={() => refetch()} />
      {profile && <HealthAdvisory aqi={aqi} />}
      <PollutantGrid iaqi={data.iaqi} dominant={data.dominentpol} />
      <WeatherStrip iaqi={data.iaqi} />
      <TrendChart currentAqi={aqi} />
      <ForecastCards daily={forecastDaily} source={forecastSource} />
    </div>
  );
}
