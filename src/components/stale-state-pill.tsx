/**
 * Pill that shows when the last successful poll is older than the
 * threshold. Wired off `dataUpdatedAt` from react-query.
 */

import { StyleSheet, Text, View } from 'react-native';

import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

interface StalePillProps {
  ageMs: number;
  thresholdMs?: number;
}

export function StaleStatePill({ ageMs, thresholdMs = 45_000 }: StalePillProps) {
  if (ageMs < thresholdMs) return null;
  const secs = Math.round(ageMs / 1000);
  return (
    <View style={styles.pill}>
      <Text style={EmberTypography.labelSmall(Colors.textPrimary)}>
        STALE · {secs}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ffffff10',
    alignSelf: 'flex-start',
  },
});
