export type AgeRange = 'under-18' | '18-34' | '35-54' | '55-64' | '65-plus';

export type HealthCondition =
  | 'none'
  | 'asma'
  | 'jantung'
  | 'ppok'
  | 'alergi'
  | 'hamil';

export interface UserProfile {
  /** Schema version, bump if shape changes. */
  version: 1;
  name: string;
  ageRange: AgeRange;
  conditions: HealthCondition[];
  /** ISO timestamp of last save. */
  updatedAt: string;
}

export const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: 'under-18', label: 'Under 18' },
  { value: '18-34', label: '18 – 34' },
  { value: '35-54', label: '35 – 54' },
  { value: '55-64', label: '55 – 64' },
  { value: '65-plus', label: '65+' },
];

export const HEALTH_CONDITIONS: {
  value: HealthCondition;
  label: string;
  hint?: string;
}[] = [
  { value: 'none', label: 'Tidak ada', hint: 'No conditions' },
  { value: 'asma', label: 'Asma', hint: 'Asthma' },
  { value: 'ppok', label: 'PPOK', hint: 'COPD / chronic lung disease' },
  { value: 'jantung', label: 'Jantung', hint: 'Heart condition' },
  { value: 'alergi', label: 'Alergi pernapasan', hint: 'Respiratory allergies' },
  { value: 'hamil', label: 'Hamil', hint: 'Pregnant' },
];

/**
 * Conditions or age groups that warrant stricter air-quality advisories.
 * Source: US EPA + WHO sensitive-group guidance.
 */
export function isSensitiveProfile(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.ageRange === 'under-18' || profile.ageRange === '65-plus') return true;
  return profile.conditions.some((c) => c !== 'none');
}
