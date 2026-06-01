/**
 * Pulsing "offline" overlay shown when `device.isOnline === false`.
 * Soft-dims the dial area without blocking interaction completely —
 * users can still navigate to Settings or the device picker.
 */

import { StyleSheet, Text, View } from 'react-native';

import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

export function DeviceOfflineOverlay() {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <Text style={[EmberTypography.labelSmall(Colors.textTertiary), styles.label]}>
        DEVICE OFFLINE
      </Text>
      <Text style={EmberTypography.bodySmall()}>
        Polling will resume when it reconnects.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000080',
    gap: 6,
  },
  label: { letterSpacing: 2 },
});
