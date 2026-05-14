import { Card, CardHeader, CardTitle } from '@/components/shared/Card';
import { getAQICategory } from '@/lib/aqi-utils';
import { cn } from '@/lib/cn';
import { MAX_FORECAST_DAYS, dayName, isTodayOrLater } from '@/lib/forecast-utils';
import type { WaqiForecastDaily, WaqiForecastPoint } from '@/types/waqi';

interface ForecastCardsProps {
  daily: WaqiForecastDaily | undefined;
  /** Attribution for the forecast model, shown in the header. */
  source?: string;
}

interface DayForecast {
  day: string;
  pm25?: WaqiForecastPoint;
  pm10?: WaqiForecastPoint;
  o3?: WaqiForecastPoint;
}

function combine(daily: WaqiForecastDaily | undefined): DayForecast[] {
  if (!daily) return [];
  const map = new Map<string, DayForecast>();
  for (const key of ['pm25', 'pm10', 'o3'] as const) {
    for (const point of daily[key] ?? []) {
      const existing = map.get(point.day) ?? { day: point.day };
      existing[key] = point;
      map.set(point.day, existing);
    }
  }
  return Array.from(map.values())
    .filter((d) => isTodayOrLater(d.day))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(0, MAX_FORECAST_DAYS);
}

export function ForecastCards({ daily, source }: ForecastCardsProps) {
  const days = combine(daily);
  if (days.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{days.length}-day outlook</CardTitle>
        {source && (
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Source: {source}
          </span>
        )}
      </CardHeader>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {days.map((d) => {
          const value = d.pm25 ?? d.pm10 ?? d.o3;
          if (!value) return null;
          const cat = getAQICategory(value.avg);
          return (
            <div
              key={d.day}
              className={cn(
                'flex flex-col rounded-2xl border border-white/80 bg-white p-4 shadow-sm transition',
                'hover:-translate-y-0.5 hover:shadow-md',
                'dark:border-white/10 dark:bg-white/[0.04]',
              )}
            >
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {dayName(d.day)}
              </div>

              <div
                className={cn(
                  'tabular font-display mt-3 text-[2.6rem] font-bold leading-none tracking-tight',
                  cat.textClass,
                )}
              >
                {value.avg}
              </div>

              <span
                className={cn(
                  'mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]',
                  cat.bgClass,
                  cat.preferDarkText ? 'text-slate-900' : 'text-white',
                )}
              >
                {cat.label}
              </span>

              <div className="mt-3 flex items-baseline gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                <span className="tabular">
                  {value.min}–{value.max}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider">AQI range</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
