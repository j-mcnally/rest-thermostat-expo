import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConnectionStatusPill, type ConnectionState } from '@/components/connection-status-pill';
import { DeviceOfflineOverlay } from '@/components/device-offline-overlay';
import { DevicePickerSheet } from '@/components/device-picker-sheet';
import { EmberBackground } from '@/components/ember-background';
import { FanWidget } from '@/components/fan-widget';
import { InteractiveTemperatureDial } from '@/components/dial/interactive-dial';
import { StaleStatePill } from '@/components/stale-state-pill';
import { StatusRow } from '@/components/status-row';
import { router } from 'expo-router';
import { isNleError, networkErrorCopy } from '@/lib/errors/nle-error';
import {
  useDevices,
  usePollPauseOnBackground,
} from '@/lib/polling/use-devices';
import { useConfigStore } from '@/lib/state/config-store';
import { useNleClient } from '@/lib/state/nle-client-hook';
import { useSelectedDevice } from '@/lib/state/selected-device';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

export default function HomeTab() {
  usePollPauseOnBackground();
  const client = useNleClient();
  const {
    data: devices,
    error,
    isLoading,
    dataUpdatedAt,
  } = useDevices(client);
  const device = useSelectedDevice(devices);
  const displayUnit = useConfigStore((s) => s.displayUnit);
  const setPickedSerial = useConfigStore((s) => s.setPickedSerial);

  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const mode = device?.mode ?? 'neutral';
  const ageMs = dataUpdatedAt ? Date.now() - dataUpdatedAt : 0;
  const connState: ConnectionState = error
    ? 'error'
    : isLoading
      ? 'idle'
      : ageMs > 45_000
        ? 'stale'
        : 'live';

  return (
    <EmberBackground mode={mode}>
      <SafeAreaView style={styles.container}>
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.textSecondary} />
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.center}>
            <Text style={[EmberTypography.bodyMedium(), styles.errorTitle]}>
              {formatError(error)}
            </Text>
          </View>
        )}

        {!isLoading && !error && device && (
          <View style={styles.body}>
            <View style={styles.topRow}>
              <Pressable onPress={() => setSheetOpen(true)}>
                <Text style={[EmberTypography.labelSmall(), styles.kicker]}>
                  {(device.name ?? device.serial).toUpperCase()} ▾
                </Text>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <ConnectionStatusPill state={connState} error={error} />
                <StaleStatePill ageMs={ageMs} />
              </View>
            </View>

            <View style={styles.dialWrap}>
              <InteractiveTemperatureDial
                device={device}
                displayUnit={displayUnit}
                onFailure={(msg) => setSnackbar(msg)}
              />
              {!device.isOnline && <DeviceOfflineOverlay />}
            </View>

            <StatusRow
              device={device}
              devices={devices ?? []}
              selectedSerial={device.serial}
              onSelectDevice={(s) => void setPickedSerial(s)}
            />

            <FanWidget device={device} />

            <Pressable
              onPress={() => router.push(`/device/${device.serial}`)}
              style={styles.detailsLink}
            >
              <Text style={EmberTypography.labelSmall(Colors.textTertiary)}>
                DETAILS →
              </Text>
            </Pressable>
          </View>
        )}

        {snackbar && (
          <Pressable
            onPress={() => setSnackbar(null)}
            style={styles.snackbar}
          >
            <Text style={EmberTypography.bodyMedium()}>{snackbar}</Text>
          </Pressable>
        )}

        <DevicePickerSheet
          visible={sheetOpen}
          devices={devices ?? []}
          selectedSerial={device?.serial ?? null}
          onPick={(s) => void setPickedSerial(s)}
          onClose={() => setSheetOpen(false)}
        />
      </SafeAreaView>
    </EmberBackground>
  );
}

function formatError(e: unknown): string {
  if (!isNleError(e)) return 'Something went wrong.';
  switch (e.type) {
    case 'auth':
      return e.isCloudflareAccess
        ? 'Cloudflare Access rejected the credentials. Update them in Settings.'
        : 'Auth failed. Update credentials in Settings.';
    case 'network':
      return networkErrorCopy(e.kind);
    case 'server':
      return `Server error (HTTP ${e.statusCode}).`;
    case 'client':
      return `Request rejected (HTTP ${e.statusCode}).`;
    case 'rateLimit':
      return 'Rate-limited. Try again shortly.';
    case 'parse':
      return 'Server returned an unexpected response.';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
    gap: 24,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: { letterSpacing: 1.5 },
  dialWrap: { marginTop: 8 },
  errorTitle: { color: '#ff8a8a', maxWidth: 320, textAlign: 'center' },
  snackbar: {
    position: 'absolute',
    bottom: 88,
    left: 24,
    right: 24,
    padding: 14,
    backgroundColor: '#0f0f12cc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff15',
  },
  detailsLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
