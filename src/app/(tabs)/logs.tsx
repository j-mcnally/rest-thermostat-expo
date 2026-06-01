import { useSyncExternalStore } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/ember-background';
import { AppLogger, type LogEntry } from '@/lib/state/app-logger';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

export default function LogsTab() {
  const entries = useSyncExternalStore(
    (listener) => AppLogger.subscribe(listener),
    () => AppLogger.list(),
  );

  return (
    <EmberBackground mode="neutral">
      <SafeAreaView style={styles.container}>
        <Text style={[EmberTypography.headlineLarge(), styles.heading]}>
          Logs
        </Text>
        <FlatList<LogEntry>
          data={[...entries].reverse()}
          keyExtractor={(e) => String(e.id)}
          ListEmptyComponent={
            <Text style={EmberTypography.bodyMedium(Colors.textTertiary)}>
              No logs yet.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={[EmberTypography.labelSmall(), colorForLevel(item.level)]}>
                {item.level.toUpperCase()}
              </Text>
              <Text style={EmberTypography.bodySmall()}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={EmberTypography.bodyMedium()}>{item.message}</Text>
              {item.data && (
                <Text
                  style={EmberTypography.bodySmall(Colors.textTertiary)}
                >
                  {JSON.stringify(item.data)}
                </Text>
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </EmberBackground>
  );
}

function colorForLevel(level: LogEntry['level']) {
  switch (level) {
    case 'error':
      return { color: '#ff8a8a' };
    case 'warn':
      return { color: '#ffd58a' };
    case 'info':
      return { color: Colors.textPrimary };
    case 'debug':
      return { color: Colors.textTertiary };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  heading: { marginBottom: 12 },
  list: { gap: 6, paddingBottom: 24 },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff08',
    gap: 4,
  },
});
