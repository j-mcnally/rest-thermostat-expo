import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/ember-background';
import { EmberTypography } from '@/lib/theme';

export default function ScheduleTab() {
  return (
    <EmberBackground mode="neutral">
      <SafeAreaView style={styles.container}>
        <Text style={EmberTypography.headlineLarge()}>Schedule</Text>
        <Text style={EmberTypography.bodyMedium()}>
          Coming next iteration — day strip + event list.
        </Text>
      </SafeAreaView>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
});
