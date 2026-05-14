import { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/shared/Card';
import { aqiHexFor } from '@/lib/aqi-utils';
import { MAX_FORECAST_DAYS, dayName, isTodayOrLater } from '@/lib/forecast-utils';
import type { WaqiForecastDaily } from '@/types/waqi';

interface StationHistoryChartProps {
  daily: WaqiForecastDaily | undefined;
  currentAqi: number;
  /** Attribution for the forecast model, shown in the header. */
  source?: string;
}

interface Point {
  day: string;
  label: string;
  pm25?: number;
  pm10?: number;
  o3?: number;
}

export function StationHistoryChart({
  daily,
  currentAqi,
  source,
}: StationHistoryChartProps) {
  const data: Point[] = useMemo(() => {
    if (!daily) return [];
    const map = new Map<string, Point>();
    for (const key of ['pm25', 'pm10', 'o3'] as const) {
      for (const point of daily[key] ?? []) {
        const existing =
          map.get(point.day) ??
          ({ day: point.day, label: dayName(point.day) } as Point);
        existing[key] = point.avg;
        map.set(point.day, existing);
      }
    }
    // Same window as the dashboard's ForecastCards: today onward only.
    return Array.from(map.values())
      .filter((p) => isTodayOrLater(p.day))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(0, MAX_FORECAST_DAYS);
  }, [daily]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.length}-day forecast (per pollutant)</CardTitle>
        {source && (
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Source: {source}
          </span>
        )}
      </CardHeader>
      <div className="-mx-2 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 18, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'currentColor', fontSize: 10 }}
              stroke="rgba(148,163,184,0.4)"
              tickLine={false}
              minTickGap={20}
              interval="preserveStartEnd"
              className="text-slate-500 dark:text-slate-400"
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 10 }}
              stroke="rgba(148,163,184,0.4)"
              tickLine={false}
              width={28}
              className="text-slate-500 dark:text-slate-400"
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                background: 'rgba(15,23,42,0.92)',
                color: 'white',
                fontSize: 12,
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Line
              type="monotone"
              dataKey="pm25"
              name="PM2.5"
              stroke={aqiHexFor(currentAqi)}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="pm10"
              name="PM10"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="o3"
              name="O₃"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
