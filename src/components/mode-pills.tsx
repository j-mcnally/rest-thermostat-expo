/**
 * Mode pill selector. Ported from
 * `lib/widgets/mode_pills.dart` + `interactive_mode_pills.dart`.
 *
 * Pills shown depend on capabilities:
 * - canHeat → Heat
 * - canCool → Cool
 * - canHeat && canCool → Heat·Cool (range)
 * - hasEmerHeat → Emergency
 * - always: Off
 */

import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Device, DeviceMode } from '@/lib/api/types/device';
import { deviceModeToApi } from '@/lib/api/types/device';
import { isNleError } from '@/lib/errors/nle-error';
import { useDevicesReconciler } from '@/lib/polling/use-devices';
import { useAuthFailureCoordinator } from '@/lib/state/auth-failure-coordinator';
import { useNleClient } from '@/lib/state/nle-client-hook';
import { impactLight } from '@/lib/util/haptics';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

interface ModePillsProps {
  device: Device;
}

const LABELS: Record<DeviceMode, string> = {
  off: 'Off',
  heat: 'Heat',
  cool: 'Cool',
  heatCool: 'Range',
  emergency: 'Emer.',
};

export function ModePills({ device }: ModePillsProps) {
  const client = useNleClient();
  const triggerReconcile = useDevicesReconciler();
  const fireAuth = useAuthFailureCoordinator((s) => s.fire);
  const [optimistic, setOptimistic] = useState<DeviceMode | null>(null);

  const modes = availableModes(device);
  const active = optimistic ?? device.mode;

  const commit = useCallback(
    async (next: DeviceMode) => {
      if (!client || next === active) return;
      impactLight();
      setOptimistic(next);
      try {
        await client.sendCommand({
          serial: device.serial,
          command: 'set_mode',
          value: deviceModeToApi(next),
        });
        triggerReconcile();
      } catch (e) {
        if (isNleError(e) && e.type === 'auth') {
          fireAuth({ isCloudflareAccess: e.isCloudflareAccess });
        }
        setOptimistic(null);
      }
    },
    [client, active, device.serial, fireAuth, triggerReconcile],
  );

  return (
    <View style={styles.row}>
      {modes.map((mode) => {
        const isActive = mode === active;
        return (
          <Pressable
            key={mode}
            onPress={() => void commit(mode)}
            style={[styles.pill, isActive && pillActiveStyleFor(mode)]}
          >
            <Text
              style={EmberTypography.labelSmall(
                isActive ? Colors.textPrimary : Colors.textSecondary,
              )}
            >
              {LABELS[mode].toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function availableModes(device: Device): DeviceMode[] {
  const out: DeviceMode[] = ['off'];
  if (device.capabilities.canHeat) out.push('heat');
  if (device.capabilities.canCool) out.push('cool');
  if (device.capabilities.canHeat && device.capabilities.canCool)
    out.push('heatCool');
  if (device.capabilities.hasEmerHeat) out.push('emergency');
  return out;
}

function pillActiveStyleFor(mode: DeviceMode) {
  switch (mode) {
    case 'heat':
    case 'emergency':
      return { backgroundColor: Colors.heatGlow + '40', borderColor: Colors.heatGlow };
    case 'cool':
      return { backgroundColor: Colors.coolGlow + '40', borderColor: Colors.coolGlow };
    case 'off':
    case 'heatCool':
      return {
        backgroundColor: '#ffffff15',
        borderColor: Colors.textPrimary,
      };
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.textDisabled,
  },
});
