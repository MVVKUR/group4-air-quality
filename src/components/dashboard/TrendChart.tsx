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
import { REFRESH_INTERVAL_MS, STALE_TIME_MS } from '@/lib/constants';

interface TrendChartProps {
  currentAqi: number;
}

interface ChartDatum {
  time: string;
  hour: string;
  aqi: number;
}

export function TrendChart({ currentAqi }: TrendChartProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['history', 'jakarta'],
    queryFn: ({ signal }) => fetchOpenMeteoHourlyHistory(signal),
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
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
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
            <CartesianGrid stroke="rgba(122,137,134,0.16)" vertical={false} />
            <ReferenceArea y1={0} y2={50} fill="#EFFF74" fillOpacity={0.18} />
            <ReferenceArea y1={50} y2={100} fill="#FFE7A5" fillOpacity={0.14} />
            <ReferenceArea y1={100} y2={150} fill="#FFC38A" fillOpacity={0.10} />
            <ReferenceArea y1={150} y2={200} fill="#F49A8D" fillOpacity={0.08} />
            <ReferenceArea y1={200} y2={300} fill="#C6A4C9" fillOpacity={0.08} />
            <ReferenceArea y1={300} y2={upperBound} fill="#B58A99" fillOpacity={0.08} />
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
                borderRadius: 18,
                border: 'none',
                boxShadow: '0 18px 40px rgba(82,105,110,0.18)',
                background: 'rgba(255,255,255,0.94)',
                color: '#23313a',
                fontSize: 12,
              }}
              labelStyle={{ color: '#607f83', fontWeight: 800 }}
              formatter={(value) => [`${value} AQI`, 'AQI']}
            />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke={aqiHexFor(currentAqi)}
              strokeWidth={3}
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
