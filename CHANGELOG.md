# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Expo SDK 56 + React Native 0.85 scaffold under TypeScript strict.
- `expo-router` file-based navigation with onboarding stack +
  (tabs) main shell + per-device details route.
- NLE API client (`src/lib/api/nle-client.ts`) — `fetch` wrapper that
  merges auth headers, disables redirect following, retries once on
  transient (network / 5xx) failures, and surfaces typed `NleError`
  instances.
- Discriminated `NleError` union with `network` / `auth` / `rateLimit`
  / `server` / `client` / `parse` shapes. Heuristic detection of
  Cloudflare Access challenges via `WWW-Authenticate` + 3xx redirect
  to `cloudflareaccess.com`. Cause-specific copy for network failures
  (DNS, connection-refused, TLS, timeout).
- Auth picker covering `None`, HTTP Basic, Bearer token, and
  **Cloudflare Access service token** (`CF-Access-Client-Id` +
  `CF-Access-Client-Secret`). Credentials stored in
  `expo-secure-store`.
- 72-tick segmented temperature dial implemented with
  `react-native-svg` + `react-native-reanimated` + gesture-handler
  Pan/Tap. Throttled selection-click haptic, mode-tinted gradient
  active band, brighter current-temperature overlay tick.
- Interactive dial wrapper with optimistic state, 250ms debounced
  commit, +1/+3/+7s reconciliation kick, 7s confirm timeout, and
  heat-cool dual-bound payload (pick the closer bound).
- Mode pills, fan widget (Reanimated 360° spin), away chip, device
  indicator dots, offline overlay, stale-state pill, connection-
  status pill, device picker modal sheet.
- Day-strip + event-list schedule view + edit-event form (time
  nudge buttons, °F setpoint, repeat-day toggles).
- Logs tab subscribed to an in-memory ring buffer.
- Settings tab with connection summary, display-unit toggle, device
  picker shortcut, and disconnect.
- `src/config/env.ts` for `EXPO_PUBLIC_*` validation + dev seeding.
- `src/branding.ts` for app name / tagline / URLs.
- `CLAUDE.md` durable project rules (no-secrets, abstraction
  boundaries, README contract).
- `CONTRIBUTING.md` pre-flight checklist.
