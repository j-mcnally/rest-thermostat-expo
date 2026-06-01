/**
 * Hit-mapping helpers for the temperature dial. Ported verbatim from
 * the Flutter `TemperatureDial.tickIndexForLocalPoint` /
 * `tickIndexForCelsius` / `celsiusForTickIndex` statics so the test
 * fixtures map cleanly.
 *
 * Visual contract (matches upstream §10.3):
 * - 72 discrete radial tick marks span 270° of arc (3.75° per tick),
 *   leaving the bottom 90° open.
 * - Tick 0 anchors at angle 135° (SW), then sweeps clockwise through
 *   the top to tick 71 at angle 45° (SE).
 */

export const TICK_COUNT = 72;
export const MIN_CELSIUS = 4.5;
export const MAX_CELSIUS = 32.0;
/** Arc start angle (radians). Tick 0 at SW. Canvas convention. */
export const ARC_START = (3 * Math.PI) / 4; // 135°
/** Total arc swept in radians. 270° leaves a 90° gap at the bottom. */
export const ARC_SWEEP = (3 * Math.PI) / 2; // 270°
/** Preferred logical-pixel diameter; callers wrap in a box. */
export const PREFERRED_DIAMETER = 240;

/** Map a Celsius value to a discrete tick index in [0, TICK_COUNT). */
export function tickIndexForCelsius(celsius: number): number {
  const clamped = Math.min(MAX_CELSIUS, Math.max(MIN_CELSIUS, celsius));
  const ratio = (clamped - MIN_CELSIUS) / (MAX_CELSIUS - MIN_CELSIUS);
  const raw = Math.round(ratio * (TICK_COUNT - 1));
  return Math.max(0, Math.min(TICK_COUNT - 1, raw));
}

/** Inverse of tickIndexForCelsius. */
export function celsiusForTickIndex(index: number): number {
  const clamped = Math.max(0, Math.min(TICK_COUNT - 1, index));
  const ratio = clamped / (TICK_COUNT - 1);
  return MIN_CELSIUS + ratio * (MAX_CELSIUS - MIN_CELSIUS);
}

/**
 * Map a local touch point inside a square widget to a tick index, or
 * null if the touch falls in the bottom-90° gap. Beyond-arc but still-
 * meaningful angles are clamped to the nearest end-tick so the user
 * can drag past the top edge without losing the target.
 */
export function tickIndexForLocalPoint(
  x: number,
  y: number,
  size: number,
): number | null {
  const cx = size / 2;
  const cy = size / 2;
  const dx = x - cx;
  const dy = y - cy;
  if (dx === 0 && dy === 0) return null;
  let theta = Math.atan2(dy, dx); // [-π, π], east=0, south=+π/2
  if (theta < ARC_START) {
    theta += 2 * Math.PI;
  }
  const pos = theta - ARC_START;
  if (pos > ARC_SWEEP) {
    const gapMid = ARC_SWEEP + (2 * Math.PI - ARC_SWEEP) / 2;
    return pos < gapMid ? TICK_COUNT - 1 : 0;
  }
  const step = ARC_SWEEP / (TICK_COUNT - 1);
  return Math.max(0, Math.min(TICK_COUNT - 1, Math.round(pos / step)));
}

/** Convert celsius → display unit (no-op for C). */
export function celsiusToDisplay(celsius: number, unit: 'C' | 'F'): number {
  if (unit === 'F') return (celsius * 9) / 5 + 32;
  return celsius;
}
