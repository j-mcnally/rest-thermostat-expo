/**
 * Helpers for the schedule's day strip. Ported from
 * `lib/screens/schedule/day_index.dart`.
 *
 * The schedule wire shape is keyed by lowercase day name; the UI
 * thinks in 0..6 indices starting at Monday (matches upstream).
 */

import type { DayKey } from '@/lib/api/types/schedule';
import { DAY_KEYS } from '@/lib/api/types/schedule';

export const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export function indexToDay(i: number): DayKey {
  return DAY_KEYS[((i % 7) + 7) % 7];
}

export function dayToIndex(day: DayKey): number {
  return DAY_KEYS.indexOf(day);
}

export function todayIndex(now: Date = new Date()): number {
  // JS day-of-week is 0=Sun..6=Sat. Upstream is 0=Mon..6=Sun.
  return (now.getDay() + 6) % 7;
}

export function minutesToHm(minutes: number, hour12 = true): string {
  const m = Math.max(0, Math.min(1439, Math.round(minutes)));
  let h = Math.floor(m / 60);
  const mm = m % 60;
  const mmStr = mm.toString().padStart(2, '0');
  if (!hour12) return `${h.toString().padStart(2, '0')}:${mmStr}`;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mmStr} ${suffix}`;
}
