/**
 * Normalize a user-entered server address into a base URL suitable for
 * fetch. Ported from `lib/services/url_normalizer.dart` upstream.
 *
 * Accepts:
 * - bare host: `nle.example.com` → `http://nle.example.com`
 * - host with port: `192.168.1.50:8082` → `http://192.168.1.50:8082`
 * - full URL: `https://nle.example.com/path` → preserved
 *
 * Always strips trailing slashes from the returned base — clients
 * concatenate paths starting with `/`.
 */
export function normalizeServerUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new Error('Server URL is empty');
  }
  const hasScheme = /^[a-z][a-z0-9+\-.]*:\/\//i.test(trimmed);
  const withScheme = hasScheme ? trimmed : `http://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch (e) {
    throw new Error(`Invalid server URL: ${input}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Unsupported URL scheme: ${parsed.protocol}`);
  }
  // Drop trailing slash from pathname.
  parsed.pathname = parsed.pathname.replace(/\/+$/g, '');
  const path = parsed.pathname === '/' ? '' : parsed.pathname;
  const port = parsed.port ? `:${parsed.port}` : '';
  return `${parsed.protocol}//${parsed.hostname}${port}${path}`;
}

/**
 * Display-only label for the configured base URL — strips the
 * scheme so the UI doesn't shout "http://" everywhere.
 */
export function displayLabelFor(baseUrl: string): string {
  return baseUrl.replace(/^https?:\/\//i, '');
}
