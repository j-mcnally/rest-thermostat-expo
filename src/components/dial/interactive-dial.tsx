/**
 * Stateful wrapper around <TemperatureDial>. Ported from
 * `lib/widgets/interactive_temperature_dial.dart` upstream.
 *
 * Responsibilities:
 * 1. Optimistic state. While dragging, the dial reflects the finger.
 *    `optimisticC` overrides server-reported `targetTemperature`
 *    until reconciliation matches or fails.
 * 2. 250ms debounce after pan-end / tap before issuing the POST.
 * 3. POST `set_temperature` + reconciliation. The +1/+3/+7s post-
 *    write refetch cadence is driven by `useDevicesReconciler`.
 * 4. 7s confirm timeout — if the next snapshot's target doesn't match
 *    the optimistic value, surface a non-blocking warning without
 *    snapping back (per upstream §3.4).
 * 5. Failure path. NleAuthError fires the auth-failure coordinator;
 *    other failures clear the optimistic state.
 *
 * Heat-cool mode replaces whichever bound (low / high) is closer to
 * the new target — same heuristic as upstream.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  TemperatureDial,
  celsiusForTickIndex,
  MAX_CELSIUS,
  MIN_CELSIUS,
  TICK_COUNT,
  tickIndexForCelsius,
} from './dial';
import type { Device } from '@/lib/api/types/device';
import { isNleError } from '@/lib/errors/nle-error';
import { useDevicesReconciler } from '@/lib/polling/use-devices';
import { useAuthFailureCoordinator } from '@/lib/state/auth-failure-coordinator';
import { useNleClient } from '@/lib/state/nle-client-hook';

interface InteractiveTemperatureDialProps {
  device: Device;
  displayUnit: 'C' | 'F';
  diameter?: number;
  /** Surface failures up to the caller (snackbar). */
  onFailure?: (message: string, retry?: () => void) => void;
}

export function InteractiveTemperatureDial({
  device,
  displayUnit,
  diameter,
  onFailure,
}: InteractiveTemperatureDialProps) {
  const client = useNleClient();
  const triggerReconcile = useDevicesReconciler();
  const fireAuthFailure = useAuthFailureCoordinator((s) => s.fire);

  const [optimisticC, setOptimisticC] = useState<number | null>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConfirm = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    commitTimer.current = null;
    confirmTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Reconcile against incoming snapshots: if we're waiting on a
  // confirmation and the next snapshot's targetTemperature matches
  // within half a tick, clear the optimistic override.
  useEffect(() => {
    if (pendingConfirm.current == null) return;
    const epsilon = (MAX_CELSIUS - MIN_CELSIUS) / (TICK_COUNT - 1) / 2;
    if (
      Math.abs(device.targetTemperature - pendingConfirm.current) <= epsilon
    ) {
      pendingConfirm.current = null;
      if (confirmTimer.current) {
        clearTimeout(confirmTimer.current);
        confirmTimer.current = null;
      }
      setOptimisticC(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.targetTemperature]);

  const commit = useCallback(
    async (celsius: number) => {
      if (!client) return;
      const clamped = Math.min(MAX_CELSIUS, Math.max(MIN_CELSIUS, celsius));
      setOptimisticC(clamped);
      pendingConfirm.current = clamped;

      const value = buildValue(device, clamped);

      try {
        await client.sendCommand({
          serial: device.serial,
          command: 'set_temperature',
          value,
        });
      } catch (e) {
        if (isNleError(e) && e.type === 'auth') {
          fireAuthFailure({ isCloudflareAccess: e.isCloudflareAccess });
        } else {
          onFailure?.("Couldn't update temperature.", () => void commit(clamped));
        }
        setOptimisticC(null);
        pendingConfirm.current = null;
        return;
      }

      triggerReconcile();

      // 7s confirm timeout per upstream §3.4.
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => {
        onFailure?.("Couldn't confirm the new setpoint.", () => void commit(clamped));
        pendingConfirm.current = null;
      }, 7_000);
    },
    [client, device, fireAuthFailure, onFailure, triggerReconcile],
  );

  const onDragUpdate = useCallback((c: number) => {
    setOptimisticC(c);
    if (commitTimer.current) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
  }, []);

  const onDragEnd = useCallback(
    (c: number) => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(() => {
        void commit(c);
      }, 250);
    },
    [commit],
  );

  const onTap = useCallback(
    (c: number) => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(() => {
        void commit(c);
      }, 250);
    },
    [commit],
  );

  const bump = useCallback(
    (direction: 1 | -1) => {
      const current = optimisticC ?? device.targetTemperature;
      const idx = tickIndexForCelsius(current);
      const next = Math.max(0, Math.min(TICK_COUNT - 1, idx + direction));
      const c = celsiusForTickIndex(next);
      if (Math.abs(c - current) < 1e-9) return;
      setOptimisticC(c);
      if (commitTimer.current) clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(() => void commit(c), 250);
    },
    [commit, device.targetTemperature, optimisticC],
  );

  const displayedC = optimisticC ?? device.targetTemperature;

  return (
    <TemperatureDial
      currentTemperatureCelsius={device.currentTemperature}
      targetTemperatureCelsius={displayedC}
      mode={device.mode}
      displayUnit={displayUnit}
      diameter={diameter}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
      onTap={onTap}
      onIncrease={() => bump(1)}
      onDecrease={() => bump(-1)}
    />
  );
}

/** Build the `value` payload for `set_temperature`. */
function buildValue(device: Device, clamped: number): unknown {
  if (device.mode !== 'heatCool') return clamped;
  const low = device.targetTemperatureLow ?? clamped;
  const high = device.targetTemperatureHigh ?? clamped;
  const distLow = Math.abs(clamped - low);
  const distHigh = Math.abs(clamped - high);
  if (distLow <= distHigh) return { low: clamped, high };
  return { low, high: clamped };
}
