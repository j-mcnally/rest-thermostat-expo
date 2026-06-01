import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/ember-background';
import { isNleError, networkErrorCopy } from '@/lib/errors/nle-error';
import { useDevices, usePollPauseOnBackground } from '@/lib/polling/use-devices';
import { useNleClient } from '@/lib/state/nle-client-hook';
import { useSelectedDevice } from '@/lib/state/selected-device';
import { useConfigStore } from '@/lib/state/config-store';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

export default function HomeTab() {
  usePollPauseOnBackground();
  const client = useNleClient();
  const { data: devices, error, isLoading } = useDevices(client);
  const device = useSelectedDevice(devices);
  const displayUnit = useConfigStore((s) => s.displayUnit);

  const mode = device?.mode ?? 'neutral';

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
            <Text style={[EmberTypography.labelSmall(), styles.kicker]}>
              {(device.name ?? device.serial).toUpperCase()}
            </Text>
            <View style={styles.dialPlaceholder}>
              <Text style={EmberTypography.displayLarge()}>
                {Math.round(toDisplay(device.targetTemperature, displayUnit))}
                °
              </Text>
              <Text style={EmberTypography.bodyMediumItalic()}>
                Currently{' '}
                {Math.round(toDisplay(device.currentTemperature, displayUnit))}
                °
              </Text>
            </View>
            <Text style={[EmberTypography.labelSmall(), styles.modeLabel]}>
              MODE · {device.mode.toUpperCase()}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

function toDisplay(celsius: number, unit: 'C' | 'F'): number {
  if (unit === 'F') return (celsius * 9) / 5 + 32;
  return celsius;
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
  body: { flex: 1, paddingHorizontal: 32, paddingTop: 24, alignItems: 'center' },
  kicker: { letterSpacing: 1.5, marginTop: 8 },
  dialPlaceholder: {
    marginTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeLabel: { position: 'absolute', bottom: 24 },
  errorTitle: { color: '#ff8a8a', maxWidth: 320, textAlign: 'center' },
});
