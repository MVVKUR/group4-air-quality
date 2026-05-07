import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useStationFeed } from '@/hooks/useAQIData';
import { HeroAQI } from '@/components/dashboard/HeroAQI';
import { WeatherStrip } from '@/components/dashboard/WeatherStrip';
import { PollutantTable } from '@/components/dashboard/PollutantTable';
import { StationHistoryChart } from '@/components/dashboard/StationHistoryChart';
import { HealthAdvisory } from '@/components/shared/HealthAdvisory';
import { Skeleton } from '@/components/shared/Skeleton';
import { ErrorState } from '@/components/shared/ErrorState';

const StationLocationMap = lazy(() =>
  import('@/components/dashboard/StationLocationMap').then((m) => ({
    default: m.StationLocationMap,
  })),
);

export function StationPage() {
  const { id } = useParams<{ id: string }>();
  const uid = id ? Number(id) : null;
  const { data, isLoading, isError, refetch, isFetching } = useStationFeed(uid);

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <Link
        to="/map"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to map
      </Link>

      {isLoading && (
        <>
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </>
      )}

      {isError && (
        <ErrorState
          title="Couldn't load this station"
          message="The station might be offline or the ID is invalid."
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <>
          <HeroAQI feed={data} isRefreshing={isFetching} onRefresh={() => refetch()} />

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <WeatherStrip iaqi={data.iaqi} />
            <Suspense
              fallback={<Skeleton className="h-56 rounded-2xl" />}
            >
              <StationLocationMap
                lat={data.city.geo[0]}
                lon={data.city.geo[1]}
                aqi={typeof data.aqi === 'number' ? data.aqi : null}
                name={data.city.name}
              />
            </Suspense>
          </div>

          <HealthAdvisory aqi={typeof data.aqi === 'number' ? data.aqi : null} />

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <StationHistoryChart
                daily={data.forecast?.daily}
                currentAqi={typeof data.aqi === 'number' ? data.aqi : 100}
              />
            </div>
            <div className="lg:col-span-2">
              <PollutantTable iaqi={data.iaqi} />
            </div>
          </div>

          {data.attributions && data.attributions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              <div className="mb-1 font-semibold uppercase tracking-wider">Data sources</div>
              <ul className="flex flex-wrap gap-3">
                {data.attributions.map((a) => (
                  <li key={a.name}>
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        {a.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      a.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
