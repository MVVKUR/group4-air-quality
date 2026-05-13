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
    <div className="card-base grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
      {items.map((item, idx) => (
        <div
          key={item.key}
          className={cn(
            'flex items-center gap-3 rounded-3xl bg-[#f7f2e8]/75 px-3 py-3 text-slate-600',
            'dark:bg-white/5 dark:text-slate-300',
            idx === 0 && 'sm:bg-[#eef7df]/80',
          )}
        >
          <span className="rounded-2xl bg-white p-2 text-[#607f83] shadow-sm dark:bg-slate-900 dark:text-slate-200">
            {item.icon}
          </span>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              {item.label}
            </div>
            <div className="tabular text-base font-black text-slate-800 dark:text-slate-100">
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
