import { deviceFromJson, type Device } from './device';

/**
 * The shape returned by `GET /api/devices`:
 * `{ devices: Device[] }`. The Flutter port models this as a tiny
 * wrapper type so callers don't have to unwrap a top-level array.
 */
export interface DevicesResponse {
  devices: Device[];
}

export function devicesResponseFromJson(
  json: Record<string, unknown>,
): DevicesResponse {
  const raw = json['devices'];
  if (!Array.isArray(raw)) {
    throw new Error("Expected `devices` to be an array");
  }
  return {
    devices: raw.map((d) => deviceFromJson(d as Record<string, unknown>)),
  };
}
