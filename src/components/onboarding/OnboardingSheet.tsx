import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  AGE_RANGES,
  HEALTH_CONDITIONS,
  type AgeRange,
  type HealthCondition,
  type UserProfile,
} from '@/types/profile';

interface OnboardingSheetProps {
  open: boolean;
  initial?: UserProfile | null;
  onClose: () => void;
  onSkip?: () => void;
  onSubmit: (profile: Omit<UserProfile, 'version' | 'updatedAt'>) => void;
}

export function OnboardingSheet({
  open,
  initial,
  onClose,
  onSkip,
  onSubmit,
}: OnboardingSheetProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [ageRange, setAgeRange] = useState<AgeRange | ''>(initial?.ageRange ?? '');
  const [conditions, setConditions] = useState<HealthCondition[]>(
    initial?.conditions ?? [],
  );
  const nameId = useId();
  const ageGroupId = useId();
  const conditionsGroupId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset when re-opening with different initial
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setAgeRange(initial?.ageRange ?? '');
      setConditions(initial?.conditions ?? []);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the dialog so screen readers announce it.
    requestAnimationFrame(() => dialogRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const trimmedName = name.trim();
  const isValid = useMemo(() => {
    return trimmedName.length >= 1 && ageRange !== '';
  }, [trimmedName, ageRange]);

  const toggleCondition = (cond: HealthCondition) => {
    setConditions((prev) => {
      if (cond === 'none') {
        return prev.includes('none') ? [] : ['none'];
      }
      const withoutNone = prev.filter((c) => c !== 'none');
      return withoutNone.includes(cond)
        ? withoutNone.filter((c) => c !== cond)
        : [...withoutNone, cond];
    });
  };

  const handleSubmit = () => {
    if (!isValid || ageRange === '') return;
    onSubmit({
      name: trimmedName,
      ageRange,
      conditions: conditions.length === 0 ? ['none'] : conditions,
    });
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        aria-label="Close onboarding"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white shadow-2xl outline-none',
          'rounded-t-3xl border-t border-slate-200',
          'sm:max-w-lg sm:rounded-3xl sm:border',
          'dark:bg-slate-950 dark:border-slate-800',
          'animate-fade-in',
        )}
      >
        {/* Drag handle (mobile bottom-sheet affordance) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span
            className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700"
            aria-hidden
          />
        </div>

        <header className="safe-px flex items-start gap-3 px-5 pt-4 pb-3 sm:px-7 sm:pt-6">
          <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 p-2.5 text-white shadow-lg shadow-orange-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="onboarding-title"
              className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-50 sm:text-xl"
            >
              Sesuaikan rekomendasi udara
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Personalize air quality advice for you. Stays on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="safe-px flex-1 space-y-5 overflow-y-auto px-5 pb-3 sm:px-7">
          {/* Name */}
          <section>
            <label
              htmlFor={nameId}
              className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Name
            </label>
            <input
              id={nameId}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              autoComplete="given-name"
              className={cn(
                'mt-2 block h-12 w-full rounded-2xl border bg-white px-4 text-base text-slate-900 placeholder:text-slate-400',
                'border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200',
                'dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-800',
              )}
            />
          </section>

          {/* Age range */}
          <section>
            <span
              id={ageGroupId}
              className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Age range
            </span>
            <div
              role="radiogroup"
              aria-labelledby={ageGroupId}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {AGE_RANGES.map((opt) => {
                const checked = ageRange === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setAgeRange(opt.value)}
                    className={cn(
                      'inline-flex h-11 items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition active:scale-[0.98]',
                      checked
                        ? 'border-slate-900 bg-slate-900 text-white shadow dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Health conditions */}
          <section>
            <div className="flex items-baseline justify-between gap-3">
              <span
                id={conditionsGroupId}
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Punya sakit khusus?
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Boleh pilih lebih dari satu
              </span>
            </div>
            <div
              role="group"
              aria-labelledby={conditionsGroupId}
              className="mt-2 flex flex-wrap gap-2"
            >
              {HEALTH_CONDITIONS.map((opt) => {
                const checked = conditions.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleCondition(opt.value)}
                    className={cn(
                      'inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition active:scale-[0.98]',
                      checked
                        ? 'border-slate-900 bg-slate-900 text-white shadow dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700',
                    )}
                  >
                    <span>{opt.label}</span>
                    {opt.hint && (
                      <span
                        className={cn(
                          'text-[10px] font-normal',
                          checked
                            ? 'text-white/70 dark:text-slate-900/70'
                            : 'text-slate-400 dark:text-slate-500',
                        )}
                      >
                        {opt.hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <p className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            We'll use this to tailor health advisories — especially for sensitive groups
            (elderly, pregnant, or with respiratory/cardiac conditions). Data never leaves
            your browser.
          </p>
        </div>

        <footer className="safe-pb safe-px sticky bottom-0 flex items-center gap-2 border-t border-slate-100 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-7 sm:py-4">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="h-11 rounded-full px-4 text-sm font-medium text-slate-500 transition hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              'ml-auto inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition active:scale-95',
              isValid
                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
            )}
          >
            <span>Save</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}
