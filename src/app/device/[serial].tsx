/**
 * Per-device details screen. Ported from
 * `lib/screens/details/details_screen.dart`.
 *
 * Shows humidity, eco temps, fan timer remaining, capabilities, the
 * raw HVAC state (heater / X2 / X3 / AC / aux / etc.), software
 * version, time-to-target, and the schedule mode.
 */

import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/ember-background';
import { useDevices } from '@/lib/polling/use-devices';
import { useNleClient } from '@/lib/state/nle-client-hook';
import { useConfigStore } from '@/lib/state/config-store';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';
import { celsiusToDisplay } from '@/lib/util/dial-math';

export default function DeviceDetailsScreen() {
  const { serial } = useLocalSearchParams<{ serial: string }>();
  const client = useNleClient();
  const { data: devices } = useDevices(client);
  const displayUnit = useConfigStore((s) => s.displayUnit);

  const device = devices?.find((d) => d.serial === serial);

  if (!device) {
    return (
      <EmberBackground mode="neutral">
        <SafeAreaView style={styles.container}>
          <Text style={EmberTypography.bodyMedium()}>Device not found.</Text>
        </SafeAreaView>
      </EmberBackground>
    );
  }

  return (
    <EmberBackground mode={device.mode}>
      <SafeAreaView style={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={[EmberTypography.labelSmall(), { marginBottom: 12 }]}>
            ← BACK
          </Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={EmberTypography.headlineLarge()}>
            {device.name || device.serial}
          </Text>
          <Text style={EmberTypography.bodySmall(Colors.textTertiary)}>
            {device.serial}
            {device.isOnline ? '' : ' • offline'}
          </Text>

          <Section label="ENVIRONMENT">
            <Row
              title="Temperature"
              value={`${round1(celsiusToDisplay(device.currentTemperature, displayUnit))}°${displayUnit}`}
            />
            <Row title="Humidity" value={`${device.humidity}%`} />
            <Row
              title="Setpoint"
              value={`${round1(celsiusToDisplay(device.targetTemperature, displayUnit))}°${displayUnit}`}
            />
            {device.targetTemperatureLow != null && (
              <Row
                title="Range low"
                value={`${round1(celsiusToDisplay(device.targetTemperatureLow, displayUnit))}°${displayUnit}`}
              />
            )}
            {device.targetTemperatureHigh != null && (
              <Row
                title="Range high"
                value={`${round1(celsiusToDisplay(device.targetTemperatureHigh, displayUnit))}°${displayUnit}`}
              />
            )}
            {device.ecoTemperatures && (
              <>
                <Row
                  title="Eco low"
                  value={`${round1(celsiusToDisplay(device.ecoTemperatures.low, displayUnit))}°${displayUnit}`}
                />
                <Row
                  title="Eco high"
                  value={`${round1(celsiusToDisplay(device.ecoTemperatures.high, displayUnit))}°${displayUnit}`}
                />
              </>
            )}
          </Section>

          <Section label="HVAC">
            <Row title="Mode" value={device.mode} />
            <Row
              title="Heater"
              value={onOff(device.hvac.heater)}
            />
            <Row title="A/C" value={onOff(device.hvac.ac)} />
            <Row title="Fan" value={onOff(device.hvac.fan)} />
            <Row
              title="Fan timer"
              value={
                device.fanTimerActive
                  ? `${Math.round(device.fanTimerTimeout / 60)} min remaining`
                  : 'idle'
              }
            />
            <Row title="Aux heat" value={onOff(device.hvac.auxHeat)} />
            <Row title="Emer heat" value={onOff(device.hvac.emerHeat)} />
            <Row title="Humidifier" value={onOff(device.hvac.humidifier)} />
            <Row title="Dehumidifier" value={onOff(device.hvac.dehumidifier)} />
          </Section>

          <Section label="CAPABILITIES">
            <Row title="Can heat" value={onOff(device.capabilities.canHeat)} />
            <Row title="Can cool" value={onOff(device.capabilities.canCool)} />
            <Row title="Has fan" value={onOff(device.capabilities.hasFan)} />
            <Row
              title="Has emer heat"
              value={onOff(device.capabilities.hasEmerHeat)}
            />
            <Row
              title="Has humidifier"
              value={onOff(device.capabilities.hasHumidifier)}
            />
            <Row
              title="Has dehumidifier"
              value={onOff(device.capabilities.hasDehumidifier)}
            />
          </Section>

          <Section label="META">
            <Row title="Software" value={device.softwareVersion} />
            <Row title="Scale" value={device.temperatureScale} />
            <Row title="Schedule" value={device.scheduleMode ?? '—'} />
            <Row title="Eco mode" value={device.ecoMode ?? '—'} />
            <Row title="Time to target" value={`${device.timeToTarget}s`} />
            <Row
              title="Last seen"
              value={new Date(device.lastSeen).toLocaleString()}
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </EmberBackground>
  );
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function onOff(b: boolean): string {
  return b ? 'on' : 'off';
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
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  scroll: { gap: 16, paddingBottom: 32 },
  section: { gap: 8 },
  sectionBody: {
    backgroundColor: '#ffffff08',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
