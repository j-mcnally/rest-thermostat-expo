import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/ember-background';
import { createNleClient } from '@/lib/api/nle-client';
import type { Device } from '@/lib/api/types/device';
import { headersFor } from '@/lib/auth/config';
import { isNleError, networkErrorCopy } from '@/lib/errors/nle-error';
import { useConfigStore } from '@/lib/state/config-store';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

export default function DevicePickerScreen() {
  const serverUrl = useConfigStore((s) => s.serverUrl);
  const auth = useConfigStore((s) => s.auth);
  const setPickedSerial = useConfigStore((s) => s.setPickedSerial);

  const [devices, setDevices] = useState<Device[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);

  const headers = useMemo(() => headersFor(auth), [auth]);

  useEffect(() => {
    if (!serverUrl) return;
    let cancelled = false;
    (async () => {
      const client = createNleClient({ baseUrl: serverUrl, authHeaders: headers });
      try {
        const resp = await client.getDevices();
        if (!cancelled) setDevices(resp.devices);
      } catch (e) {
        if (cancelled) return;
        setError(formatError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverUrl, headers]);

  async function handlePick(serial: string) {
    setPicking(serial);
    await setPickedSerial(serial);
    router.replace('/');
  }

  if (!serverUrl) {
    return (
      <EmberBackground mode="neutral">
        <SafeAreaView style={styles.container}>
          <Text style={[EmberTypography.bodyLarge(), styles.fallback]}>
            Server URL missing — go back to the server step.
          </Text>
        </SafeAreaView>
      </EmberBackground>
    );
  }

  return (
    <EmberBackground mode="neutral">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={[EmberTypography.labelSmall(), styles.kicker]}>
            STEP 2 OF 2
          </Text>
          <Text style={[EmberTypography.headlineLarge(), styles.heading]}>
            Pick a device
          </Text>
          <Text style={EmberTypography.bodySmall()}>
            {devices == null
              ? 'Looking for paired thermostats…'
              : `${devices.length} device${devices.length === 1 ? '' : 's'} found.`}
          </Text>
        </View>

        {error && (
          <Text style={[styles.error, EmberTypography.bodyMedium()]}>
            {error}
          </Text>
        )}

        {devices == null && !error ? (
          <ActivityIndicator
            color={Colors.textSecondary}
            style={{ marginTop: 32 }}
          />
        ) : (
          <FlatList
            data={devices ?? []}
            keyExtractor={(d) => d.serial}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handlePick(item.serial)}
                disabled={picking !== null}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={EmberTypography.bodyLarge()}>
                    {item.name || item.serial}
                  </Text>
                  <Text
                    style={EmberTypography.bodySmall(Colors.textTertiary)}
                  >
                    {item.serial}
                    {item.isOnline ? '' : ' • offline'}
                  </Text>
                </View>
                {picking === item.serial && (
                  <ActivityIndicator color={Colors.textPrimary} />
                )}
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

function formatError(e: unknown): string {
  if (!isNleError(e))
    return e instanceof Error ? e.message : 'Unexpected error.';
  switch (e.type) {
    case 'auth':
      return e.isCloudflareAccess
        ? 'Cloudflare Access rejected the credentials.'
        : `Auth failed (HTTP ${e.statusCode}).`;
    case 'network':
      return networkErrorCopy(e.kind);
    case 'server':
      return `Server error (HTTP ${e.statusCode}).`;
    case 'client':
      return `Request rejected (HTTP ${e.statusCode}).`;
    case 'rateLimit':
      return 'Rate-limited by the server.';
    case 'parse':
      return 'Server replied with an unexpected response.';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 32, paddingTop: 16 },
  header: { gap: 8, marginBottom: 16 },
  kicker: { color: Colors.textTertiary, textTransform: 'uppercase' },
  heading: {},
  list: { gap: 8, paddingBottom: 32 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff08',
    flexDirection: 'row',
    alignItems: 'center',
  },
  error: { color: '#ff8a8a' },
  fallback: { padding: 32 },
});
