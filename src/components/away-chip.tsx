/**
 * Manual-away / eco toggle chip. Ported from
 * `lib/widgets/interactive_away_chip.dart`. POSTs `set_away true/false`
 * — server flips `eco_mode` between `"manual-eco"` and `"schedule"`.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { Device } from '@/lib/api/types/device';
import { isAway } from '@/lib/api/types/device';
import { isNleError } from '@/lib/errors/nle-error';
import { useDevicesReconciler } from '@/lib/polling/use-devices';
import { useAuthFailureCoordinator } from '@/lib/state/auth-failure-coordinator';
import { useNleClient } from '@/lib/state/nle-client-hook';
import { impactLight } from '@/lib/util/haptics';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

export function AwayChip({ device }: { device: Device }) {
  const client = useNleClient();
  const triggerReconcile = useDevicesReconciler();
  const fireAuth = useAuthFailureCoordinator((s) => s.fire);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const away = optimistic ?? isAway(device);

  async function toggle() {
    if (!client) return;
    const next = !away;
    setOptimistic(next);
    impactLight();
    try {
      await client.sendCommand({
        serial: device.serial,
        command: 'set_away',
        value: next,
      });
      triggerReconcile();
    } catch (e) {
      setOptimistic(null);
      if (isNleError(e) && e.type === 'auth') {
        fireAuth({ isCloudflareAccess: e.isCloudflareAccess });
      }
    }
  }

  return (
    <Pressable
      onPress={toggle}
      style={[
        styles.chip,
        away ? styles.chipActive : null,
      ]}
    >
      <Text
        style={EmberTypography.labelSmall(
          away ? Colors.textPrimary : Colors.textSecondary,
        )}
      >
        {away ? 'AWAY • ECO' : 'AWAY'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.textDisabled,
  },
  chipActive: {
    backgroundColor: Colors.eco + '40',
    borderColor: Colors.eco,
  },
});
