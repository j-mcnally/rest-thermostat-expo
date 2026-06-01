/**
 * Modal sheet for switching between paired thermostats. Ported from
 * `lib/widgets/device_picker_sheet.dart`. Uses the RN `Modal` for now
 * — could swap in `@gorhom/bottom-sheet` later if Justin wants the
 * native drag affordance.
 */

import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

import type { Device } from '@/lib/api/types/device';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

interface DevicePickerSheetProps {
  visible: boolean;
  devices: Device[];
  selectedSerial: string | null;
  onPick(serial: string): void;
  onClose(): void;
}

export function DevicePickerSheet({
  visible,
  devices,
  selectedSerial,
  onPick,
  onClose,
}: DevicePickerSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grip} />
        <Text style={[EmberTypography.labelSmall(), styles.title]}>
          PICK A DEVICE
        </Text>
        <ScrollView contentContainerStyle={styles.list}>
          {devices.map((d) => {
            const isActive = d.serial === selectedSerial;
            return (
              <Pressable
                key={d.serial}
                onPress={() => {
                  onPick(d.serial);
                  onClose();
                }}
                style={[styles.row, isActive && styles.rowActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={EmberTypography.bodyLarge()}>
                    {d.name || d.serial}
                  </Text>
                  <Text
                    style={EmberTypography.bodySmall(Colors.textTertiary)}
                  >
                    {d.serial}
                    {d.isOnline ? '' : ' • offline'}
                  </Text>
                </View>
                {isActive && (
                  <Text style={EmberTypography.labelSmall(Colors.textPrimary)}>
                    ON
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: '#00000080' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0c0c10',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    maxHeight: '70%',
  },
  grip: {
    width: 36,
    height: 4,
    backgroundColor: '#ffffff20',
    alignSelf: 'center',
    borderRadius: 2,
  },
  title: { textAlign: 'center', letterSpacing: 2 },
  list: { gap: 6, paddingBottom: 16 },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff08',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowActive: { backgroundColor: '#ffffff15' },
});
