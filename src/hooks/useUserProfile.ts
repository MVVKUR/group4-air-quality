import { useCallback, useSyncExternalStore } from 'react';
import type { UserProfile } from '@/types/profile';

/**
 * Single shared profile store backed by `localStorage`.
 *
 * Why a module-level store: multiple components (DashboardPage, HealthAdvisory,
 * OnboardingProvider, AppHeader) all need to read the same profile. A plain
 * `useState`-based hook gives every caller its own private state, so a save
 * from one component never reaches the others until they unmount/remount.
 * `useSyncExternalStore` is React 18's primitive for exactly this — one source
 * of truth, every consumer re-renders simultaneously.
 *
 * The cross-tab `storage` event is also handled here so a save in one tab
 * propagates to other tabs of the same app.
 */

const STORAGE_KEY = 'childair:profile:v1';

function readFromStorage(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (parsed.version !== 1) return null;
    if (typeof parsed.name !== 'string' || !parsed.ageRange) return null;
    return parsed;
  } catch {
    return null;
  }
}

let cached: UserProfile | null = readFromStorage();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  // Other-tab writes need to refresh our cache. Same-tab writes go through
  // saveProfile/clearProfile below and call emit() directly.
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cached = readFromStorage();
    emit();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): UserProfile | null {
  return cached;
}

function getServerSnapshot(): UserProfile | null {
  return null;
}

export function useUserProfile() {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const saveProfile = useCallback(
    (next: Omit<UserProfile, 'version' | 'updatedAt'>): UserProfile => {
      const full: UserProfile = {
        version: 1,
        ...next,
        updatedAt: new Date().toISOString(),
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
      } catch {
        // ignore quota errors — in-memory state still updates
      }
      cached = full;
      emit();
      return full;
    },
    [],
  );

  const clearProfile = useCallback((): void => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    cached = null;
    emit();
  }, []);

  return { profile, saveProfile, clearProfile };
}
