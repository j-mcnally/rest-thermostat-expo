/**
 * NLE device types. Ported from `lib/models/device.dart` upstream.
 *
 * The wire shape comes from the NLE Control API
 * (`GET /api/devices` → `{devices: Device[]}`). All temperatures are
 * Celsius regardless of `temperatureScale`.
 */

export type DeviceMode = 'off' | 'heat' | 'cool' | 'heatCool' | 'emergency';

/**
 * Wire-format → enum. The server normalizes the write value
 * `"heat-cool"` to `"range"` on read (verified against live server
 * 192.168.1.216:8082), so both labels map to `heatCool`.
 */
export function deviceModeFromApi(value: string): DeviceMode {
  switch (value) {
    case 'off':
      return 'off';
    case 'heat':
      return 'heat';
    case 'cool':
      return 'cool';
    case 'heat-cool':
    case 'range':
      return 'heatCool';
    case 'emergency':
      return 'emergency';
    default:
      throw new Error(`Unknown device mode: ${value}`);
  }
}

/** enum → wire-format. `toApi` always emits `"heat-cool"` for heat-cool. */
export function deviceModeToApi(mode: DeviceMode): string {
  switch (mode) {
    case 'off':
      return 'off';
    case 'heat':
      return 'heat';
    case 'cool':
      return 'cool';
    case 'heatCool':
      return 'heat-cool';
    case 'emergency':
      return 'emergency';
  }
}

export interface HvacState {
  heater: boolean;
  heatX2: boolean;
  heatX3: boolean;
  ac: boolean;
  coolX2: boolean;
  coolX3: boolean;
  fan: boolean;
  auxHeat: boolean;
  emerHeat: boolean;
  altHeat: boolean;
  humidifier: boolean;
  dehumidifier: boolean;
  autoDehum: boolean;
  fanCooling: boolean;
}

export function hvacStateFromJson(json: Record<string, unknown>): HvacState {
  const b = (key: string) => json[key] === true;
  return {
    heater: b('heater'),
    heatX2: b('heat_x2'),
    heatX3: b('heat_x3'),
    ac: b('ac'),
    coolX2: b('cool_x2'),
    coolX3: b('cool_x3'),
    fan: b('fan'),
    auxHeat: b('aux_heat'),
    emerHeat: b('emer_heat'),
    altHeat: b('alt_heat'),
    humidifier: b('humidifier'),
    dehumidifier: b('dehumidifier'),
    autoDehum: b('auto_dehum'),
    fanCooling: b('fan_cooling'),
  };
}

export interface Capabilities {
  canHeat: boolean;
  canCool: boolean;
  hasFan: boolean;
  hasEmerHeat: boolean;
  hasHumidifier: boolean;
  hasDehumidifier: boolean;
}

export function capabilitiesFromJson(
  json: Record<string, unknown>,
): Capabilities {
  return {
    canHeat: json['can_heat'] === true,
    canCool: json['can_cool'] === true,
    hasFan: json['has_fan'] === true,
    hasEmerHeat: json['has_emer_heat'] === true,
    hasHumidifier: json['has_humidifier'] === true,
    hasDehumidifier: json['has_dehumidifier'] === true,
  };
}

export interface EcoTemperatures {
  high: number;
  low: number;
}

export function ecoTemperaturesFromJson(
  json: Record<string, unknown>,
): EcoTemperatures {
  return {
    high: (json['high'] as number) ?? 0,
    low: (json['low'] as number) ?? 0,
  };
}

export interface Device {
  serial: string;
  apiKey: string;
  name: string | null;
  isAvailable: boolean;
  isOnline: boolean;
  lastSeen: string; // ISO timestamp
  currentTemperature: number;
  targetTemperature: number;
  targetTemperatureHigh: number | null;
  targetTemperatureLow: number | null;
  humidity: number;
  targetHumidity: number;
  targetHumidityEnabled: boolean;
  mode: DeviceMode;
  hvac: HvacState;
  fanTimerActive: boolean;
  fanTimerTimeout: number;
  ecoTemperatures: EcoTemperatures | null;
  hasLeaf: boolean;
  softwareVersion: string;
  temperatureScale: string;
  capabilities: Capabilities;
  ecoMode: string | null;
  timeToTarget: number;
  away: boolean;
  scheduleMode: string | null;
  structureId: string | null;
  backplateTemperature: number;
  subscriptionCount: number;
}

export function deviceFromJson(json: Record<string, unknown>): Device {
  const num = (key: string) => Number(json[key] ?? 0);
  const numOrNull = (key: string) => {
    const v = json[key];
    return v == null ? null : Number(v);
  };
  return {
    serial: String(json['serial']),
    apiKey: String(json['api_key']),
    name: (json['name'] as string | null) ?? null,
    isAvailable: json['is_available'] === true,
    isOnline: json['is_online'] === true,
    lastSeen: String(json['last_seen']),
    currentTemperature: num('current_temperature'),
    targetTemperature: num('target_temperature'),
    targetTemperatureHigh: numOrNull('target_temperature_high'),
    targetTemperatureLow: numOrNull('target_temperature_low'),
    humidity: Number(json['humidity'] ?? 0),
    targetHumidity: num('target_humidity'),
    targetHumidityEnabled: json['target_humidity_enabled'] === true,
    mode: deviceModeFromApi(json['mode'] as string),
    hvac: hvacStateFromJson(json['hvac'] as Record<string, unknown>),
    fanTimerActive: json['fan_timer_active'] === true,
    fanTimerTimeout: Number(json['fan_timer_timeout'] ?? 0),
    ecoTemperatures:
      json['eco_temperatures'] == null
        ? null
        : ecoTemperaturesFromJson(
            json['eco_temperatures'] as Record<string, unknown>,
          ),
    hasLeaf: json['has_leaf'] === true,
    softwareVersion: String(json['software_version'] ?? ''),
    temperatureScale: String(json['temperature_scale'] ?? 'F'),
    capabilities: capabilitiesFromJson(
      json['capabilities'] as Record<string, unknown>,
    ),
    ecoMode: (json['eco_mode'] as string | null) ?? null,
    timeToTarget: Number(json['time_to_target'] ?? 0),
    away: json['away'] === true,
    scheduleMode: (json['schedule_mode'] as string | null) ?? null,
    structureId: (json['structure_id'] as string | null) ?? null,
    backplateTemperature: num('backplate_temperature'),
    subscriptionCount: Number(json['subscription_count'] ?? 0),
  };
}

/**
 * Whether the device is currently in manual-away (a.k.a. eco) mode.
 *
 * The `device.away` boolean is NOT what `POST /command set_away`
 * toggles — `away` is the legacy auto-away (motion-detection) flag,
 * which NLE doesn't implement and which stays `false` forever. The
 * field that actually reflects "currently away" is `eco_mode`:
 *
 * - `"schedule"`  — normal operation, following the schedule
 * - `"manual-eco"` — user toggled away on (via `set_away true`)
 *
 * Verified against the live server 2026-05-19.
 */
export function isAway(device: Device): boolean {
  return device.ecoMode === 'manual-eco';
}
