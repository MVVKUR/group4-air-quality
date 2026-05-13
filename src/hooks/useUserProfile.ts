import { useCallback, useEffect, useState } from 'react';
import type { UserProfile } from '@/types/profile';

const STORAGE_KEY = 'childair:profile:v1';

function readProfile(): UserProfile | null {
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

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(() => readProfile());

  const saveProfile = useCallback((next: Omit<UserProfile, 'version' | 'updatedAt'>) => {
    const full: UserProfile = {
      version: 1,
      ...next,
      updatedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    } catch {
      // ignore quota errors
    }
    setProfileState(full);
    return full;
  }, []);

  const clearProfile = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setProfileState(null);
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setProfileState(readProfile());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return { profile, saveProfile, clearProfile };
}
