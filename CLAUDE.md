# CLAUDE.md — durable project rules

This file is the persistent brain for Claude / Codex / any future AI
agent working in this repository, **and** the contract every human
contributor signs by opening a PR. Read it before you touch the tree.

> **This repo is public and community-facing.**
> Anyone on the internet can read this code, open issues, and submit
> PRs. Treat every line that lands here accordingly.

---

## 1. Public community project

- Write code, comments, commit messages, and PR descriptions for an
  audience of **strangers on the internet**, not for an internal team.
- No internal jargon. No references to private infrastructure,
  personal assistants, agent harnesses, Slack/Discord channel IDs,
  Jira ticket keys, or codenames. If a commit message would only make
  sense to people inside one company, rewrite it.
- The upstream project is
  [`MikeSiekkinen/RestThermostat`](https://github.com/MikeSiekkinen/RestThermostat)
  (Flutter). Be respectful when referencing upstream work — this is
  a friendly port, not a fork-replacement.
- Reviewer ≠ reporter. Don't merge your own PRs without a second
  pair of eyes once the project has any contributors at all.

## 2. No secrets in the tree, ever

The following must **never** be committed under any circumstance:

- Cloudflare Access service-token IDs / secrets
  (`CF-Access-Client-Id`, `CF-Access-Client-Secret`).
- Any thermostat backend URL that points at a real server
  (use placeholders like `https://nle.example.com`).
- Device API keys, push tokens, Expo push credentials.
- Code-signing material: iOS provisioning profiles, certificates,
  private keys (`*.p8`, `*.p12`, `*.cer`, `*.mobileprovision`,
  `AuthKey_*.p8`).
- Apple Team IDs in checked-in `ExportOptions.plist`.
- App Store Connect API keys, TestFlight credentials.
- Google Play service-account JSON, upload keystores, keystore
  passwords.
- Sentry DSNs, analytics keys, third-party API keys of any kind.

**Where they live instead:**

- Public-but-required-at-runtime values → `EXPO_PUBLIC_*` env vars
  read through `src/config/env.ts`.
- Build-time-only / private values → non-prefixed env vars
  (e.g. `EAS_BUILD_TOKEN`), consumed by EAS build scripts, never
  by client code.
- Per-developer real values → a local `.env` that is **gitignored**.
  Document every variable in `.env.example` with a placeholder and a
  one-line comment explaining what it's for and how to obtain it.

**Pre-flight (mandatory before every commit):**

```bash
git diff --cached                       # eyeball for secrets
npx tsc --noEmit                        # types clean
npm run lint                            # lint clean
```

If `git diff --cached` shows anything that looks like a key
(`-----BEGIN`, long base64-ish blobs, `CF-Access-`, `.p8`/`.p12`/
`.keystore`, an `eyJ…` JWT, etc.), **stop and remove it** before
committing. If you already pushed a secret, rotate it on the source
side first, then rewrite history (`git filter-repo`) and force-push.
A `.gitignore` entry added after the fact does **not** scrub history.

## 3. Build artifacts and signing material are gitignored

`.gitignore` is the source of truth. The rules below mirror it and
exist so reviewers can spot when something slips through.

### iOS

- `ios/Pods/`, `ios/build/`, `*.xcuserstate`,
  `*.xcworkspace/xcuserdata/`.
- `*.mobileprovision`, `*.p12`, `*.p8`, `*.cer`, `AuthKey_*.p8`.
- `ExportOptions.plist` if it embeds your Team ID. Ship a sample
  `ExportOptions.example.plist` instead.

### Android

- `*.keystore`, `*.jks`, `android/keystore.properties`.
- `android/app/google-services.json` (the real one — ship a sample
  `google-services.example.json` instead).
- `android/.gradle/`, `android/build/`, `android/app/build/`.

### EAS

- `credentials.json`. `eas.json` itself **is** checked in but **must
  not contain secret values** — use `${ENV_VAR}` interpolation or
  EAS Secrets (`eas secret:create`).

### Expo

- `.expo/`, `.expo-shared/` (except `assets.json` if generation
  pipelines need it).
- `dist/`, `web-build/`, `expo-env.d.ts`.

### Generated native projects

- `/ios` and `/android` are gitignored. We run a managed Expo
  workflow; native projects are generated via `expo prebuild` when
  needed. If you need a custom native module that requires
  committing the native projects, raise an issue first.

## 4. Abstraction boundaries

Future contributors should be able to fork this app and point it at
their own infrastructure without grepping the whole tree. The shape:

### `src/config/env.ts` — single source of truth for env vars

- Reads `process.env.*` **exactly once** at module load.
- Validates and exports a typed `config` object.
- No `process.env.X` anywhere else in `src/`. (`grep` for it in code
  review.)
- Public/bundled values use the `EXPO_PUBLIC_` prefix (they ship to
  end users in the JS bundle — never put a secret here).
- Private/build-time values use a bare name and are consumed only
  by build/EAS scripts (never imported into client code).

### `src/api/client.ts` (today: `src/lib/api/nle-client.ts`)

- The **only** place in the codebase that issues HTTP requests to a
  thermostat backend.
- Injects auth headers and base URL from the runtime config / store.
- Swapping backends, changing auth, or adding interceptors is a
  one-file change. Resist the temptation to scatter `fetch(…)` calls.

### `src/branding.ts` — identity strings

- App display name, support email, marketing URLs, repo URL,
  copyright holder, etc. live here as exported constants.
- UI imports from this module, never hardcodes brand strings.
- Forking and rebranding the app is a one-file change.

## 5. README must include

- **Quickstart**: `npm install` → copy `.env.example` to `.env`
  (only if you want dev-seed values) → `npx expo start`. The app is
  fully functional with no `.env`; env vars are an optional
  developer convenience.
- **How to obtain a Cloudflare Access service token** with a link
  to the [Cloudflare Zero Trust docs](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/).
- **How to point the app at your own thermostat backend** — i.e.
  the in-app onboarding flow (server URL + auth picker).
- **License** — MIT, with `LICENSE` at the repo root, copyright
  `Justin McNally and contributors`, year `2026`. Portions adapted
  from the upstream Flutter project are credited.
- **Contributing** — a pointer to `CONTRIBUTING.md` and a high-level
  outline of how to file an issue or open a PR.

## 6. Conventions inherited from the port

- TypeScript strict; discriminated unions everywhere we used Dart
  sealed classes.
- `@tanstack/react-query` for server cache + polling, `zustand` for
  small client UI state. No Redux.
- `expo-secure-store` for credentials (Keychain / EncryptedSharedPreferences).
  Never write a credential into `AsyncStorage`.
- File-based routing via `expo-router`. New screens go under
  `src/app/`; reusable UI under `src/components/`; logic under
  `src/lib/`.
- Dark theme only for now (Ember palette parity with upstream).

## 7. When in doubt, ask

Open an issue or comment on the PR. This is a community project; the
goal is for everyone reading the diff to understand both *what*
changed and *why*. Code review favors clarity over cleverness.
