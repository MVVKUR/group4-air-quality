import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { AQIBadge } from '@/components/shared/AQIBadge';
import { getAQICategory, timeAgo } from '@/lib/aqi-utils';
import type { NormalizedStation } from '@/types/waqi';
import { cn } from '@/lib/cn';

interface StationPopupProps {
  station: NormalizedStation;
}

export function StationPopup({ station }: StationPopupProps) {
  const cat = getAQICategory(station.aqi);
  return (
    <div className="overflow-hidden rounded-2xl">
      <div className={cn('px-4 py-3 text-white bg-gradient-to-br', cat.gradientClass)}>
        <div className={cn('text-[11px] font-semibold uppercase tracking-wider', cat.preferDarkText ? 'text-slate-900/85' : 'text-white/85')}>
          Live AQI
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span
            className={cn(
              'tabular text-3xl font-black',
              cat.preferDarkText ? 'text-slate-900' : 'text-white',
            )}
          >
            {station.aqi ?? '—'}
          </span>
          <AQIBadge aqi={station.aqi} size="sm" showLabel className="ml-auto" />
        </div>
      </div>
      <div className="px-4 py-3">
        <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-50">
          {station.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          {timeAgo(station.updatedAt)}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
          {cat.shortAdvisory}
        </p>
        <Link
          to={`/station/${station.uid}`}
          className="mt-3 inline-flex w-full items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          View station details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
