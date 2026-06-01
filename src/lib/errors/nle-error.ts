/**
 * Typed errors surfaced by the NLE client. Ported from
 * `lib/services/nle_error.dart` upstream.
 *
 * Replaces raw fetch errors at the public API boundary so UI catches
 * can dispatch on intent (transient network blip vs. auth failure vs.
 * rate limit) without re-deriving the classifier at every call site.
 */

export type NleNetworkErrorKind =
  | 'connectionTimeout'
  | 'receiveTimeout'
  | 'sendTimeout'
  | 'connectionRefused'
  | 'dnsFailure'
  | 'tlsFailure'
  | 'unknown';

export type NleError =
  | {
      readonly type: 'network';
      readonly kind: NleNetworkErrorKind;
      readonly target: string; // host:port (safe to surface)
      readonly cause: unknown;
      readonly serverMessage?: string;
    }
  | {
      readonly type: 'auth';
      readonly statusCode: number;
      readonly isCloudflareAccess: boolean;
      readonly serverMessage?: string;
    }
  | {
      readonly type: 'rateLimit';
      readonly retryAfterSeconds: number | null;
      readonly serverMessage?: string;
    }
  | {
      readonly type: 'server';
      readonly statusCode: number;
      readonly serverMessage?: string;
    }
  | {
      readonly type: 'client';
      readonly statusCode: number;
      readonly serverMessage?: string;
    }
  | {
      readonly type: 'parse';
      readonly excerpt: string;
      readonly cause: unknown;
      readonly serverMessage?: string;
    };

export function isNleError(value: unknown): value is NleError {
  if (typeof value !== 'object' || value === null) return false;
  const t = (value as { type?: string }).type;
  return (
    t === 'network' ||
    t === 'auth' ||
    t === 'rateLimit' ||
    t === 'server' ||
    t === 'client' ||
    t === 'parse'
  );
}

export function nleErrorToString(err: NleError): string {
  switch (err.type) {
    case 'network':
      return `NleNetworkError(${err.kind}, ${err.target})`;
    case 'auth':
      return `NleAuthError(${err.statusCode}${err.isCloudflareAccess ? ', cloudflare-access' : ''}${err.serverMessage ? `: ${err.serverMessage}` : ''})`;
    case 'rateLimit':
      return `NleRateLimitError(retryAfter: ${err.retryAfterSeconds ?? '?'})`;
    case 'server':
      return `NleServerError(${err.statusCode}${err.serverMessage ? `: ${err.serverMessage}` : ''})`;
    case 'client':
      return `NleClientError(${err.statusCode}${err.serverMessage ? `: ${err.serverMessage}` : ''})`;
    case 'parse':
      return `NleParseError(excerpt: ${err.excerpt})`;
  }
}

/**
 * Heuristic: does this response look like a Cloudflare Access challenge?
 * Access returns a 302 to `*.cloudflareaccess.com` and tags responses
 * with `WWW-Authenticate: Cloudflare-Access`. Lets the UI point the
 * user at the service-token fields instead of generic credentials.
 */
export function looksLikeCloudflareAccess(
  headers: Headers | Record<string, string>,
): boolean {
  const get = (key: string): string => {
    if (headers instanceof Headers) return headers.get(key) ?? '';
    const lower = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lower) return v;
    }
    return '';
  };
  const wwwAuth = get('www-authenticate').toLowerCase();
  if (wwwAuth.includes('cloudflare-access')) return true;
  const location = get('location');
  return location.includes('cloudflareaccess.com');
}

/**
 * Parse `Retry-After` per RFC 9110 §10.2.3: integer seconds OR an
 * HTTP-date. Returns null for missing/malformed values.
 */
export function parseRetryAfter(
  raw: string | null | undefined,
  now: () => Date = () => new Date(),
): number | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const asInt = Number.parseInt(trimmed, 10);
  if (Number.isFinite(asInt) && String(asInt) === trimmed) {
    return Math.max(0, Math.min(asInt, 86400));
  }
  const when = new Date(trimmed);
  if (Number.isNaN(when.getTime())) return null;
  const delta = Math.round((when.getTime() - now().getTime()) / 1000);
  return delta < 0 ? 0 : delta;
}

