/**
 * Ember color palette — ported from `lib/theme/colors.dart` upstream.
 *
 * All values are constant string literals so they participate in
 * StyleSheet objects and can be passed into expo-linear-gradient or
 * react-native-svg without recomputing per render.
 */

// ---------------------------------------------------------------------------
// Background radial-gradient color stops.
// (inner -> outer). Used by <EmberBackground />.
// ---------------------------------------------------------------------------

/** Heat-mode background gradient: deep magenta-tinted black. */
export const heatBackground = ['#1A0A1A', '#050108', '#000000'] as const;

/** Cool-mode background gradient: deep blue-tinted black. */
export const coolBackground = ['#0A1424', '#02060C', '#000000'] as const;

/** Neutral (off / auto / eco) background gradient: charcoal. */
export const neutralBackground = ['#0D0D12', '#050507', '#000000'] as const;

// ---------------------------------------------------------------------------
// Mode accents (heat / cool / eco / fan).
// ---------------------------------------------------------------------------

export const heatGlow = '#FF6432';

/** Heat accent gradient (high -> low). */
export const heatGradient = ['#FF8A50', '#FF4516'] as const;

export const heatText = ['#FFFFFF', '#FFB89A'] as const;

export const coolGlow = '#50AAFF';

export const coolGradient = ['#80C8FF', '#3070D0'] as const;

export const coolText = ['#FFFFFF', '#A8D4FF'] as const;

/** Eco / away accent (single green). */
export const eco = '#4ADE80';

/** Fan active gradient (white -> silver -> graphite). */
export const fanActiveGradient = ['#FFFFFF', '#D8DEE8', '#8A91A0'] as const;

export const fanInactiveGradient = ['#9AA0AC', '#5A5E68'] as const;

/** Neutral inert gradient — when no mode color cue applies. */
export const neutralGradient = ['#A0A0A0', '#606060'] as const;

// ---------------------------------------------------------------------------
// Text opacity tiers (white-based).
// ---------------------------------------------------------------------------

export const textPrimary = '#FFFFFF';
export const textSecondary = '#FFFFFF99'; // 60%
export const textTertiary = '#FFFFFF66'; // 40%
export const textDisabled = '#FFFFFF4D'; // 30%

/** Surface seed — pure black. */
export const surface = '#000000';

/** Bundle these so existing call sites can reach them under one symbol. */
export const EmberColors = {
  heatBackground,
  coolBackground,
  neutralBackground,
  heatGlow,
  heatGradient,
  heatText,
  coolGlow,
  coolGradient,
  coolText,
  eco,
  fanActiveGradient,
  fanInactiveGradient,
  neutralGradient,
  textPrimary,
  textSecondary,
  textTertiary,
  textDisabled,
  surface,
} as const;
