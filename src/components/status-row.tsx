/**
 * Top-of-home status row: ModePills + AwayChip + DeviceIndicatorDots.
 */

import { StyleSheet, View } from 'react-native';

import type { Device } from '@/lib/api/types/device';

import { AwayChip } from './away-chip';
import { DeviceIndicatorDots } from './device-indicator-dots';
import { ModePills } from './mode-pills';

interface StatusRowProps {
  device: Device;
  devices: Device[];
  selectedSerial: string | null;
  onSelectDevice(serial: string): void;
}

export function StatusRow({
  device,
  devices,
  selectedSerial,
  onSelectDevice,
}: StatusRowProps) {
  return (
    <View style={styles.wrap}>
      <ModePills device={device} />
      <AwayChip device={device} />
      <DeviceIndicatorDots
        devices={devices}
        selectedSerial={selectedSerial}
        onSelect={onSelectDevice}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
});
