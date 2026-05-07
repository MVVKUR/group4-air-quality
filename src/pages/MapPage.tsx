import { lazy, Suspense } from 'react';
import { useJakartaStations } from '@/hooks/useAQIData';
import { Skeleton } from '@/components/shared/Skeleton';
import { ErrorState } from '@/components/shared/ErrorState';

const JakartaMap = lazy(() =>
  import('@/components/map/JakartaMap').then((m) => ({ default: m.JakartaMap })),
);

export function MapPage() {
  const { data, isLoading, isError, refetch } = useJakartaStations();

  return (
    <div className="space-y-3 animate-fade-in sm:space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl lg:text-3xl">
            Jakarta station map
          </h1>
          <p className="mt-1 max-w-xl text-[13px] text-slate-500 dark:text-slate-400 sm:text-sm">
            Live AQI from monitoring stations across Greater Jakarta. Tap any marker to view
            details.
          </p>
        </div>
        {data && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {data.length} live stations
            </div>
          </div>
        )}
      </header>

      {isLoading && (
        <Skeleton className="h-[calc(100dvh-220px)] min-h-[420px] rounded-2xl sm:rounded-3xl sm:min-h-[520px]" />
      )}
      {isError && (
        <ErrorState
          title="Couldn't load station map"
          message="The map service is unavailable right now. Try again in a moment."
          onRetry={() => refetch()}
        />
      )}
      {data && (
        <Suspense
          fallback={
            <Skeleton className="h-[calc(100dvh-220px)] min-h-[420px] rounded-2xl sm:rounded-3xl sm:min-h-[520px]" />
          }
        >
          <JakartaMap stations={data} />
        </Suspense>
      )}
    </div>
  );
}
