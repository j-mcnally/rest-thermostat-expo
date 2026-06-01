import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/ember-background';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

export default function WelcomeScreen() {
  return (
    <EmberBackground mode="heat">
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={[EmberTypography.labelSmall(Colors.textTertiary), styles.kicker]}>
            REST THERMOSTAT
          </Text>
          <Text style={[EmberTypography.displayLarge(), styles.title]}>
            Your{'\n'}control.
          </Text>
          <Text style={[EmberTypography.bodyMediumItalic(), styles.subtitle]}>
            A native client for your NoLongerEvil server.
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push('/onboarding/server')}
            style={({ pressed }) => [
              styles.cta,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[EmberTypography.labelLarge(), styles.ctaLabel]}>
              GET STARTED
            </Text>
          </Pressable>
          <Text style={[EmberTypography.bodySmall(Colors.textTertiary), styles.fineprint]}>
            No cloud. No telemetry. No subscription.
          </Text>
        </View>
      </SafeAreaView>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
  },
  kicker: { textTransform: 'uppercase' },
  title: { textAlign: 'left' },
  subtitle: { maxWidth: 320 },
  actions: { gap: 18, paddingBottom: 24 },
  cta: {
    backgroundColor: Colors.heatGlow,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaLabel: { textTransform: 'uppercase' },
  fineprint: { textAlign: 'center' },
});
