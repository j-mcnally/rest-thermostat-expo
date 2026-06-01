import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { EmberBackground } from '@/components/ember-background';
import type { Schedule, ScheduleEvent } from '@/lib/api/types/schedule';
import { DAY_KEYS } from '@/lib/api/types/schedule';
import { useNleClient } from '@/lib/state/nle-client-hook';
import { useSelectedDevice } from '@/lib/state/selected-device';
import { useDevices } from '@/lib/polling/use-devices';
import { useConfigStore } from '@/lib/state/config-store';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';
import {
  DAY_LABELS,
  minutesToHm,
  todayIndex,
  indexToDay,
} from '@/lib/util/day-index';
import { celsiusToDisplay } from '@/lib/util/dial-math';

export default function ScheduleTab() {
  const client = useNleClient();
  const { data: devices } = useDevices(client);
  const device = useSelectedDevice(devices);
  const displayUnit = useConfigStore((s) => s.displayUnit);
  const [dayIdx, setDayIdx] = useState(todayIndex());

  const scheduleQuery = useQuery<Schedule | null>({
    enabled: !!device && !!client,
    queryKey: ['nle', 'schedule', device?.serial],
    queryFn: async () => {
      if (!client || !device) return null;
      return client.getSchedule(device.serial);
    },
  });

  const day = indexToDay(dayIdx);
  const events: ScheduleEvent[] = scheduleQuery.data?.[day] ?? [];

  return (
    <EmberBackground mode={device?.mode ?? 'neutral'}>
      <SafeAreaView style={styles.container}>
        <Text style={[EmberTypography.headlineLarge(), styles.heading]}>
          Schedule
        </Text>
        {!device && (
          <Text style={EmberTypography.bodyMedium()}>No device selected.</Text>
        )}
        {device && (
          <>
            <View style={styles.dayStrip}>
              {DAY_KEYS.map((d, i) => (
                <Pressable
                  key={d}
                  onPress={() => setDayIdx(i)}
                  style={[styles.dayChip, i === dayIdx && styles.dayChipActive]}
                >
                  <Text
                    style={EmberTypography.labelSmall(
                      i === dayIdx ? Colors.textPrimary : Colors.textTertiary,
                    )}
                  >
                    {DAY_LABELS[d]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {scheduleQuery.isLoading && (
              <ActivityIndicator color={Colors.textTertiary} />
            )}

            {scheduleQuery.error && (
              <Text style={[EmberTypography.bodyMedium(), { color: '#ff8a8a' }]}>
                Couldn't load schedule.
              </Text>
            )}

            {scheduleQuery.data && events.length === 0 && (
              <Text style={EmberTypography.bodyMedium(Colors.textTertiary)}>
                No events on {DAY_LABELS[day]}.
              </Text>
            )}

            <FlatList
              data={events}
              keyExtractor={(e, i) => `${e.time}-${i}`}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => router.push(`/schedule/edit/${day}:${index}`)}
                  style={styles.row}
                >
                  <Text style={[EmberTypography.bodyLarge(), { width: 90 }]}>
                    {minutesToHm(item.time)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={EmberTypography.bodyMedium()}>
                      {Math.round(
                        celsiusToDisplay(item.temperature, displayUnit),
                      )}
                      °{displayUnit}
                    </Text>
                    {item.mode && (
                      <Text
                        style={EmberTypography.bodySmall(Colors.textTertiary)}
                      >
                        mode · {item.mode}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
              ListFooterComponent={
                <Pressable
                  onPress={() => router.push(`/schedule/edit/${day}:new`)}
                  style={[styles.row, styles.rowAdd]}
                >
                  <Text style={EmberTypography.labelSmall()}>+ NEW EVENT</Text>
                </Pressable>
              }
            />
          </>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  heading: {},
  dayStrip: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.textDisabled,
  },
  dayChipActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: '#ffffff10',
  },
  list: { gap: 6, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff08',
    gap: 12,
  },
  rowAdd: {
    backgroundColor: '#ffffff05',
    borderWidth: 1,
    borderColor: '#ffffff15',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
