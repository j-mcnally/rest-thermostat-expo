import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useHydratedConfig } from '@/lib/state/config-store';

export default function Index() {
  const config = useHydratedConfig();

  if (!config.hydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!config.serverUrl) {
    return <Redirect href="/onboarding/welcome" />;
  }

  if (!config.pickedSerial) {
    return <Redirect href="/onboarding/device-picker" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
});
