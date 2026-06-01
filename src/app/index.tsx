import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Rest Thermostat</Text>
        <Text style={styles.subtitle}>
          Your thermostat. Your server. Your control.
        </Text>
        <Text style={styles.hint}>Port in progress — see PLAN.md</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050108',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    letterSpacing: -1,
  },
  subtitle: {
    color: '#ffffff99',
    fontSize: 14,
    textAlign: 'center',
  },
  hint: {
    color: '#ffffff66',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 16,
  },
});
