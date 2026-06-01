import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text } from 'react-native';

import * as Colors from '@/lib/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#ffffff10',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          fontWeight: Platform.OS === 'ios' ? '600' : '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>◯</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>▦</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>≡</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>⚙</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 18, lineHeight: 20 },
});
