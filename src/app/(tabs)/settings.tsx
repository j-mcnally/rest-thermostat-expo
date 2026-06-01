import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/ember-background';
import { authPresence, headersFor } from '@/lib/auth/config';
import { useConfigStore } from '@/lib/state/config-store';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

export default function SettingsTab() {
  const serverUrl = useConfigStore((s) => s.serverUrl);
  const auth = useConfigStore((s) => s.auth);
  const displayUnit = useConfigStore((s) => s.displayUnit);
  const setDisplayUnit = useConfigStore((s) => s.setDisplayUnit);
  const disconnect = useConfigStore((s) => s.disconnect);

  return (
    <EmberBackground mode="neutral">
      <SafeAreaView style={styles.container}>
        <Text style={[EmberTypography.headlineLarge(), styles.heading]}>
          Settings
        </Text>

        <Section label="CONNECTION">
          <Row title="Server" value={serverUrl ?? '—'} />
          <Row title="Auth" value={authPresence(headersFor(auth))} />
        </Section>

        <Section label="DISPLAY">
          <View style={styles.unitRow}>
            {(['F', 'C'] as const).map((u) => (
              <Pressable
                key={u}
                onPress={() => void setDisplayUnit(u)}
                style={[
                  styles.unitChip,
                  displayUnit === u && styles.unitChipActive,
                ]}
              >
                <Text
                  style={EmberTypography.labelSmall(
                    displayUnit === u
                      ? Colors.textPrimary
                      : Colors.textTertiary,
                  )}
                >
                  °{u}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section label="DEVICE">
          <Pressable
            onPress={() => router.push('/onboarding/device-picker')}
          >
            <Text style={EmberTypography.bodyMedium()}>Pick a device →</Text>
          </Pressable>
        </Section>

        <Section label="DANGER">
          <Pressable
            onPress={async () => {
              await disconnect();
              router.replace('/onboarding/welcome');
            }}
          >
            <Text style={[EmberTypography.bodyMedium(), { color: '#ff8a8a' }]}>
              Disconnect & forget credentials
            </Text>
          </Pressable>
        </Section>
      </SafeAreaView>
    </EmberBackground>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={EmberTypography.labelSmall(Colors.textTertiary)}>
        {label}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={EmberTypography.bodyMedium(Colors.textSecondary)}>
        {title}
      </Text>
      <Text style={EmberTypography.bodyMedium()}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, gap: 16 },
  heading: { marginBottom: 8 },
  section: { gap: 8 },
  sectionBody: {
    backgroundColor: '#ffffff08',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.textDisabled,
  },
  unitChipActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: '#ffffff10',
  },
});
