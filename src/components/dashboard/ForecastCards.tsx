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
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
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
              className={cn(
                'group relative overflow-hidden rounded-2xl border p-4 transition',
                'bg-gradient-to-br',
                cat.gradientClass,
                'border-white/30 hover:scale-[1.01]',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-between text-xs font-semibold uppercase tracking-wider',
                  cat.preferDarkText ? 'text-slate-900/85' : 'text-white/85',
                )}
              >
                <span>{dayName(d.day)}</span>
                <AQIBadge aqi={value.avg} size="sm" showLabel={false} />
              </div>
              <div
                className={cn(
                  'tabular mt-3 text-4xl font-black leading-none',
                  cat.preferDarkText ? 'text-slate-900' : 'text-white',
                )}
              >
                {value.avg}
              </div>
              <div
                className={cn(
                  'mt-1 text-xs',
                  cat.preferDarkText ? 'text-slate-900/75' : 'text-white/80',
                )}
              >
                Range {value.min}–{value.max} · {cat.label}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
