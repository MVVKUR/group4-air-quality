import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/shared/Card';
import { Skeleton } from '@/components/shared/Skeleton';
import { aqiHexFor } from '@/lib/aqi-utils';
import { fetchOpenMeteoHourlyHistory } from '@/lib/openmeteo-api';
import { JAKARTA_CENTER, REFRESH_INTERVAL_MS, STALE_TIME_MS } from '@/lib/constants';

interface TrendChartProps {
  currentAqi: number;
  /** Optional explicit coordinate; defaults to Jakarta city center. */
  lat?: number;
  lon?: number;
}

interface ChartDatum {
  time: string;
  hour: string;
  aqi: number;
}

export function TrendChart({ currentAqi, lat, lon }: TrendChartProps) {
  const latitude = lat ?? (JAKARTA_CENTER as [number, number])[0];
  const longitude = lon ?? (JAKARTA_CENTER as [number, number])[1];

  const { data: history, isLoading } = useQuery({
    queryKey: ['openmeteo', 'history', latitude, longitude],
    queryFn: ({ signal }) => fetchOpenMeteoHourlyHistory(latitude, longitude, signal),
    staleTime: STALE_TIME_MS,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const data: ChartDatum[] = useMemo(() => {
    if (!history) return [];
    return history.map((p) => {
      const d = new Date(p.t);
      return {
        time: p.t,
        hour: d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          timeZone: 'Asia/Jakarta',
        }),
        aqi: p.aqi,
      };
    });
  }, [history]);

  if (isLoading || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>24-hour AQI trend</CardTitle>
        </CardHeader>
        <Skeleton className="h-64 rounded-xl" />
      </Card>
    );
  }

  const maxObserved = Math.max(...data.map((d) => d.aqi), currentAqi);
  const upperBound = Math.max(220, Math.ceil((maxObserved + 30) / 50) * 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle>24-hour AQI trend</CardTitle>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Open-Meteo · hourly
        </span>
      </CardHeader>
      <div className="-mx-2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 18, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="aqiArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={aqiHexFor(currentAqi)} stopOpacity={0.55} />
                <stop offset="100%" stopColor={aqiHexFor(currentAqi)} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
            <ReferenceArea y1={0} y2={50} fill="#00E400" fillOpacity={0.07} />
            <ReferenceArea y1={50} y2={100} fill="#FFD400" fillOpacity={0.08} />
            <ReferenceArea y1={100} y2={150} fill="#FF7E00" fillOpacity={0.07} />
            <ReferenceArea y1={150} y2={200} fill="#FF0000" fillOpacity={0.06} />
            <ReferenceArea y1={200} y2={300} fill="#8F3F97" fillOpacity={0.06} />
            <ReferenceArea y1={300} y2={upperBound} fill="#7E0023" fillOpacity={0.06} />
            <XAxis
              dataKey="hour"
              tick={{ fill: 'currentColor', fontSize: 10 }}
              stroke="rgba(148,163,184,0.4)"
              tickLine={false}
              minTickGap={28}
              interval="preserveStartEnd"
              className="text-slate-500 dark:text-slate-400"
            />
            <YAxis
              domain={[0, upperBound]}
              tick={{ fill: 'currentColor', fontSize: 10 }}
              stroke="rgba(148,163,184,0.4)"
              tickLine={false}
              width={28}
              className="text-slate-500 dark:text-slate-400"
            />
            <Tooltip
              cursor={{ stroke: 'rgba(148,163,184,0.4)', strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                background: 'rgba(15,23,42,0.92)',
                color: 'white',
                fontSize: 12,
              }}
              labelStyle={{ color: '#cbd5e1', fontWeight: 500 }}
              formatter={(value) => [`${value} AQI`, 'AQI']}
            />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke={aqiHexFor(currentAqi)}
              strokeWidth={2.5}
              fill="url(#aqiArea)"
              activeDot={{ r: 5, strokeWidth: 0 }}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
