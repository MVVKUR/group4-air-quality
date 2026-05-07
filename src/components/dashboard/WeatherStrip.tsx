import { Droplets, Gauge, Thermometer, Wind } from 'lucide-react';
import type { IAQIMap } from '@/types/waqi';
import { cn } from '@/lib/cn';

interface WeatherStripProps {
  iaqi: IAQIMap;
}

export function WeatherStrip({ iaqi }: WeatherStripProps) {
  const items: { key: string; icon: React.ReactNode; label: string; value: string | null }[] = [
    {
      key: 't',
      icon: <Thermometer className="h-4 w-4" />,
      label: 'Temp',
      value: iaqi.t ? `${Math.round(iaqi.t.v)}°C` : null,
    },
    {
      key: 'h',
      icon: <Droplets className="h-4 w-4" />,
      label: 'Humidity',
      value: iaqi.h ? `${Math.round(iaqi.h.v)}%` : null,
    },
    {
      key: 'w',
      icon: <Wind className="h-4 w-4" />,
      label: 'Wind',
      value: iaqi.w ? `${iaqi.w.v.toFixed(1)} m/s` : null,
    },
    {
      key: 'p',
      icon: <Gauge className="h-4 w-4" />,
      label: 'Pressure',
      value: iaqi.p ? `${Math.round(iaqi.p.v)} hPa` : null,
    },
  ].filter((i) => i.value !== null);

  if (items.length === 0) return null;

  return (
    <div className="card-base flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
      {items.map((item, idx) => (
        <div key={item.key} className="flex items-center gap-3">
          {idx > 0 && (
            <div
              className={cn('hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:block')}
              aria-hidden
            />
          )}
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {item.icon}
            </span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider">
                {item.label}
              </div>
              <div className="tabular text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