function extractServerMessage(body: unknown): string | undefined {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const o = body as Record<string, unknown>;
    const candidate = o['error'] ?? o['message'];
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }
  if (typeof body === 'string' && body.length > 0) return body;
  return undefined;
}

/**
 * Classify a fetch Response (already received) into an NleError.
 * The caller is responsible for invoking this only on non-2xx
 * responses; the `body` arg should be the already-parsed body
 * (JSON or text).
 */
export function classifyResponse(
  response: Response,
  body: unknown,
): NleError {
  const code = response.status;
  const serverMessage = extractServerMessage(body);
  const cfAccess = looksLikeCloudflareAccess(response.headers);
  if (code === 401 || code === 403) {
    return {
      type: 'auth',
      statusCode: code,
      isCloudflareAccess: cfAccess,
      serverMessage,
    };
  }
  if (code === 429) {
    return {
      type: 'rateLimit',
      retryAfterSeconds: parseRetryAfter(response.headers.get('retry-after')),
      serverMessage,
    };
  }
  if (code >= 500 && code < 600) {
    return { type: 'server', statusCode: code, serverMessage };
  }
  // A JSON control API never legitimately redirects. A 3xx means an
  // identity / access gate (Cloudflare Access, an SSO reverse proxy)
  // intercepted the request — treat it as an auth failure.
  if (code >= 300 && code < 400) {
    return {
      type: 'auth',
      statusCode: code,
      isCloudflareAccess: cfAccess,
      serverMessage,
    };
  }
  if (code >= 400 && code < 500) {
    return { type: 'client', statusCode: code, serverMessage };
  }
  return {
    type: 'network',
    kind: 'unknown',
    target: '',
    cause: response,
  };
}

/**
 * Classify a raw network failure (fetch threw before producing a
 * response). The kind is derived from the error message because the
 * RN/JS `fetch` doesn't surface DNS / refused / TLS as a typed enum.
 */
export function classifyNetworkError(
  err: unknown,
  target: string,
): NleError {
  const msg =
    err instanceof Error ? `${err.name} ${err.message}`.toLowerCase() : '';
  let kind: NleNetworkErrorKind = 'unknown';
  if (msg.includes('timeout') || msg.includes('timed out')) {
    kind = 'connectionTimeout';
  } else if (
    msg.includes('connection refused') ||
    msg.includes('econnrefused')
  ) {
    kind = 'connectionRefused';
  } else if (
    msg.includes('failed host lookup') ||
    msg.includes('nodename nor servname') ||
    msg.includes('name or service not known') ||
    msg.includes('no address associated') ||
    msg.includes('hostname could not be resolved')
  ) {
    kind = 'dnsFailure';
  } else if (
    msg.includes('certificate') ||
    msg.includes('tls') ||
    msg.includes('handshake') ||
    msg.includes('ssl')
  ) {
    kind = 'tlsFailure';
  } else if (msg.includes('aborted')) {
    kind = 'connectionTimeout';
  }
  return { type: 'network', kind, target, cause: err };
}

/**
 * Human-readable copy for a network error kind. Lets callers render
 * a cause-specific snackbar without re-doing the switch each time.
 */
export function networkErrorCopy(kind: NleNetworkErrorKind): string {
  switch (kind) {
    case 'connectionTimeout':
      return "Server didn't respond in time.";
    case 'receiveTimeout':
      return 'Server stopped responding mid-request.';
    case 'sendTimeout':
      return "Couldn't finish sending the request.";
    case 'connectionRefused':
      return 'Connection refused — wrong port or server is down.';
    case 'dnsFailure':
      return "Couldn't resolve that hostname.";
    case 'tlsFailure':
      return 'TLS / certificate problem connecting to the server.';
    case 'unknown':
      return "Couldn't reach the server.";
  }
}
