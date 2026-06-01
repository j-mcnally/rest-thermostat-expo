/**
 * NLE Control API client. Ported from `lib/services/nle_api_client.dart`
 * upstream. Implementation details:
 *
 * - Uses `fetch` (Expo's polyfill on native, native fetch on web).
 * - Merges configured auth headers verbatim into every request.
 * - Does NOT follow redirects (NLE never legitimately 3xxes; a 3xx
 *   means an access gate, which `NleError.classifyResponse` treats as
 *   an auth failure).
 * - Surfaces typed `NleError` instances for HTTP / network / parse
 *   failures.
 * - `sendCommand()` retries once on transient failures (network +
 *   5xx) with a 2-second backoff, mirroring upstream's DioException
 *   retry block.
 */

import {
  classifyNetworkError,
  classifyResponse,
  isNleError,
  type NleError,
} from '@/lib/errors/nle-error';
import { AppLogger } from '@/lib/state/app-logger';
import {
  devicesResponseFromJson,
  type DevicesResponse,
} from './types/devices-response';
import { scheduleFromJson, scheduleToJson, type Schedule } from './types/schedule';

const DEFAULT_CONNECT_TIMEOUT_MS = 5_000;
const DEFAULT_RECEIVE_TIMEOUT_MS = 10_000;

export interface NleClientOptions {
  baseUrl: string;
  authHeaders?: Record<string, string>;
  /** Optional override for tests so they can dodge wall-clock backoff. */
  retryDelayMs?: number;
  /** Per-request timeout (covers connect + receive). */
  timeoutMs?: number;
  /** Override for tests / SSR. */
  fetchImpl?: typeof fetch;
}

export interface NleClient {
  readonly baseUrl: string;
  getDevices(): Promise<DevicesResponse>;
  fetchDevicesJson(): Promise<Record<string, unknown>>;
  getSchedule(serial: string): Promise<Schedule | null>;
  sendCommand(params: {
    serial: string;
    command: string;
    value: unknown;
  }): Promise<void>;
  setSchedule(serial: string, schedule: Schedule): Promise<void>;
}

export function createNleClient(opts: NleClientOptions): NleClient {
  const {
    baseUrl,
    authHeaders = {},
    retryDelayMs = 2_000,
    timeoutMs = DEFAULT_RECEIVE_TIMEOUT_MS,
    fetchImpl = fetch,
  } = opts;

  AppLogger.info(`auth: ${authPresence(authHeaders)}`);

  async function rawJson<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const ac = new AbortController();
    const timeoutHandle = setTimeout(() => ac.abort(), timeoutMs);
    AppLogger.debug(`${method} ${path}`);
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body == null ? {} : { 'Content-Type': 'application/json' }),
          ...authHeaders,
        },
        body: body == null ? undefined : JSON.stringify(body),
        redirect: 'manual',
        signal: ac.signal,
      });
    } catch (e) {
      throw classifyNetworkError(e, target(url));
    } finally {
      clearTimeout(timeoutHandle);
    }
    if (response.status >= 200 && response.status < 300) {
      return parseJson<T>(response);
    }
    // Parse the body if it's JSON so the classifier can pull
    // serverMessage. Tolerate parse failures — the classifier handles
    // missing body fine.
    let payload: unknown;
    try {
      payload = await parseJson(response);
    } catch {
      try {
        payload = await response.text();
      } catch {
        payload = undefined;
      }
    }
    const err = classifyResponse(response, payload);
    AppLogger.warn(`HTTP ${response.status} ${method} ${path}`, {
      status: response.status,
    });
    throw err;
  }

  async function parseJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (text.length === 0) return undefined as unknown as T;
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      const excerpt = text.length <= 200 ? text : `${text.slice(0, 200)}…`;
      AppLogger.error('parse failed', { excerpt });
      const err: NleError = { type: 'parse', excerpt, cause: e };
      throw err;
    }
  }

  function target(url: string): string {
    try {
      const u = new URL(url);
      return `${u.hostname}:${u.port || (u.protocol === 'https:' ? '443' : '80')}`;
    } catch {
      return '';
    }
  }

  const client: NleClient = {
    baseUrl,
    async getDevices() {
      const raw = await rawJson<Record<string, unknown>>('GET', '/api/devices');
      return wrapParse(raw, () => devicesResponseFromJson(raw));
    },
    async fetchDevicesJson() {
      return rawJson<Record<string, unknown>>('GET', '/api/devices');
    },
    async getSchedule(serial: string) {
      const body = await rawJson<Record<string, unknown>>(
        'GET',
        `/api/schedule?serial=${encodeURIComponent(serial)}`,
      );
      return wrapParse(body, () => {
        const inner = body?.['schedule'];
        if (inner == null || typeof inner !== 'object' || Array.isArray(inner))
          return null;
        return scheduleFromJson(inner as Record<string, unknown>);
      });
    },
    async sendCommand({ serial, command, value }) {
      AppLogger.commandIssued(command, value);
      const data = { serial, command, value };
      try {
        await rawJson('POST', '/command', data);
        return;
      } catch (e) {
        if (!isTransient(e)) throw e;
        await sleep(retryDelayMs);
        await rawJson('POST', '/command', data);
        return;
      }
    },
    async setSchedule(serial, schedule) {
      await client.sendCommand({
        serial,
        command: 'set_schedule',
        value: scheduleToJson(schedule),
      });
    },
  };
  return client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransient(e: unknown): boolean {
  if (!isNleError(e)) return false;
  if (e.type === 'network') return true;
  if (e.type === 'server') return true;
  return false;
}

function wrapParse<T>(body: unknown, builder: () => T): T {
  try {
    return builder();
  } catch (e) {
    const text =
      typeof body === 'string'
        ? body
        : (() => {
            try {
              return JSON.stringify(body);
            } catch {
              return String(body);
            }
          })();
    const excerpt = text.length <= 200 ? text : `${text.slice(0, 200)}…`;
    AppLogger.error('parse failed', { excerpt });
    const err: NleError = { type: 'parse', excerpt, cause: e };
    throw err;
  }
}

function authPresence(headers: Record<string, string>): string {
  if (Object.keys(headers).length === 0) return 'none';
  if ('CF-Access-Client-Id' in headers) return 'cf-service-token';
  const auth = (headers['Authorization'] ?? '').toLowerCase();
  if (auth.startsWith('bearer')) return 'bearer';
  if (auth.startsWith('basic')) return 'basic';
  return 'other';
}
