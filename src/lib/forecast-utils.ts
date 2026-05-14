/**
 * Shared helpers for rendering daily air-quality forecasts.
 *
 * Both the dashboard's ForecastCards and the station detail page's
 * StationHistoryChart consume WAQI/CAMS `forecast.daily` data, which spans a
 * few past days plus several future days. These helpers give them a single,
 * timezone-safe definition of "which days to show" and "how to label them".
 */

/** Upper bound on how many forecast days any view will render. */
export const MAX_FORECAST_DAYS = 7;

/**
 * Parse a "YYYY-MM-DD" key into a local-midnight Date. Building from explicit
 * components avoids the UTC-parsing ambiguity of `new Date("YYYY-MM-DD")`,
 * which shifts the calendar day in negative-offset timezones.
 */
export function parseLocalDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Local midnight for the current day — the cutoff for "today onward". */
export function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

/** Human label for a forecast day: "Today", "Tomorrow", or e.g. "Sat 16". */
export function dayName(iso: string): string {
  const target = parseLocalDay(iso);
  if (Number.isNaN(target.getTime())) return iso;
  const diff = Math.round((target.getTime() - startOfToday().getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return target.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' });
}

/** True when the given "YYYY-MM-DD" key is today or later. */
export function isTodayOrLater(iso: string): boolean {
  return parseLocalDay(iso).getTime() >= startOfToday().getTime();
}
