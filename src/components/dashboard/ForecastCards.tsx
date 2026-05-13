import { Card, CardHeader, CardTitle } from '@/components/shared/Card';
import { AQIBadge } from '@/components/shared/AQIBadge';
import { getAQICategory } from '@/lib/aqi-utils';
import { cn } from '@/lib/cn';
import type { WaqiForecastDaily, WaqiForecastPoint } from '@/types/waqi';

interface ForecastCardsProps {
  daily: WaqiForecastDaily | undefined;
}

interface DayForecast {
  day: string;
  pm25?: WaqiForecastPoint;
  pm10?: WaqiForecastPoint;
  o3?: WaqiForecastPoint;
}

function dayName(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (24 * 3600_000));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short' });
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
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(0, 3);
}

export function ForecastCards({ daily }: ForecastCardsProps) {
  const days = combine(daily);
  if (days.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>3-day outlook</CardTitle>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          Source: WAQI forecast
        </span>
      </CardHeader>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {days.map((d) => {
          const value = d.pm25 ?? d.pm10 ?? d.o3;
          if (!value) return null;
          const cat = getAQICategory(value.avg);
          return (
            <div
              key={d.day}
              className="group relative overflow-hidden rounded-[1.45rem] border border-white/70 bg-[#fbf8ef]/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/90 dark:border-white/10 dark:bg-white/5"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#f2ff72]/35 blur-xl" />
              <div className="relative flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', cat.bgClass)} />
                  {dayName(d.day)}
                </span>
                <AQIBadge aqi={value.avg} size="sm" showLabel={false} />
              </div>
              <div
                className={cn(
                  'tabular font-display relative mt-4 text-5xl font-bold leading-none tracking-tight',
                  cat.textClass,
                )}
              >
                {value.avg}
              </div>
              <div className="relative mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                Range {value.min}–{value.max} · {cat.label}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
