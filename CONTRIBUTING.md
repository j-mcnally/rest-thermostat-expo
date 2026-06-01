# Contributing

Thanks for taking the time to look at this project! It's an Expo /
React Native port of the community
[Rest Thermostat](https://github.com/MikeSiekkinen/RestThermostat)
client for NoLongerEvil firmware. Patches, bug reports, and
real-device feedback are all welcome.

Before opening a PR, please read this file plus [`CLAUDE.md`](./CLAUDE.md)
— the latter is the durable project contract that every change is
reviewed against.

## Filing an issue

- Search existing issues first.
- Include: device (iOS / Android version), Expo SDK / RN version,
  thermostat firmware version, server URL pattern (`http://lan-ip`
  vs `https://cloudflared`), and any logs you can pull from the
  in-app **Logs** screen.
- Never paste real Cloudflare Access service-token IDs or secrets,
  device API keys, or any backend hostname you don't want public.
  Redact with `xxxx`.

## Opening a pull request

1. Fork and branch off `main`. Use a descriptive branch name
   (`fix/connection-error-copy`, `feat/schedule-bulk-edit`).
2. Keep PRs focused. One logical change per PR.
3. Update or add docs / inline comments when behavior changes.
4. Tick the pre-flight checklist below before requesting review.
5. Ask for review explicitly; do not self-approve.

## Pre-flight checklist

Run all of this locally before pushing — it mirrors what CI will
enforce once it's wired up:

```bash
# 1. No secrets staged. Eyeball the diff for anything sensitive:
#    CF-Access-* values, *.p8 / *.p12 / *.keystore content, bearer
#    tokens (eyJ…), real backend URLs, your Apple Team ID, etc.
git diff --cached

# 2. Types compile cleanly under strict mode.
npx tsc --noEmit

# 3. Lint passes.
npm run lint

# 4. (when added) Tests pass.
# npm test
```

See [`CLAUDE.md`](./CLAUDE.md) §2 for the full list of things that
must never land in the tree, and §3 for the gitignore contract.

## What "good" looks like

- Code matches existing patterns (discriminated unions for sealed
  shapes, `react-query` for server cache, `zustand` for tiny client
  state, `expo-secure-store` for any credential).
- New HTTP calls go through `src/lib/api/nle-client.ts` — see
  [`CLAUDE.md`](./CLAUDE.md) §4.
- New env vars are documented in `.env.example` and read through
  `src/config/env.ts`, never directly via `process.env.X` scattered
  in components.
- Brand strings (app name, support email, URLs) come from
  `src/branding.ts`.
- Commit messages explain *why*, not just *what*.

## Code of conduct

Be kind. This is a small community project; there is no commercial
support contract behind it. Maintainers are volunteers.
