# Rest Thermostat → Expo port — Plan

This is the iteration ledger for porting the upstream Flutter app at
`https://github.com/MikeSiekkinen/RestThermostat`
(branch `feature/cloudflare-access-auth-connection-errors`) to a fresh
Expo / React Native app.

**Tracking is by checkbox.** Each iteration of the ralph loop picks
the next unchecked box, implements it, runs `npx tsc --noEmit`, commits
and pushes, and ticks the box.

## Defaults / decisions baked in

These are the calls made without asking back, with reasoning. Feel
free to revisit:

- **Expo SDK 56**, **RN 0.85**, **expo-router** (the scaffold defaults
  at port time). Pin via `engines` / `.nvmrc` / `.tool-versions`.
- **TypeScript strict.** Discriminated unions everywhere we used Dart
  sealed classes (auth config, errors, network-error kinds).
- **State:** `@tanstack/react-query` for server cache + polling
  cadence; `zustand` for tiny client UI state (selected device,
  optimistic overrides, snackbar). Skipping Redux/Riverpod.
- **HTTP:** stick with `fetch` wrapped in a thin client. No Axios/Dio
  port — react-query handles retries + caching, the upstream's Dio
  interceptor logic (transient retry, 3xx-as-auth, CF-Access
  detection) maps cleanly into a single fetch wrapper.
- **Storage:** `expo-secure-store` for auth credentials,
  `@react-native-async-storage/async-storage` for non-secret config
  (server URL, display unit, picked device).
- **Theming:** custom theme provider on top of RN's `useColorScheme`,
  forced dark for Ember palette match (the upstream is dark-only too).
- **Custom UI:** the temperature dial is hand-rolled with
  `react-native-svg` (72 ticks on a 270° arc), gesture-driven via
  `react-native-gesture-handler` `GestureDetector` + `Pan`/`Tap`, and
  animated with `react-native-reanimated` shared values (tween +
  rounded-tick haptic throttle).
- **Fonts:** Fraunces, Geist, JetBrains Mono, Instrument Serif via
  `expo-font` (Google Fonts mirror at build). Not blocking — falls
  back to system fonts during initial iterations.
- **Localization:** English-only for v0 (matches upstream parity).
  Add `i18n-js` / `expo-localization` once the surface is in.

## Source ↔ target map

