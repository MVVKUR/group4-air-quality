import {
  POLLUTANT_HAZARDOUS_THRESHOLD,
  POLLUTANT_LABELS,
} from '@/lib/constants';
import { getAQICategory, pollutantSeverityPct } from '@/lib/aqi-utils';
import { cn } from '@/lib/cn';

type PollutantKey = keyof typeof POLLUTANT_LABELS;

interface PollutantCardProps {
  pollutant: PollutantKey;
  value: number;
  isDominant?: boolean;
}

export function PollutantCard({ pollutant, value, isDominant }: PollutantCardProps) {
  const meta = POLLUTANT_LABELS[pollutant];
  const cat = getAQICategory(value);
  const pct = pollutantSeverityPct(value, POLLUTANT_HAZARDOUS_THRESHOLD);

  return (
    <div
      className={cn(
        'card-base p-4 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        isDominant && 'ring-1 ring-offset-2 ring-offset-white dark:ring-offset-slate-950',
        isDominant && cat.ringClass,
      )}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {meta.label}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{meta.full}</div>
        </div>
        <div className={cn('h-2 w-2 rounded-full', cat.bgClass)} aria-hidden />
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className={cn('tabular text-3xl font-bold', cat.textClass)}>{Math.round(value)}</span>
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{meta.unit}</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn('h-full rounded-full transition-all duration-500', cat.bgClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isDominant && (
        <div className={cn('mt-2 text-[10px] font-semibold uppercase tracking-wider', cat.textClass)}>
          Primary pollutant
        </div>
      )}
    </div>
  );
}
