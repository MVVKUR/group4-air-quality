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
        'card-base group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90',
        isDominant && 'ring-2 ring-offset-2 ring-offset-[#f7f2e8] dark:ring-offset-slate-950',
        isDominant && cat.ringClass,
      )}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {meta.label}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">{meta.full}</div>
        </div>
        <div className={cn('h-3 w-3 rounded-full shadow-sm', cat.bgClass)} aria-hidden />
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className={cn('tabular font-display text-4xl font-bold tracking-tight', cat.textClass)}>{Math.round(value)}</span>
        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500">{meta.unit}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#eee7da] dark:bg-slate-800">
        <div
          className={cn('h-full rounded-full transition-all duration-500', cat.bgClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isDominant && (
        <div className={cn('mt-3 text-[10px] font-black uppercase tracking-[0.16em]', cat.textClass)}>
          Primary pollutant
        </div>
      )}
    </div>
  );
}
