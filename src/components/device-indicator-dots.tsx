/**
 * Row of small dots, one per known device. Highlights the currently
 * selected device. Tapping a dot picks that device.
 */

import { Pressable, StyleSheet, View } from 'react-native';

import type { Device } from '@/lib/api/types/device';
import * as Colors from '@/lib/theme/colors';

interface IndicatorProps {
  devices: Device[];
  selectedSerial: string | null;
  onSelect(serial: string): void;
}

export function DeviceIndicatorDots({
  devices,
  selectedSerial,
  onSelect,
}: IndicatorProps) {
  if (devices.length <= 1) return null;
  return (
    <View style={styles.row}>
      {devices.map((d) => (
        <Pressable
          key={d.serial}
          onPress={() => onSelect(d.serial)}
          hitSlop={8}
          style={[
            styles.dot,
            d.serial === selectedSerial && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textDisabled,
  },
  dotActive: { backgroundColor: Colors.textPrimary, width: 18 },
});
