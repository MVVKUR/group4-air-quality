import type { IAQIMap, PollutantKey } from '@/types/waqi';
import { PollutantCard } from './PollutantCard';

const ORDER: PollutantKey[] = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'];

interface PollutantGridProps {
  iaqi: IAQIMap;
  dominant?: string;
}

export function PollutantGrid({ iaqi, dominant }: PollutantGridProps) {
  const available = ORDER.filter((k) => typeof iaqi[k]?.v === 'number');
  if (available.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Pollutant breakdown
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {available.map((p) => (
          <PollutantCard
            key={p}
            pollutant={p}
            value={iaqi[p]!.v}
            isDominant={dominant === p}
          />
        ))}
      </div>
    </section>
  );
}
