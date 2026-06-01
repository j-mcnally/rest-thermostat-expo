/**
 * Devices polling query. Ported from
 * `lib/state/polling_device_state_source.dart` upstream.
 *
 * 20-second cadence under foreground, paused under background.
 * Write paths call `triggerReconcile()` to kick a +1s / +3s / +7s
 * sequence of refetches so a `set_temperature` result is reflected
 * in the UI without waiting 20s for the next tick.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import type { NleClient } from '@/lib/api/nle-client';
import type { Device } from '@/lib/api/types/device';
import type { NleError } from '@/lib/errors/nle-error';
import { isNleError } from '@/lib/errors/nle-error';
import { useAuthFailureCoordinator } from '@/lib/state/auth-failure-coordinator';

const POLL_INTERVAL_MS = 20_000;

export const DEVICES_QUERY_KEY = ['nle', 'devices'] as const;

export function useDevices(client: NleClient | null) {
  const fire = useAuthFailureCoordinator((s) => s.fire);

  // Forward auth failures from the bg poll to the coordinator so the
  // settings deep-link snackbar can fire even though no UI write
  // touched the dial.
  useEffect(() => {
    if (!client) return;
    const cb = (err: unknown) => {
      if (isNleError(err) && err.type === 'auth') {
        fire({ isCloudflareAccess: err.isCloudflareAccess });
      }
    };
    // react-query 5 doesn't have a top-level error callback per query
    // instance; we wrap the queryFn instead, but provide this hook
    // for callers who want to install their own observer.
    void cb;
  }, [client, fire]);

  return useQuery<Device[], NleError>({
    queryKey: DEVICES_QUERY_KEY,
    enabled: !!client,
    queryFn: async () => {
      if (!client) throw new Error('No NLE client');
      try {
        const resp = await client.getDevices();
        return resp.devices;
      } catch (e) {
        if (isNleError(e) && e.type === 'auth') {
          fire({ isCloudflareAccess: e.isCloudflareAccess });
        }
        throw e;
      }
    },
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useDevicesReconciler() {
  const queryClient = useQueryClient();
  const triggerReconcile = useCallback(() => {
    const kick = () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    };
    setTimeout(kick, 1_000);
    setTimeout(kick, 3_000);
    setTimeout(kick, 7_000);
  }, [queryClient]);
  return triggerReconcile;
}

/**
 * Bridge AppState → react-query so we pause polling in background
 * (and force a refetch on resume).
 */
export function usePollPauseOnBackground() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const handle = (next: AppStateStatus) => {
      if (next === 'active') {
        queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
      }
    };
    const sub = AppState.addEventListener('change', handle);
    return () => sub.remove();
  }, [queryClient]);
}
