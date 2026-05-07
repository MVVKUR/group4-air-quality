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
        'relative overflow-hidden rounded-3xl p-5 sm:p-8 lg:p-10 text-white animate-fade-in',
        'bg-gradient-to-br shadow-2xl',
        cat.gradientClass,
      )}
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-black/20 blur-3xl sm:h-72 sm:w-72" />

      <div className="relative flex flex-col gap-5 md:grid md:grid-cols-[1fr_auto] md:items-end md:gap-8">
        <div className="min-w-0">
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium opacity-90 sm:text-sm',
              cat.preferDarkText ? 'text-slate-900/85' : 'text-white/85',
            )}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">{feed.city.name}</span>
          </div>

          <div className="mt-2 flex items-end gap-3 sm:mt-3 sm:gap-4">
            <div
              className={cn(
                // Tighter mobile scale: 320px-friendly. Desktop keeps the
                // dramatic 8xl headline.
                'tabular font-black leading-[0.9] tracking-tighter drop-shadow-sm',
                'text-[68px] sm:text-7xl lg:text-8xl',
                cat.preferDarkText ? 'text-slate-900' : 'text-white',
              )}
            >
              {aqi ?? '—'}
            </div>
            <div
              className={cn(
                'mb-1 sm:mb-2',
                cat.preferDarkText ? 'text-slate-900/80' : 'text-white/85',
              )}
            >
              <div className="text-[10px] uppercase tracking-widest font-semibold sm:text-xs">
                US AQI
              </div>
              <div className="text-sm font-semibold leading-tight sm:text-base sm:font-medium">
                {cat.label}
              </div>
            </div>
          </div>

          {dominant && (
            <span
              className={cn(
                'mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur sm:mt-5 sm:text-xs',
                cat.preferDarkText ? 'bg-black/15 text-slate-900' : 'bg-white/15 text-white',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="truncate">{dominant} is the main concern</span>
            </span>
          )}

          <p
            className={cn(
              'mt-4 max-w-xl text-[13px] leading-relaxed sm:mt-5 sm:text-[15px]',
              cat.preferDarkText ? 'text-slate-900/80' : 'text-white/90',
            )}
          >
            {cat.advisory}
          </p>
        </div>

        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md',
            'md:flex-col md:items-end',
          )}
        >
          <div className="min-w-0">
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium md:justify-end',
                cat.preferDarkText ? 'text-slate-900/80' : 'text-white/80',
              )}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{timeAgo(feed.time.iso)}</span>
            </div>
            <div
              className={cn(
                'mt-0.5 truncate text-[11px] md:text-right',
                cat.preferDarkText ? 'text-slate-900/60' : 'text-white/60',
              )}
            >
              {formatJakartaTime(feed.time.iso)} WIB
            </div>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh air quality data"
              className={cn(
                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition hover:bg-white/25 active:scale-95 disabled:opacity-60 sm:h-10 sm:w-10',
                cat.preferDarkText &&
                  'text-slate-900 border-slate-900/20 bg-slate-900/10 hover:bg-slate-900/20',
              )}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
