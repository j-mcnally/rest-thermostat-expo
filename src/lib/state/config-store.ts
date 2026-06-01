/**
 * Live (in-memory) configuration store. Backed by
 * `onboarding-store` for persistence. Components subscribe via
 * `useConfig`; the rest of the app pulls headers / baseUrl through
 * `useNleClient`.
 */

import { useEffect } from 'react';
import { create } from 'zustand';

import type { AuthConfig } from '@/lib/auth/config';
import {
  clearAll,
  loadConfig,
  saveAuth,
  saveDisplayUnit,
  savePickedSerial,
  saveServerUrl,
} from '@/lib/storage/onboarding-store';

interface ConfigState {
  hydrated: boolean;
  serverUrl: string | null;
  auth: AuthConfig;
  pickedSerial: string | null;
  displayUnit: 'C' | 'F';

  hydrate(): Promise<void>;
  setServerUrl(url: string): Promise<void>;
  setAuth(auth: AuthConfig): Promise<void>;
  setPickedSerial(serial: string): Promise<void>;
  setDisplayUnit(unit: 'C' | 'F'): Promise<void>;
  disconnect(): Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  hydrated: false,
  serverUrl: null,
  auth: { tag: 'none' },
  pickedSerial: null,
  displayUnit: 'F',

  async hydrate() {
    if (get().hydrated) return;
    const persisted = await loadConfig();
    set({
      hydrated: true,
      serverUrl: persisted.serverUrl,
      auth: persisted.auth,
      pickedSerial: persisted.pickedSerial,
      displayUnit: persisted.displayUnit,
    });
  },
  async setServerUrl(url: string) {
    await saveServerUrl(url);
    set({ serverUrl: url });
  },
  async setAuth(auth: AuthConfig) {
    await saveAuth(auth);
    set({ auth });
  },
  async setPickedSerial(serial: string) {
    await savePickedSerial(serial);
    set({ pickedSerial: serial });
  },
  async setDisplayUnit(unit: 'C' | 'F') {
    await saveDisplayUnit(unit);
    set({ displayUnit: unit });
  },
  async disconnect() {
    await clearAll();
    set({
      serverUrl: null,
      auth: { tag: 'none' },
      pickedSerial: null,
    });
  },
}));

/**
 * Hydrate the config on mount. Returns the in-memory state once
 * hydration has finished. Components downstream should gate on
 * `hydrated` so they don't show "no server configured" before the
 * persisted server URL is loaded.
 */
export function useHydratedConfig() {
  const hydrated = useConfigStore((s) => s.hydrated);
  useEffect(() => {
    if (!hydrated) {
      void useConfigStore.getState().hydrate();
    }
  }, [hydrated]);
  return useConfigStore();
}
