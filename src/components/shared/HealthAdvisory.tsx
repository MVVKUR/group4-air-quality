import { ShieldAlert, ShieldCheck, Sparkles, Wind } from 'lucide-react';
import { AQI_CATEGORIES, getAQICategory } from '@/lib/aqi-utils';
import { cn } from '@/lib/cn';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  HEALTH_CONDITIONS,
  isSensitiveProfile,
  type HealthCondition,
  type UserProfile,
} from '@/types/profile';

interface HealthAdvisoryProps {
  aqi: number | null | undefined;
  variant?: 'default' | 'inline';
  className?: string;
}

function bumpedCategory(aqi: number | null | undefined, profile: UserProfile | null) {
  const base = getAQICategory(aqi);
  if (!isSensitiveProfile(profile)) return { cat: base, bumped: false };
  const idx = AQI_CATEGORIES.indexOf(base);
  // For sensitive groups, raise the advisory by one tier (capped at hazardous).
  const next = AQI_CATEGORIES[Math.min(idx + 1, AQI_CATEGORIES.length - 1)];
  return { cat: next, bumped: next !== base };
}

function conditionLabel(c: HealthCondition): string {
  return HEALTH_CONDITIONS.find((opt) => opt.value === c)?.label ?? c;
}

function profileSummary(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.ageRange === '65-plus') parts.push('age 65+');
  else if (profile.ageRange === 'under-18') parts.push('under 18');
  const conds = profile.conditions.filter((c) => c !== 'none').map(conditionLabel);
  if (conds.length > 0) parts.push(conds.join(', ').toLowerCase());
  return parts.join(' · ');
}

export function HealthAdvisory({ aqi, variant = 'default', className }: HealthAdvisoryProps) {
  const { profile } = useUserProfile();
  const { cat, bumped } = bumpedCategory(aqi, profile);
  const Icon = cat.key === 'good' ? ShieldCheck : cat.key === 'moderate' ? Wind : ShieldAlert;

  if (variant === 'inline') {
    return (
      <p className={cn('text-sm text-slate-600 dark:text-slate-300', className)}>
        <Icon className={cn('inline -mt-0.5 mr-1.5 h-4 w-4', cat.textClass)} />
        {cat.advisory}
      </p>
    );
  }
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border bg-white/70 p-4 backdrop-blur-md',
        'dark:bg-slate-900/60 dark:border-slate-800',
        cat.borderClass,
        className,
      )}
    >
      <div
        className={cn(
          'rounded-xl p-2',
          cat.bgClass,
          cat.preferDarkText ? 'text-slate-900' : 'text-white',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wider',
            cat.textClass,
          )}
        >
          <span>Health advisory · {cat.label}</span>
          {bumped && profile && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-slate-600 dark:bg-white/10 dark:text-slate-300">
              <Sparkles className="h-3 w-3" />
              Personalized for {profile.name.split(/\s+/)[0]}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {cat.advisory}
        </p>
        {bumped && profile && (
          <p className="mt-1.5 text-[11px] italic text-slate-500 dark:text-slate-400">
            Tier raised because of your profile ({profileSummary(profile)}).
          </p>
        )}
      </div>
    </div>
  );
}
