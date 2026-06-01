/**
 * Fan toggle with a spinning glyph when the fan is on. Ported from
 * `lib/widgets/fan_widget.dart` + `interactive_fan_widget.dart`.
 *
 * Posts `set_fan_timer` with a 60-minute default when toggled on;
 * posts `set_fan_timer` 0 when toggled off.
 */

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

import type { Device } from '@/lib/api/types/device';
import { isNleError } from '@/lib/errors/nle-error';
import { useDevicesReconciler } from '@/lib/polling/use-devices';
import { useAuthFailureCoordinator } from '@/lib/state/auth-failure-coordinator';
import { useNleClient } from '@/lib/state/nle-client-hook';
import { impactLight } from '@/lib/util/haptics';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

const DEFAULT_FAN_TIMER_MIN = 60;

export function FanWidget({ device }: { device: Device }) {
  const client = useNleClient();
  const triggerReconcile = useDevicesReconciler();
  const fireAuth = useAuthFailureCoordinator((s) => s.fire);
  const [busy, setBusy] = useState(false);
  const rotation = useSharedValue(0);

  const on = device.hvac.fan || device.fanTimerActive;

  useEffect(() => {
    if (on) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [on, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  async function toggle() {
    if (!client || busy) return;
    setBusy(true);
    impactLight();
    try {
      await client.sendCommand({
        serial: device.serial,
        command: 'set_fan_timer',
        value: on ? 0 : DEFAULT_FAN_TIMER_MIN * 60,
      });
      triggerReconcile();
    } catch (e) {
      if (isNleError(e) && e.type === 'auth') {
        fireAuth({ isCloudflareAccess: e.isCloudflareAccess });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!device.capabilities.hasFan) return null;

  return (
    <Pressable onPress={toggle} disabled={busy} style={styles.tile}>
      <Animated.View style={[styles.glyph, animatedStyle]}>
        <Text style={[styles.fanIcon, { color: on ? Colors.textPrimary : Colors.textTertiary }]}>
          ✦
        </Text>
      </Animated.View>
      <Text
        style={EmberTypography.labelSmall(
          on ? Colors.textPrimary : Colors.textSecondary,
        )}
      >
        FAN {on ? 'ON' : 'OFF'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  glyph: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  fanIcon: { fontSize: 24 },
});
