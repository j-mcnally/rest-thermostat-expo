/**
 * Brand / identity strings — single source of truth for everything
 * a fork would want to rebrand. UI imports from here; nothing in
 * the rest of the codebase hardcodes the app name, support email,
 * or marketing URLs.
 *
 * Rebranding for a fork: edit the values below, replace the assets
 * referenced by `app.json`, and you're done. See CLAUDE.md §4.
 */

export interface Branding {
  /** Long display name (settings, About screen, splash). */
  readonly appName: string;
  /** Short display name (tab title, push notifications). */
  readonly shortName: string;
  /** One-line tagline used on the welcome screen. */
  readonly tagline: string;
  /** Address users can email for help. Optional. */
  readonly supportEmail: string | null;
  /** Repo / source URL — surfaced on the About screen. */
  readonly repoUrl: string;
  /** Upstream project (the Flutter app this was ported from). */
  readonly upstreamUrl: string;
  /** Firmware project the app talks to. */
  readonly firmwareDocsUrl: string;
  /** Copyright holder shown in About / settings. */
  readonly copyrightHolder: string;
  /** Year the copyright was first asserted. */
  readonly copyrightYear: number;
}

export const branding: Branding = {
  appName: 'Rest Thermostat',
  shortName: 'Rest',
  tagline: 'Your thermostat. Your server. Your control.',
  supportEmail: null,
  repoUrl: 'https://github.com/j-mcnally/rest-thermostat-expo',
  upstreamUrl: 'https://github.com/MikeSiekkinen/RestThermostat',
  firmwareDocsUrl: 'https://docs.nolongerevil.com',
  copyrightHolder: 'Justin McNally and contributors',
  copyrightYear: 2026,
};
