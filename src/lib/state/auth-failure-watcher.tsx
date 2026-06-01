/**
 * Mounts an effect that routes to /(tabs)/settings whenever the
 * auth-failure coordinator fires. Ported from the deep-link snackbar
 * pattern in the upstream Flutter app.
 */

import { router, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuthFailureCoordinator } from './auth-failure-coordinator';

export function AuthFailureWatcher() {
  const tick = useAuthFailureCoordinator((s) => s.tick);
  const acknowledge = useAuthFailureCoordinator((s) => s.acknowledge);
  const segments = useSegments();
  const previousTick = useRef(0);

  useEffect(() => {
    if (tick === previousTick.current) return;
    previousTick.current = tick;
    // Don't re-route if the user is already on settings — the snackbar
    // surface there will reflect the failure already.
    const onSettings = segments.some((s) => s === 'settings');
    if (!onSettings) {
      router.push('/(tabs)/settings');
    }
    acknowledge();
  }, [tick, segments, acknowledge]);

  return null;
}