| Source (Flutter) | Target (Expo) | Type | Notes |
| --- | --- | --- | --- |
| `lib/main.dart` | `src/app/_layout.tsx` + `src/lib/state/providers.tsx` | boilerplate | Root providers (QueryClient, theme, navigation) |
| `lib/models/auth_config.dart` | `src/lib/auth/config.ts` | boilerplate | Discriminated union `AuthNone` / `AuthBasic` / `AuthBearer` / `AuthCfServiceToken` |
| `lib/models/device.dart` | `src/lib/api/types/device.ts` | boilerplate | Plain TS types + `deviceFromJson` |
| `lib/models/devices_response.dart` | `src/lib/api/types/devices-response.ts` | boilerplate | |
| `lib/models/schedule.dart` | `src/lib/api/types/schedule.ts` | boilerplate | |
| `lib/services/nle_api_client.dart` | `src/lib/api/nle-client.ts` | boilerplate | `fetch` wrapper; merges auth headers; transient retry once for 5xx + network |
| `lib/services/nle_error.dart` | `src/lib/errors/nle-error.ts` | boilerplate | Discriminated `NleError` + `classifyResponse` + `looksLikeCloudflareAccess` |
| `lib/services/nle_api_logging_interceptor.dart` | `src/lib/api/logging-interceptor.ts` | boilerplate | Log every request via `AppLogger` |
| `lib/services/app_logger.dart` | `src/lib/state/app-logger.ts` | boilerplate | Ring buffer in-memory log, exposed to Logs screen |
| `lib/services/onboarding_store.dart` | `src/lib/storage/onboarding-store.ts` | boilerplate | secure-store + async-storage hybrid |
| `lib/services/url_normalizer.dart` | `src/lib/util/normalize-url.ts` | boilerplate | accept bare host, host:port, full URL |
| `lib/services/setpoint_source.dart` | `src/lib/state/setpoint-source.ts` | boilerplate | Optimistic write coordinator |
| `lib/services/state_derivation.dart` | `src/lib/util/derive-state.ts` | boilerplate | "is currently heating", etc. |
| `lib/services/schedule_helpers.dart` | `src/lib/util/schedule-helpers.ts` | boilerplate | |
| `lib/services/device_display_name.dart` | `src/lib/util/device-display-name.ts` | boilerplate | |
| `lib/services/haptics.dart` | `src/lib/util/haptics.ts` | boilerplate | `expo-haptics` + throttled selection click |
| `lib/state/auth_failure_coordinator.dart` | `src/lib/state/auth-failure-coordinator.ts` | boilerplate | zustand store with bus semantics |
| `lib/state/connection_status.dart` | `src/lib/state/connection-status.ts` | boilerplate | derive from react-query state |
| `lib/state/polling_device_state_source.dart` | `src/lib/polling/polling-source.ts` | boilerplate | 20s / +1/+3/+7s cadence via react-query refetchInterval |
| `lib/state/state_cache.dart` | `src/lib/storage/state-cache.ts` | boilerplate | Persist last devices snapshot for cold launch |
| `lib/state/lifecycle_bridge.dart` | `src/lib/state/lifecycle-bridge.ts` | boilerplate | `AppState` (foreground/background) bridge |
| `lib/state/providers.dart` | merged into `src/lib/state/providers.tsx` | boilerplate | Riverpod → react-query + zustand |
| `lib/theme/colors.dart` | `src/lib/theme/colors.ts` | boilerplate | Ember palette as TS constants |
| `lib/theme/typography.dart` | `src/lib/theme/typography.ts` | boilerplate | font helpers |
| `lib/theme/ember_theme.dart` | `src/lib/theme/index.ts` | boilerplate | Theme object + provider |
| `lib/onboarding/welcome_screen.dart` | `src/app/onboarding/welcome.tsx` | boilerplate | |
| `lib/onboarding/server_setup_screen.dart` | `src/app/onboarding/server.tsx` | boilerplate | Server URL + auth picker |
| `lib/onboarding/device_picker_screen.dart` | `src/app/onboarding/device-picker.tsx` | boilerplate | |
| `lib/onboarding/connect_outcome.dart` | `src/lib/onboarding/connect-outcome.ts` | boilerplate | discriminated outcome type |
| `lib/onboarding/onboarding_flow.dart` | `src/app/onboarding/_layout.tsx` | boilerplate | Stack |
| `lib/screens/main_shell.dart` | `src/app/(tabs)/_layout.tsx` | boilerplate | Bottom tabs |
| `lib/screens/home/home_body.dart` | `src/app/(tabs)/index.tsx` + `src/components/home/home-body.tsx` | boilerplate + custom | hosts the dial |
| `lib/screens/details/details_screen.dart` | `src/app/device/[serial].tsx` | boilerplate | |
| `lib/screens/schedule/schedule_screen.dart` | `src/app/(tabs)/schedule.tsx` | custom-ish | Day strip + event list; uses gestures |
| `lib/screens/schedule/edit_event_screen.dart` | `src/app/schedule/edit/[id].tsx` | boilerplate | |
| `lib/screens/schedule/day_index.dart` | `src/lib/util/day-index.ts` | boilerplate | |
| `lib/screens/logs/logs_screen.dart` | `src/app/(tabs)/logs.tsx` | boilerplate | FlatList of ring-buffer entries |
| `lib/settings/settings_screen.dart` | `src/app/(tabs)/settings.tsx` | boilerplate | Big form |
| `lib/widgets/temperature_dial.dart` | `src/components/dial/dial.tsx` | **CUSTOM** | 72-tick SVG, gradient active band, animated cursor |
| `lib/widgets/interactive_temperature_dial.dart` | `src/components/dial/interactive-dial.tsx` | **CUSTOM** | Pan/tap + optimistic + debounced commit + reconciliation |
| `lib/widgets/mode_pills.dart` + `interactive_mode_pills.dart` | `src/components/mode-pills.tsx` | boilerplate | |
| `lib/widgets/fan_widget.dart` + `interactive_fan_widget.dart` | `src/components/fan-widget.tsx` | boilerplate-ish | spinning fan icon driven by Reanimated |
| `lib/widgets/interactive_away_chip.dart` | `src/components/away-chip.tsx` | boilerplate | |
| `lib/widgets/device_indicator_dots.dart` | `src/components/device-indicator-dots.tsx` | boilerplate | |
| `lib/widgets/device_offline_overlay.dart` | `src/components/device-offline-overlay.tsx` | boilerplate | |
| `lib/widgets/device_picker_sheet.dart` | `src/components/device-picker-sheet.tsx` | boilerplate | Bottom-sheet style |
| `lib/widgets/ember_background.dart` | `src/components/ember-background.tsx` | boilerplate | RadialGradient via expo-linear-gradient or react-native-svg |
| `lib/widgets/ember_time_picker.dart` | `src/components/ember-time-picker.tsx` | custom-ish | Wheel time picker |
| `lib/widgets/repeat_days_row.dart` | `src/components/repeat-days-row.tsx` | boilerplate | |
| `lib/widgets/stale_state_pill.dart` | `src/components/stale-state-pill.tsx` | boilerplate | |
| `lib/widgets/status_row.dart` | `src/components/status-row.tsx` | boilerplate | |

## Phase 1 — Plan + segregate

- [x] **i0** Inventory upstream Flutter source.
- [x] **i0** Scaffold Expo app, choose libraries, write PLAN.md.
- [x] **i0** Set up GitHub repo, push initial commit.

