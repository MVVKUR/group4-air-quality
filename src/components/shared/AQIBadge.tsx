import { cn } from '@/lib/cn';
import { getAQICategory } from '@/lib/aqi-utils';

interface AQIBadgeProps {
  aqi: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<AQIBadgeProps['size']>, string> = {
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function AQIBadge({ aqi, size = 'md', showLabel = true, className }: AQIBadgeProps) {
  const cat = getAQICategory(aqi);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold tracking-tight ring-1 ring-inset',
        cat.bgClass,
        cat.preferDarkText ? 'text-slate-900' : 'text-white',
        cat.ringClass,
        SIZE[size],
        className,
      )}
    >
      {typeof aqi === 'number' ? aqi : '—'}
      {showLabel && <span className="opacity-90 font-medium">{cat.label}</span>}
    </span>
  );
}
