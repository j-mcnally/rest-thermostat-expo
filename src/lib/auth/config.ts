/**
 * AuthConfig discriminated union. Ported from
 * `lib/models/auth_config.dart` upstream.
 *
 * Cloudflare Access service tokens authenticate to the CF Access
 * edge sitting in front of the NLE reverse proxy via a header pair,
 * rather than an `Authorization` header. Cloudflare strips those
 * headers before the request reaches the origin, so the origin sees
 * no auth — which is why this is modeled as a mutually-exclusive auth
 * choice rather than layered on top of Basic/Bearer.
 */

import { base64Encode } from '@/lib/util/base64';

export type AuthTag = 'none' | 'basic' | 'bearer' | 'cf_service_token';

export type AuthConfig =
  | { readonly tag: 'none' }
  | { readonly tag: 'basic'; readonly username: string; readonly password: string }
  | { readonly tag: 'bearer'; readonly token: string }
  | {
      readonly tag: 'cf_service_token';
      readonly clientId: string;
      readonly clientSecret: string;
    };

export const AuthNone: AuthConfig = { tag: 'none' };

export function authBasic(username: string, password: string): AuthConfig {
  return { tag: 'basic', username, password };
}

export function authBearer(token: string): AuthConfig {
  return { tag: 'bearer', token };
}

export function authCfServiceToken(
  clientId: string,
  clientSecret: string,
): AuthConfig {
  return { tag: 'cf_service_token', clientId, clientSecret };
}

/**
 * Headers this config contributes to every request. Empty when no
 * auth is configured. Covers `Authorization`-style schemes (Basic /
 * Bearer) and custom header pairs like Cloudflare Access service
 * tokens.
 */
export function headersFor(config: AuthConfig): Record<string, string> {
  switch (config.tag) {
    case 'none':
      return {};
    case 'basic': {
      const encoded = base64Encode(`${config.username}:${config.password}`);
      return { Authorization: `Basic ${encoded}` };
    }
    case 'bearer':
      return { Authorization: `Bearer ${config.token}` };
    case 'cf_service_token':
      return {
        'CF-Access-Client-Id': config.clientId,
        'CF-Access-Client-Secret': config.clientSecret,
      };
  }
}

/**
 * Map headers to a short presence label, never leaking the value.
 * Mirrors the upstream `_authPresence` helper used in the logger.
 */
export function authPresence(headers: Record<string, string>): string {
  if (Object.keys(headers).length === 0) return 'none';
  if ('CF-Access-Client-Id' in headers) return 'cf-service-token';
  const auth = (headers['Authorization'] ?? '').toLowerCase();
  if (auth.startsWith('bearer')) return 'bearer';
  if (auth.startsWith('basic')) return 'basic';
  return 'other';
}
