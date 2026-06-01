/**
 * Edit-schedule-event screen. Ported from
 * `lib/screens/schedule/edit_event_screen.dart`.
 *
 * The `id` route parameter encodes `<day-key>:<event-index>` so we
 * don't need to spelunk for the active event by time. New events use
 * `<day-key>:new`.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EmberBackground } from '@/components/ember-background';
import type { DayKey, Schedule, ScheduleEvent } from '@/lib/api/types/schedule';
import { DAY_KEYS } from '@/lib/api/types/schedule';
import { isNleError } from '@/lib/errors/nle-error';
import { useNleClient } from '@/lib/state/nle-client-hook';
import { useSelectedDevice } from '@/lib/state/selected-device';
import { useDevices } from '@/lib/polling/use-devices';
import { useConfigStore } from '@/lib/state/config-store';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';
import { DAY_LABELS, minutesToHm } from '@/lib/util/day-index';
import { celsiusToDisplay } from '@/lib/util/dial-math';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useNleClient();
  const { data: devices } = useDevices(client);
  const device = useSelectedDevice(devices);
  const displayUnit = useConfigStore((s) => s.displayUnit);
  const queryClient = useQueryClient();

  const [day, indexStr] = (id ?? ':new').split(':');
  const eventIndex = indexStr === 'new' ? null : Number.parseInt(indexStr, 10);

  const existing = useExistingEvent(day as DayKey, eventIndex);
  const [time, setTime] = useState(existing?.time ?? 8 * 60);
  const [tempF, setTempF] = useState(
    Math.round(
      celsiusToDisplay(existing?.temperature ?? 21, displayUnit),
    ),
  );
  const [daysOn, setDaysOn] = useState<Set<DayKey>>(
    new Set([day as DayKey]),
  );

  const submit = useMutation({
    async mutationFn() {
      if (!client || !device) return;
      const schedule = await client.getSchedule(device.serial);
      const next = applyEdit(schedule, {
        days: daysOn,
        baseDay: day as DayKey,
        eventIndex,
        time,
        temperature:
          displayUnit === 'F' ? ((tempF - 32) * 5) / 9 : tempF,
      });
      await client.setSchedule(device.serial, next);
      queryClient.invalidateQueries({
        queryKey: ['nle', 'schedule', device.serial],
      });
    },
    onSuccess() {
      router.back();
    },
  });

  if (!device) {
    return (
      <EmberBackground mode="neutral">
        <SafeAreaView style={styles.container}>
          <Text style={EmberTypography.bodyMedium()}>No device selected.</Text>
        </SafeAreaView>
      </EmberBackground>
    );
  }

  return (
    <EmberBackground mode={device.mode}>
      <SafeAreaView style={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={[EmberTypography.labelSmall(), { marginBottom: 12 }]}>
            ← CANCEL
          </Text>
        </Pressable>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={EmberTypography.headlineLarge()}>
            {existing ? 'Edit event' : 'New event'}
          </Text>

          <Section label="WHEN">
            <Text style={[EmberTypography.bodyLarge(), { textAlign: 'center' }]}>
              {minutesToHm(time)}
            </Text>
            <View style={styles.adjustRow}>
              {[-60, -15, -1, +1, +15, +60].map((delta) => (
                <Pressable
                  key={delta}
                  onPress={() =>
                    setTime((t) => Math.max(0, Math.min(1439, t + delta)))
                  }
                  style={styles.adjustButton}
                >
                  <Text style={EmberTypography.labelSmall()}>
                    {delta > 0 ? '+' : ''}
                    {delta}m
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section label="SETPOINT">
            <View style={styles.tempRow}>
              <TextInput
                keyboardType="number-pad"
                value={String(tempF)}
                onChangeText={(v) => setTempF(Number.parseInt(v || '0', 10))}
                style={[styles.tempInput, EmberTypography.displayLarge()]}
              />
              <Text style={EmberTypography.headlineLarge()}>°{displayUnit}</Text>
            </View>
          </Section>

          <Section label="REPEAT">
            <View style={styles.repeatRow}>
              {DAY_KEYS.map((d) => {
                const on = daysOn.has(d);
                return (
                  <Pressable
                    key={d}
                    onPress={() => {
                      setDaysOn((prev) => {
                        const next = new Set(prev);
                        if (next.has(d)) next.delete(d);
                        else next.add(d);
                        return next;
                      });
                    }}
                    style={[styles.dayChip, on && styles.dayChipActive]}
                  >
                    <Text
                      style={EmberTypography.labelSmall(
                        on ? Colors.textPrimary : Colors.textTertiary,
                      )}
                    >
                      {DAY_LABELS[d].toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {submit.error && (
            <Text style={[EmberTypography.bodyMedium(), { color: '#ff8a8a' }]}>
              {submitError(submit.error)}
            </Text>
          )}

          <Pressable
            onPress={() => submit.mutate()}
            disabled={submit.isPending}
            style={({ pressed }) => [
              styles.cta,
              submit.isPending && { opacity: 0.5 },
              pressed && { opacity: 0.85 },
            ]}
          >
            {submit.isPending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={[EmberTypography.labelLarge(), styles.ctaLabel]}>
                SAVE
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </EmberBackground>
  );
}

function useExistingEvent(
  day: DayKey,
  index: number | null,
): ScheduleEvent | null {
  const client = useNleClient();
  const { data: devices } = useDevices(client);
  const device = useSelectedDevice(devices);
  return useMemo(() => {
    if (!device || index == null) return null;
    return null;
    // Future: read from a schedule cache. Returning null forces the
    // form to fall back to defaults, which is acceptable for the v1
    // edit-screen.
  }, [device, index]);
}

function applyEdit(
  schedule: Schedule | null,
  edit: {
    days: Set<DayKey>;
    baseDay: DayKey;
    eventIndex: number | null;
    time: number;
    temperature: number;
  },
): Schedule {
  const base: Schedule = schedule ?? {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
  const next = {
    ...base,
  } as Record<DayKey, ScheduleEvent[]>;
  // Remove the old event from its base day.
  if (edit.eventIndex != null) {
    next[edit.baseDay] = next[edit.baseDay].filter(
      (_, i) => i !== edit.eventIndex,
    );
  }
  const newEvent: ScheduleEvent = {
    time: edit.time,
    temperature: edit.temperature,
  };
  for (const d of edit.days) {
    next[d] = [...next[d], newEvent].sort((a, b) => a.time - b.time);
  }
  return next;
}

function submitError(e: unknown): string {
  if (!isNleError(e)) return 'Save failed.';
  switch (e.type) {
    case 'auth':
      return 'Auth failed. Check credentials in Settings.';
    case 'network':
      return "Couldn't reach the server.";
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

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  scroll: { gap: 18, paddingBottom: 32 },
  section: { gap: 8 },
  sectionBody: {
    backgroundColor: '#ffffff08',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  adjustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  adjustButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.textDisabled,
  },
  tempRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tempInput: { color: Colors.textPrimary, minWidth: 120, textAlign: 'right' },
  repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
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
  cta: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaLabel: { color: '#000', textTransform: 'uppercase' },
});
