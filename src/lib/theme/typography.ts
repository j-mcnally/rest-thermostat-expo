/**
 * Ember typography — ported from `lib/theme/typography.dart` upstream.
 *
 * The font families (Fraunces, Geist, JetBrainsMono, InstrumentSerif)
 * are loaded via expo-font in `src/app/_layout.tsx`. Until the fonts
 * are actually loaded these helpers fall back to system fonts. RN
 * resolves `fontFamily: undefined` to the platform default which keeps
 * the rest of the type system valid.
 */

import type { TextStyle } from 'react-native';

import * as Colors from './colors';

/** Big temperature display in Fraunces. */
export function displayLarge(color: string = Colors.textPrimary): TextStyle {
  return {
    fontFamily: 'Fraunces_300Light',
    fontSize: 96,
    fontWeight: '300',
    lineHeight: 96,
    letterSpacing: -2.0,
    color,
  };
}

export function headlineLarge(color: string = Colors.textPrimary): TextStyle {
  return {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 32,
    fontWeight: '400',
    color,
  };
}

/** Geist sans-serif body copy. */
export function bodyMedium(color: string = Colors.textPrimary): TextStyle {
  return {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 14 * 1.4,
    color,
  };
}

export function bodyLarge(color: string = Colors.textPrimary): TextStyle {
  return {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color,
  };
}

export function bodySmall(color: string = Colors.textSecondary): TextStyle {
  return {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    fontWeight: '400',
    color,
  };
}

/** JetBrains Mono uppercase tracked label. */
export function labelSmall(color: string = Colors.textSecondary): TextStyle {
  return {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    lineHeight: 11 * 1.2,
    color,
  };
}

export function labelLarge(color: string = Colors.textPrimary): TextStyle {
  return {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    color,
  };
}

/** Instrument Serif italic accent. */
export function bodyMediumItalic(
  color: string = Colors.textSecondary,
): TextStyle {
  return {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 18 * 1.3,
    color,
  };
}

export const EmberTypography = {
  displayLarge,
  headlineLarge,
  bodyMedium,
  bodyLarge,
  bodySmall,
  labelSmall,
  labelLarge,
  bodyMediumItalic,
} as const;
