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

This repository is **public and community-driven**. Issues and pull
requests welcome — see [`CONTRIBUTING.md`](./CONTRIBUTING.md) and
[`CLAUDE.md`](./CLAUDE.md).

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

## Quickstart

```bash
git clone https://github.com/j-mcnally/rest-thermostat-expo.git
cd rest-thermostat-expo
npm install

# Optional: pre-seed the onboarding screens with dev values.
# The app works fine without this — server URL and auth are
# normally entered through the in-app onboarding flow.
cp .env.example .env
# …then edit .env to taste

npx expo start
# press `i` for the iOS simulator, `a` for Android,
# or scan the QR code with Expo Go on a physical device.
```

Type-check + lint:

```bash
npx tsc --noEmit
npm run lint
```

## Pointing the app at your own NLE server

There is no central server — every install talks to *your* NoLongerEvil
backend. On first launch the app walks you through three steps:

1. **Server URL.** Enter your NLE server's address. Bare host
   (`192.168.1.50:8082`), `http://host:port`, and `https://host`
   are all accepted.
2. **Auth.** Pick `None`, HTTP Basic, Bearer token, or **Cloudflare
   Access service token**. Credentials are stored on-device via
   `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences
   on Android) and are never logged.
3. **Pick a device.** Choose a thermostat from the ones paired to
   your server.

You can change any of these later from **Settings**.

### Cloudflare Access service tokens

If your NLE server sits behind Cloudflare Access (the recommended
way to expose a home-LAN service to the internet), create a service
token in your Cloudflare Zero Trust dashboard and paste the
`CF-Access-Client-Id` and `CF-Access-Client-Secret` values into the
auth picker.

Full Cloudflare docs:
<https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/>.

## Environment variables (optional dev seeding)

The app needs **no** environment variables to run. For developer
convenience, a handful of `EXPO_PUBLIC_*` variables can pre-fill the
onboarding screens when you're iterating against a known backend.
See [`.env.example`](./.env.example) for the full list with
documentation. Read-once-and-validate happens in
[`src/config/env.ts`](./src/config/env.ts) — never read
`process.env` directly elsewhere (see [`CLAUDE.md`](./CLAUDE.md) §4).

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
  branding.ts                 # app name, support email, URLs
  config/
    env.ts                    # the ONLY reader of process.env
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

## Contributing

Bug reports, fixes, and real-device feedback are welcome. Please
read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a PR —
the project follows a strict no-secrets-in-tree policy
([`CLAUDE.md`](./CLAUDE.md) §2) and has a pre-flight checklist that
should pass before pushing.

To file an issue, open a ticket on
<https://github.com/j-mcnally/rest-thermostat-expo/issues> and include
your platform, Expo SDK version, NLE firmware version, and any
relevant log excerpts from the in-app **Logs** screen.

## License

[MIT](LICENSE). Copyright (c) 2026 Justin McNally and contributors.
Portions adapted from the upstream
[Rest Thermostat](https://github.com/MikeSiekkinen/RestThermostat)
project by Mike Siekkinen, also MIT-licensed.
