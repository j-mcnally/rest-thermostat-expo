/**
 * Single source of truth for environment variables.
 *
 * Rules (see CLAUDE.md §4 for the full contract):
 *
 *   - `process.env.*` is read here, and ONLY here, in client code.
 *   - Public values use the `EXPO_PUBLIC_` prefix and are bundled
 *     into the JS that ships to users. Never put a real secret in
 *     one of these — assume the value is readable to anyone who
 *     downloads your app.
 *   - Private / build-time values use a bare name and are intended
 *     for EAS / build scripts. They are not re-exported from this
 *     module, and `tsc` will complain if client code tries to read
 *     them.
 *
 * The validation is intentionally hand-rolled — adding `zod` or
 * `valibot` for ~10 keys would be heavier than the wins. If the
 * config surface grows past, say, 15 keys, swap to a schema lib.
 */

import { AppLogger } from '@/lib/state/app-logger';

// ---------------------------------------------------------------------------
// Raw reads (the ONLY direct access to `process.env` in src/).
// ---------------------------------------------------------------------------

const RAW = {
  nleBaseUrl: process.env.EXPO_PUBLIC_NLE_BASE_URL,
  cfAccessClientId: process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_ID,
  cfAccessClientSecret: process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_SECRET,
} as const;

// ---------------------------------------------------------------------------
// Validators.
// ---------------------------------------------------------------------------

function optionalUrl(value: string | undefined, name: string): string | null {
  if (value == null || value.length === 0) return null;
  try {
    // Accept bare host (`host:port`) by normalising via the same
    // helper the runtime uses. Avoid importing it here to keep this
    // module free of circular deps — instead, do a forgiving check.
    if (/^https?:\/\//.test(value)) {
      // Validate parseability.
      new URL(value);
      return value;
    }
    // Bare host. Let the URL normaliser handle this at runtime;
    // here we just confirm it's a plausible host.
    if (!/^[a-zA-Z0-9.\-:/_]+$/.test(value)) {
      throw new Error('contains unexpected characters');
    }
    return value;
  } catch (e) {
    AppLogger.warn(`env: ${name} is set but not parseable — ignoring`, {
      reason: String(e),
    });
    return null;
  }
}

function optionalString(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// ---------------------------------------------------------------------------
// Public config. Imported throughout the app for env-driven defaults.
// ---------------------------------------------------------------------------

export interface AppConfig {
  /**
   * Default NLE server URL to pre-fill onboarding with. Null when
   * unset; in that case the onboarding flow asks the user.
   */
  readonly devSeedServerUrl: string | null;

  /**
   * Default Cloudflare Access service-token credentials to pre-fill
   * onboarding with. Both fields must be set for the pair to be
   * used; a half-set pair is ignored.
   */
  readonly devSeedCfAccess: {
    readonly clientId: string;
    readonly clientSecret: string;
  } | null;
}

function buildConfig(): AppConfig {
  const serverUrl = optionalUrl(RAW.nleBaseUrl, 'EXPO_PUBLIC_NLE_BASE_URL');
  const cfId = optionalString(RAW.cfAccessClientId);
  const cfSecret = optionalString(RAW.cfAccessClientSecret);

  const devSeedCfAccess =
    cfId != null && cfSecret != null
      ? { clientId: cfId, clientSecret: cfSecret }
      : null;

  if ((cfId == null) !== (cfSecret == null)) {
    AppLogger.warn(
      'env: EXPO_PUBLIC_CF_ACCESS_CLIENT_ID and …_CLIENT_SECRET ' +
        'must both be set to pre-seed CF Access — ignoring partial pair',
    );
  }

  return {
    devSeedServerUrl: serverUrl,
    devSeedCfAccess,
  };
}

export const config: AppConfig = buildConfig();
