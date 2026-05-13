import { useJakartaFeed } from '@/hooks/useAQIData';
import { HeroAQI } from '@/components/dashboard/HeroAQI';
import { PollutantGrid } from '@/components/dashboard/PollutantGrid';
import { WeatherStrip } from '@/components/dashboard/WeatherStrip';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { ForecastCards } from '@/components/dashboard/ForecastCards';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { HealthAdvisory } from '@/components/shared/HealthAdvisory';
import { useUserProfile } from '@/hooks/useUserProfile';

export function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useJakartaFeed();
  const { profile } = useUserProfile();
  const firstName = profile?.name.trim().split(/\s+/)[0] ?? null;

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

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      {firstName && (
        <div className="-mb-1 text-[13px] font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
          Halo, <span className="text-slate-900 dark:text-white">{firstName}</span> — here's
          today's air for Jakarta.
        </div>
      )}
      <HeroAQI feed={data} isRefreshing={isFetching} onRefresh={() => refetch()} />
      {profile && <HealthAdvisory aqi={aqi} />}
      <PollutantGrid iaqi={data.iaqi} dominant={data.dominentpol} />
      <WeatherStrip iaqi={data.iaqi} />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TrendChart currentAqi={aqi} stationId={data.idx} />
        </div>
        <div className="lg:col-span-2">
          <ForecastCards daily={data.forecast?.daily} />
        </div>
      </div>
    </div>
  );
}
