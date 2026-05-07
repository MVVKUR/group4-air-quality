import { useJakartaFeed } from '@/hooks/useAQIData';
import { HeroAQI } from '@/components/dashboard/HeroAQI';
import { PollutantGrid } from '@/components/dashboard/PollutantGrid';
import { WeatherStrip } from '@/components/dashboard/WeatherStrip';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { ForecastCards } from '@/components/dashboard/ForecastCards';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { HealthAdvisory } from '@/components/shared/HealthAdvisory';
import { isUsingMockData } from '@/lib/waqi-api';
import { useUserProfile } from '@/hooks/useUserProfile';

export function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useJakartaFeed();
  const { profile } = useUserProfile();
  const firstName = profile?.name.trim().split(/\s+/)[0] ?? null;

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <ErrorState
        message="We couldn't load Jakarta air quality data. Check your network or token configuration."
        onRetry={() => refetch()}
      />
    );
  }

  const aqi = typeof data.aqi === 'number' ? data.aqi : 0;

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      {isUsingMockData() && <MockBanner />}
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
          <TrendChart currentAqi={aqi} />
        </div>
        <div className="lg:col-span-2">
          <ForecastCards daily={data.forecast?.daily} />
        </div>
      </div>
    </div>
  );
}

function MockBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-[13px] leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200 sm:text-sm">
      <strong className="font-semibold">Demo mode.</strong> Add a WAQI token in{' '}
      <code className="break-all rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-amber-900/40 sm:text-xs">
        .env.local
      </code>{' '}
      to display live data. Get a free token at{' '}
      <a
        className="underline underline-offset-2"
        href="https://aqicn.org/data-platform/token/"
        target="_blank"
        rel="noreferrer"
      >
        aqicn.org
      </a>
      .
    </div>
  );
}
