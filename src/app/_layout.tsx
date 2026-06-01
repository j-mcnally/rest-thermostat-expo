import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Fraunces_300Light,
  Fraunces_400Regular,
  useFonts as useFraunces,
} from '@expo-google-fonts/fraunces';
import { Geist_400Regular } from '@expo-google-fonts/geist';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';

import { AuthFailureWatcher } from '@/lib/state/auth-failure-watcher';
import { RootProviders } from '@/lib/state/providers';

// Keep the splash visible until the fonts finish loading so the first
// frame of the app never renders in the system fallback typeface.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: best-effort, e.g. when called twice in fast refresh */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFraunces({
    Fraunces_300Light,
    Fraunces_400Regular,
    Geist_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* no-op */
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    // Splash is still showing; render nothing so we don't flash the
    // fallback fonts under it on slow loads.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaProvider>
        <RootProviders>
          <StatusBar style="light" />
          <AuthFailureWatcher />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000' },
            }}
          />
        </RootProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
