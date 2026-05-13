import { RefreshCw, MapPin, Clock } from 'lucide-react';
import {
  DOMINANT_POLLUTANT_LABELS,
  formatJakartaTime,
  getAQICategory,
  timeAgo,
} from '@/lib/aqi-utils';
import type { WaqiFeed } from '@/types/waqi';
import { cn } from '@/lib/cn';

interface HeroAQIProps {
  feed: WaqiFeed;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function HeroAQI({ feed, isRefreshing, onRefresh }: HeroAQIProps) {
  const aqi = typeof feed.aqi === 'number' ? feed.aqi : null;
  const cat = getAQICategory(aqi);
  const dominant = feed.dominentpol
    ? DOMINANT_POLLUTANT_LABELS[feed.dominentpol] ?? feed.dominentpol.toUpperCase()
    : null;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-white/70 p-4 text-slate-900 animate-fade-in sm:p-6 lg:p-7',
        'bg-gradient-to-br from-[#8fa9b6] via-[#c9d9cb] to-[#f7f2d2] shadow-[0_24px_70px_rgba(82,105,110,0.20)]',
        'dark:border-white/10 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 dark:text-white',
      )}
    >
      <div className="soft-contours pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#f2ff72]/55 blur-3xl sm:h-72 sm:w-72" />
      <div className="pointer-events-none absolute -bottom-24 left-4 h-64 w-64 rounded-full bg-white/35 blur-3xl sm:h-80 sm:w-80" />

      <div className="relative grid gap-5 lg:grid-cols-[1fr_0.92fr] lg:items-stretch">
        <div className="min-w-0">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/45 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-200 sm:text-[13px]"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">{feed.city.name}</span>
          </div>

          <div className="mt-5 max-w-xl sm:mt-7">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-100">
              Real-time
            </span>
            <h1 className="font-display mt-3 text-[46px] font-bold leading-[0.95] tracking-[-0.04em] text-white drop-shadow-sm sm:text-6xl lg:text-7xl dark:text-slate-50">
              Air quality care
            </h1>
            <p className="mt-4 max-w-lg text-sm font-semibold leading-relaxed text-white/85 sm:text-base dark:text-slate-200">
              A softer read on today's air, built for family decisions before school runs,
              walks, and playtime.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-slate-100">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: cat.hex }}
                aria-hidden
              />
              {cat.label}
            </span>
            {dominant && (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#23313a]/18 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur dark:bg-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f2ff72]" />
                <span className="truncate">{dominant} is the main concern</span>
              </span>
            )}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/75 bg-white/78 p-3 shadow-[0_18px_50px_rgba(68,88,91,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/45 sm:p-4">
          <div className="soft-contours relative overflow-hidden rounded-[1.5rem] bg-[#f2ff72] p-5 text-slate-950 shadow-inner sm:p-6">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/35 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-700/75">
                  Current AQI
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className="tabular font-display text-[72px] font-bold leading-[0.82] tracking-[-0.06em] sm:text-8xl">
                    {aqi ?? '—'}
                  </span>
                  <span className="mb-2 text-sm font-black uppercase tracking-wider">US AQI</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                disabled={!onRefresh || isRefreshing}
                aria-label="Refresh air quality data"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-sm transition hover:bg-white active:scale-95 disabled:opacity-60"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              </button>
            </div>

            <div className="relative mt-5 rounded-3xl bg-white/55 p-4 text-sm font-bold leading-relaxed text-slate-800 backdrop-blur">
              {cat.advisory}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-3xl bg-[#f7f2e8]/80 px-4 py-3 text-slate-600 dark:bg-white/10 dark:text-slate-300">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-extrabold">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{timeAgo(feed.time.iso)}</span>
              </div>
              <div className="mt-0.5 truncate text-[11px] font-bold text-slate-400">
                {formatJakartaTime(feed.time.iso)} WIB
              </div>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              Family guide
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
