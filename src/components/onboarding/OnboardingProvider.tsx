import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { OnboardingSheet } from './OnboardingSheet';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { UserProfile } from '@/types/profile';

interface OnboardingContextValue {
  profile: UserProfile | null;
  open: () => void;
  close: () => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const SKIP_KEY = 'childair:onboarding-skipped';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { profile, saveProfile, clearProfile } = useUserProfile();
  const [open, setOpen] = useState(false);

  // Auto-open on first visit if no profile and not previously skipped.
  useEffect(() => {
    if (profile) return;
    let skipped = false;
    try {
      skipped = window.localStorage.getItem(SKIP_KEY) === '1';
    } catch {
      // ignore
    }
    if (!skipped) {
      // Defer to next tick so the page can paint first.
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [profile]);

  const handleSubmit = useCallback(
    (next: Omit<UserProfile, 'version' | 'updatedAt'>) => {
      saveProfile(next);
      setOpen(false);
    },
    [saveProfile],
  );

  const handleSkip = useCallback(() => {
    try {
      window.localStorage.setItem(SKIP_KEY, '1');
    } catch {
      // ignore
    }
    setOpen(false);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      profile,
      open: () => setOpen(true),
      close: () => setOpen(false),
      reset: () => {
        clearProfile();
        try {
          window.localStorage.removeItem(SKIP_KEY);
        } catch {
          // ignore
        }
        setOpen(true);
      },
    }),
    [profile, clearProfile],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingSheet
        open={open}
        initial={profile}
        onClose={() => setOpen(false)}
        onSkip={profile ? undefined : handleSkip}
        onSubmit={handleSubmit}
      />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
