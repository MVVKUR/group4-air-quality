import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { AQI_CATEGORIES } from '@/lib/aqi-utils';
import { cn } from '@/lib/cn';

interface MapLegendProps {
  className?: string;
}

export function MapLegend({ className }: MapLegendProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('pointer-events-auto', className)}>
      {/* Mobile: collapsed pill that expands on tap */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Hide legend' : 'Show legend'}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-lg backdrop-blur active:scale-95 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-200"
        >
          <Info className="h-3.5 w-3.5" />
          <span>Legend</span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div className="mt-2 rounded-xl border border-white/40 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
            <LegendList />
          </div>
        )}
      </div>

      {/* Tablet+ : always-visible card */}
      <div className="hidden rounded-xl border border-white/40 bg-white/85 p-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/80 sm:block">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          US AQI scale
        </div>
        <LegendList />
      </div>
    </div>
  );
}

function LegendList() {
  return (
    <ul className="space-y-1">
      {AQI_CATEGORIES.map((cat) => (
        <li key={cat.key} className="flex items-center gap-2 text-[11px]">
          <span className={cn('h-2.5 w-2.5 rounded-full', cat.bgClass)} aria-hidden />
          <span className="tabular font-medium text-slate-700 dark:text-slate-200">
            {cat.range[1] === Number.POSITIVE_INFINITY
              ? `${cat.range[0]}+`
              : `${cat.range[0]}–${cat.range[1]}`}
          </span>
          <span className="text-slate-500 dark:text-slate-400">{cat.label}</span>
        </li>
      ))}
    </ul>
  );
}
