/**
 * Persisted onboarding state. Ported from
 * `lib/services/onboarding_store.dart` upstream.
 *
 * Secrets (auth credentials) → expo-secure-store (Keychain on iOS,
 * EncryptedSharedPreferences on Android).
 * Non-secrets (server URL, picked device serial, display unit) →
 * AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import type { AuthConfig } from '@/lib/auth/config';

const KEY_SERVER_URL = 'nle:serverUrl';
const KEY_PICKED_SERIAL = 'nle:pickedSerial';
const KEY_DISPLAY_UNIT = 'nle:displayUnit'; // 'C' | 'F'
const SECURE_KEY_AUTH = 'nle.auth';

export interface PersistedConfig {
  serverUrl: string | null;
  auth: AuthConfig;
  pickedSerial: string | null;
  displayUnit: 'C' | 'F';
}

export async function loadConfig(): Promise<PersistedConfig> {
  const [serverUrl, pickedSerial, displayUnit, authJson] = await Promise.all([
    AsyncStorage.getItem(KEY_SERVER_URL),
    AsyncStorage.getItem(KEY_PICKED_SERIAL),
    AsyncStorage.getItem(KEY_DISPLAY_UNIT),
    SecureStore.getItemAsync(SECURE_KEY_AUTH).catch(() => null),
  ]);
  return {
    serverUrl,
    pickedSerial,
    displayUnit: displayUnit === 'C' ? 'C' : 'F',
    auth: authJson ? deserializeAuth(authJson) : { tag: 'none' },
  };
}

export async function saveServerUrl(serverUrl: string): Promise<void> {
  await AsyncStorage.setItem(KEY_SERVER_URL, serverUrl);
}

export async function saveAuth(auth: AuthConfig): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEY_AUTH, serializeAuth(auth));
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_KEY_AUTH).catch(() => undefined);
}

export async function savePickedSerial(serial: string): Promise<void> {
  await AsyncStorage.setItem(KEY_PICKED_SERIAL, serial);
}

export async function saveDisplayUnit(unit: 'C' | 'F'): Promise<void> {
  await AsyncStorage.setItem(KEY_DISPLAY_UNIT, unit);
}

export async function clearAll(): Promise<void> {
  await Promise.all([
    AsyncStorage.multiRemove([KEY_SERVER_URL, KEY_PICKED_SERIAL]),
    SecureStore.deleteItemAsync(SECURE_KEY_AUTH).catch(() => undefined),
  ]);
}

// ---------------------------------------------------------------------------
// Wire format helpers
// ---------------------------------------------------------------------------

function serializeAuth(auth: AuthConfig): string {
  return JSON.stringify(auth);
}

function deserializeAuth(raw: string): AuthConfig {
  try {
    const parsed = JSON.parse(raw) as Partial<AuthConfig> & { tag?: string };
    switch (parsed.tag) {
      case 'none':
        return { tag: 'none' };
      case 'basic':
        return {
          tag: 'basic',
          username: String(
            (parsed as { username?: string }).username ?? '',
          ),
          password: String(
            (parsed as { password?: string }).password ?? '',
          ),
        };
      case 'bearer':
        return {
          tag: 'bearer',
          token: String((parsed as { token?: string }).token ?? ''),
        };
      case 'cf_service_token':
        return {
          tag: 'cf_service_token',
          clientId: String(
            (parsed as { clientId?: string }).clientId ?? '',
          ),
          clientSecret: String(
            (parsed as { clientSecret?: string }).clientSecret ?? '',
          ),
        };
      default:
        return { tag: 'none' };
    }
  } catch {
    return { tag: 'none' };
  }
}
