/**
 * `useSelectedDevice()` — find the Device matching the persisted
 * `pickedSerial` inside the current devices query. Falls back to the
 * first device when the persisted serial isn't found in the latest
 * snapshot (e.g. the user removed it server-side).
 */

import { useMemo } from 'react';

import type { Device } from '@/lib/api/types/device';
import { useConfigStore } from '@/lib/state/config-store';

export function useSelectedDevice(devices: Device[] | undefined): Device | null {
  const pickedSerial = useConfigStore((s) => s.pickedSerial);
  return useMemo(() => {
    if (!devices || devices.length === 0) return null;
    const explicit = devices.find((d) => d.serial === pickedSerial);
    return explicit ?? devices[0];
  }, [devices, pickedSerial]);
}