## Phase 2 — Implement (ralph-loop iterations)

Boilerplate first; custom UI second. Each ticked box should be one
self-contained commit + push.

### Foundations

- [ ] **i1** Install runtime deps (svg, gesture-handler, reanimated,
      query, zustand, async-storage, secure-store, haptics, netinfo,
      linear-gradient, expo-font).
- [ ] **i2** Ember theme constants (`src/lib/theme/colors.ts`,
      `typography.ts`, `index.ts`) and `<EmberBackground>` radial
      gradient component.
- [ ] **i3** Root layout with QueryClient + StatusBar + dark theme;
      placeholder index screen.

### API + models

- [ ] **i4** Auth config discriminated union + headers builder.
- [ ] **i5** Device / Schedule / DevicesResponse types + parsers.
- [ ] **i6** `NleError` discriminated union + `classifyResponse` +
      CF-Access heuristic. Unit-tested with jest if jest is set up.
- [ ] **i7** `nleClient`: fetch wrapper, header merge, 5xx+net retry
      once, surface `NleError`.
- [ ] **i8** App logger (in-memory ring buffer) + logging
      "interceptor" hook for nleClient.

### Storage + onboarding

- [ ] **i9** `onboardingStore`: server URL (AsyncStorage), auth
      (SecureStore), picked device serial (AsyncStorage).
- [ ] **i10** Onboarding stack: welcome → server setup → device picker
      → main. Persists, routes to (tabs) on completion.
- [ ] **i11** Welcome screen design pass.
- [ ] **i12** Server setup form: URL input, auth picker (None / Basic
      / Bearer / Cloudflare Access), test-connection button.
- [ ] **i13** Device picker screen.

### Main shell + state

- [ ] **i14** `(tabs)/_layout.tsx` bottom tab bar (Home / Schedule /
      Logs / Settings).
- [ ] **i15** Devices query + polling source (20s cadence + +1/+3/+7s
      reconciliation kicker).
- [ ] **i16** Selected-device store (zustand) + `useSelectedDevice`.
- [ ] **i17** Connection status pill (idle / polling / stale / error).
- [ ] **i18** Auth-failure coordinator (route to settings on
      NleAuthError).

### Custom UI — Temperature Dial

- [ ] **i19** `<TemperatureDial>` SVG render with 72 ticks, mode
      gradient, current-tick overlay. Read-only at first.
- [ ] **i20** Hit-mapping helper (`tickIndexForLocalPoint`) ported
      from Dart + unit tests.
- [ ] **i21** GestureDetector (Pan + Tap), throttled selection-click
      haptic, drag-update callback.
- [ ] **i22** Reanimated tween between target indexes (400ms ease-in-
      out-cubic).
- [ ] **i23** `<InteractiveTemperatureDial>` wrapper: optimistic state,
      250ms debounced commit, 7s confirm timeout, snackbar on failure.
- [ ] **i24** Heat-cool dual-bound write path (pick nearest bound).
- [ ] **i25** Accessibility: slider role, increase/decrease, labels.

### Home extras

- [ ] **i26** `<ModePills>` + interactive write.
- [ ] **i27** `<FanWidget>` interactive (spin animation while fan is
      on) + timer.
- [ ] **i28** `<AwayChip>` interactive.
- [ ] **i29** `<DeviceIndicatorDots>`, `<StaleStatePill>`,
      `<StatusRow>`, offline overlay.
- [ ] **i30** Device picker sheet (modal).

### Details + Schedule + Logs + Settings

- [ ] **i31** Details screen (`device/[serial].tsx`): humidity, eco,
      fan timer, capabilities table, raw HVAC state.
- [ ] **i32** Schedule screen day strip + event list.
- [ ] **i33** Edit-event screen (`<EmberTimePicker>` + repeat-day row).
- [ ] **i34** Logs screen (FlatList + share button).
- [ ] **i35** Settings screen (server URL, auth, display unit,
      diagnostics, disconnect).

### Polish

- [ ] **i36** Fonts via expo-font (Fraunces, Geist, Instrument Serif,
      JetBrains Mono).
- [ ] **i37** Splash + icon swap (Ember palette).
- [ ] **i38** `npx tsc --noEmit` clean.
- [ ] **i39** README updates (env vars, screenshot section, run).
- [ ] **i40** Final pass: README screenshots, CHANGELOG.

## What "done" means

- Repo public at github.com/j-mcnally/rest-thermostat-expo.
- `npx tsc --noEmit` clean.
- `npx expo start` launches without runtime errors.
- Thermostat dial is interactive (drag/tap → optimistic override).
- Auth flow includes Cloudflare Access service token.
- Connection-error UX preserved (cause-specific copy via
  `NleNetworkErrorKind`).

## Stretch (not blocking on Phase 2 completion)

- E2E with Detox or Maestro.
- Detailed logs screen with filtering and share.
- iPad / web-output (`react-native-web`) polish.
