/**
 * Lightweight auth-failure bus. Ported from
 * `lib/state/auth_failure_coordinator.dart` upstream. Any write that
 * surfaces an `NleAuthError` fires this; the root layout subscribes
 * and routes to `/settings?auth=expand=true` (deep-link parameter).
 *
 * Modeled as a zustand store with an incrementing `tick` so consumers
 * can subscribe to the field instead of a callback registry.
 */

import { create } from 'zustand';

interface AuthFailureState {
  tick: number;
  isCloudflareAccess: boolean;
  fire(opts?: { isCloudflareAccess?: boolean }): void;
  acknowledge(): void;
}

export const useAuthFailureCoordinator = create<AuthFailureState>((set) => ({
  tick: 0,
  isCloudflareAccess: false,
  fire(opts) {
    set((s) => ({
      tick: s.tick + 1,
      isCloudflareAccess: opts?.isCloudflareAccess ?? false,
    }));
  },
  acknowledge() {
    set({ isCloudflareAccess: false });
  },
}));
