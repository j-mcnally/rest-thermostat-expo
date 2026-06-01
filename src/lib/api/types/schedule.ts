/**
 * Schedule types. Ported from `lib/models/schedule.dart` upstream.
 *
 * The NLE Control API stores a per-day schedule as:
 *   { monday: ScheduleEvent[], tuesday: …, … }
 * with each event carrying a time (minutes-from-midnight), a target
 * temperature, and an optional mode override.
 */

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const DAY_KEYS: readonly DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

/**
 * One scheduled setpoint event. `time` is minutes from midnight
 * (0..1439). `temperature` is Celsius (server's native unit).
 *
 * `mode` is optional per upstream — when omitted, the device uses its
 * current mode at the time of the event.
 */
export interface ScheduleEvent {
  time: number;
  temperature: number;
  mode?: string;
  /** Optional dual-setpoint (heat-cool) bounds. */
  temperatureHigh?: number;
  temperatureLow?: number;
}

export function scheduleEventFromJson(
  json: Record<string, unknown>,
): ScheduleEvent {
  const out: ScheduleEvent = {
    time: Number(json['time'] ?? 0),
    temperature: Number(json['temperature'] ?? 0),
  };
  if (typeof json['mode'] === 'string') out.mode = json['mode'] as string;
  if (json['temperature_high'] != null)
    out.temperatureHigh = Number(json['temperature_high']);
  if (json['temperature_low'] != null)
    out.temperatureLow = Number(json['temperature_low']);
  return out;
}

export function scheduleEventToJson(
  event: ScheduleEvent,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    time: event.time,
    temperature: event.temperature,
  };
  if (event.mode != null) out['mode'] = event.mode;
  if (event.temperatureHigh != null)
    out['temperature_high'] = event.temperatureHigh;
  if (event.temperatureLow != null)
    out['temperature_low'] = event.temperatureLow;
  return out;
}

export type Schedule = Readonly<Record<DayKey, ScheduleEvent[]>>;

function emptyDayMap(): Record<DayKey, ScheduleEvent[]> {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

export function emptySchedule(): Schedule {
  return emptyDayMap();
}

export function scheduleFromJson(json: Record<string, unknown>): Schedule {
  const out = emptyDayMap();
  for (const day of DAY_KEYS) {
    const raw = json[day];
    if (!Array.isArray(raw)) continue;
    out[day] = raw.map((e) => scheduleEventFromJson(e as Record<string, unknown>));
  }
  return out;
}

export function scheduleToJson(schedule: Schedule): Record<string, unknown> {
  return Object.fromEntries(
    DAY_KEYS.map((day) => [day, schedule[day].map(scheduleEventToJson)]),
  );
}
