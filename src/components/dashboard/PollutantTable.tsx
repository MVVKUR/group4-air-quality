import { Card, CardHeader, CardTitle } from '@/components/shared/Card';
import { POLLUTANT_LABELS } from '@/lib/constants';
import { getAQICategory } from '@/lib/aqi-utils';
import { cn } from '@/lib/cn';
import type { IAQIMap, PollutantKey } from '@/types/waqi';

interface PollutantTableProps {
  iaqi: IAQIMap;
}

const ORDER: PollutantKey[] = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'];

// US EPA AQI breakpoints for the "Good/Moderate" boundary, used as quick reference
const HEALTH_THRESHOLDS: Record<PollutantKey, string> = {
  pm25: 'WHO 24h: 15 µg/m³ · ISPU 50',
  pm10: 'WHO 24h: 45 µg/m³ · ISPU 50',
  o3: 'WHO 8h: 100 µg/m³',
  no2: 'WHO 24h: 25 µg/m³',
  so2: 'WHO 24h: 40 µg/m³',
  co: 'WHO 24h: 4 mg/m³',
};

export function PollutantTable({ iaqi }: PollutantTableProps) {
  const rows = ORDER.filter((p) => typeof iaqi[p]?.v === 'number');
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All pollutant readings</CardTitle>
      </CardHeader>
      <div className="-mx-1 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 sm:mx-0">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2">Pollutant</th>
              <th className="px-4 py-2">iAQI</th>
              <th className="px-4 py-2">Category</th>
              <th className="hidden px-4 py-2 sm:table-cell">Reference threshold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((p) => {
              const v = iaqi[p]!.v;
              const cat = getAQICategory(v);
              const meta = POLLUTANT_LABELS[p];
              return (
                <tr key={p} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {meta.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {meta.full}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular font-semibold text-slate-900 dark:text-slate-100">
                    {Math.round(v)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        cat.bgClass,
                        cat.preferDarkText ? 'text-slate-900' : 'text-white',
                      )}
                    >
                      {cat.label}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-slate-500 dark:text-slate-400 sm:table-cell">
                    {HEALTH_THRESHOLDS[p]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
