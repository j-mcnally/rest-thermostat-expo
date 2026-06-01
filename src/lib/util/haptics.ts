/**
 * Throttled selection-click haptic. Ported from
 * `lib/services/haptics.dart` upstream. The dial calls this every
 * time the user crosses a tick mid-drag; throttling keeps the device
 * from over-buzzing on a fast sweep.
 */

import * as Haptics from 'expo-haptics';

const MIN_GAP_MS = 33; // ~30/sec
let lastFiredAt = 0;

export function throttledSelectionClick(): void {
  const now = Date.now();
  if (now - lastFiredAt < MIN_GAP_MS) return;
  lastFiredAt = now;
  // Fire-and-forget — promise rejection is fine to swallow (haptics
  // are advisory).
  void Haptics.selectionAsync().catch(() => undefined);
}

export function impactLight(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
    () => undefined,
  );
}

export function impactMedium(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
    () => undefined,
  );
}
