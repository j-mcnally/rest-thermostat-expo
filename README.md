# Rest Thermostat (Expo / React Native)

**Your thermostat. Your server. Your control.**

An Expo / React Native port of the community
[Rest Thermostat](https://github.com/MikeSiekkinen/RestThermostat) Flutter
app for [NoLongerEvil](https://docs.nolongerevil.com) firmware on
deprecated Nest Gen 1/2 thermostats. Talks to your self-hosted NLE
server over HTTP — no cloud account, no telemetry, no subscription.

> Port of the upstream Flutter project. Same product, different stack.
> Cloudflare Access service-token auth and detailed connection-error
> reporting are carried over from the upstream
> `feature/cloudflare-access-auth-connection-errors` branch.

## Stack

- **Expo SDK 56** (managed workflow)
- **React Native 0.85** (New Architecture by default)
- **TypeScript** (strict)
- **expo-router** for navigation (file-based, typed routes)
- **react-native-svg + Reanimated 3 + Gesture Handler** for the
  bespoke temperature dial
- **@tanstack/react-query** for polling + cache
- **zustand** for client UI state
- **expo-secure-store** for auth credentials (Keychain on iOS,
  EncryptedSharedPreferences on Android)
- **@react-native-async-storage/async-storage** for non-secret
  config (server URL, display unit)

## Status

Active port. See [`PLAN.md`](./PLAN.md) for the iteration ledger. The
goal is feature parity with the upstream Flutter branch:

- Onboarding (server URL + auth picker including Cloudflare Access)
- Devices list + device picker
- Home screen with interactive temperature dial
- Mode pills, fan widget, away chip
- Details screen
- Schedule view + edit
- Logs viewer
- Settings (server URL, auth, display unit, diagnostics)
- Optimistic writes with reconciliation
- Typed NLE errors with auth/CF-Access classification
- Polling cadence (DESIGN §3.3)

## Get started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run on a simulator**
   ```bash
   npx expo start
   # then press `i` for iOS or `a` for Android
   ```

3. **Type-check + lint**
   ```bash
   npx tsc --noEmit
   npx expo lint
   ```

## Configuration

Configuration is entered through the in-app onboarding flow; there are
no required env vars for ordinary use. On first launch you'll set:

1. **Server URL** — your NLE server (`http://192.168.1.50:8082` or
   `https://nle.example.com`).
2. **Auth** — `None`, HTTP Basic, Bearer token, or Cloudflare Access
   service token (`CF-Access-Client-Id` + `CF-Access-Client-Secret`).
3. **Pick a device** — choose from thermostats paired to the server.

You can re-edit any of these from **Settings**.

### Optional dev seeding via env

For development, you can pre-populate the onboarding by setting these
in a local `.env` (read via `expo-constants` / `process.env` at build
time — not bundled into release builds):

```sh
EXPO_PUBLIC_NLE_BASE_URL=http://nle.example.com
EXPO_PUBLIC_CF_ACCESS_CLIENT_ID=...
EXPO_PUBLIC_CF_ACCESS_CLIENT_SECRET=...
```

## Architecture

```
src/
  app/                        # expo-router pages
    _layout.tsx               # root: providers, theme, status bar
    onboarding/
    (tabs)/                   # main shell after onboarding
      home.tsx
      schedule.tsx
      logs.tsx
      settings.tsx
    device/[serial].tsx       # details screen
  components/
    dial/                     # SVG temperature dial
    mode-pills.tsx
    fan-widget.tsx
    away-chip.tsx
    ...
  lib/
    api/                      # NLE HTTP client + types
    auth/                     # AuthConfig discriminated union
    errors/                   # NleError sealed shape
    storage/                  # secure + non-secret persistence
    theme/                    # Ember colors + typography
    state/                    # zustand stores, react-query setup
    polling/                  # cadence ticker
```

## Mapping to the Flutter source

See [`PLAN.md`](./PLAN.md) for the file-by-file mapping from the
Flutter source to the Expo target.

## License

[MIT](LICENSE). Copyright (c) 2026 Justin McNally and contributors.
Ported from the upstream Rest Thermostat by Mike Siekkinen.
