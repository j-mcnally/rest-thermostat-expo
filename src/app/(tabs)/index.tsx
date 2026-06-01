import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/ember-background';
import { InteractiveTemperatureDial } from '@/components/dial/interactive-dial';
import { isNleError, networkErrorCopy } from '@/lib/errors/nle-error';
import {
  useDevices,
  usePollPauseOnBackground,
} from '@/lib/polling/use-devices';
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

  const [snackbar, setSnackbar] = useState<string | null>(null);

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
            <View style={styles.dialWrap}>
              <InteractiveTemperatureDial
                device={device}
                displayUnit={displayUnit}
                onFailure={(msg) => setSnackbar(msg)}
              />
            </View>
            <Text style={[EmberTypography.labelSmall(), styles.modeLabel]}>
              MODE · {device.mode.toUpperCase()}
            </Text>
          </View>
        )}

        {snackbar && (
          <View style={styles.snackbar}>
            <Text style={EmberTypography.bodyMedium()}>{snackbar}</Text>
          </View>
        )}
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
    paddingHorizontal: 32,
    paddingTop: 24,
    alignItems: 'center',
    gap: 32,
  },
  kicker: { letterSpacing: 1.5, marginTop: 8 },
  dialWrap: { marginTop: 24 },
  modeLabel: { position: 'absolute', bottom: 96 },
  errorTitle: { color: '#ff8a8a', maxWidth: 320, textAlign: 'center' },
  snackbar: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    padding: 14,
    backgroundColor: '#0f0f12cc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff15',
  },
});
