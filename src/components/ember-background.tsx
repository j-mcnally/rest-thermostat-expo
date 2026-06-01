import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { DeviceMode } from '@/lib/api/types/device';
import * as Colors from '@/lib/theme/colors';

interface EmberBackgroundProps {
  mode?: DeviceMode | 'neutral';
  children?: ReactNode;
}

/**
 * Full-screen radial background gradient. Ported from
 * `lib/widgets/ember_background.dart`. The Flutter version uses
 * Flutter's RadialGradient; here we use react-native-svg to get a
 * true radial gradient, falling back to a linear gradient on
 * platforms where SVG isn't available.
 *
 * The Flutter widget centers the gradient slightly above center
 * (Alignment(0, -0.3)); we mirror that here with cy="0.35".
 */
export function EmberBackground({
  mode = 'neutral',
  children,
}: EmberBackgroundProps) {
  const stops = stopsFor(mode);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1 1"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <RadialGradient
            id="ember"
            cx="0.5"
            cy="0.35"
            rx="0.9"
            ry="0.9"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0" stopColor={stops[0]} stopOpacity="1" />
            <Stop offset="0.5" stopColor={stops[1]} stopOpacity="1" />
            <Stop offset="1" stopColor={stops[2]} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill="url(#ember)" />
      </Svg>
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}

function stopsFor(
  mode: DeviceMode | 'neutral',
): readonly [string, string, string] {
  switch (mode) {
    case 'heat':
    case 'emergency':
      return Colors.heatBackground;
    case 'cool':
      return Colors.coolBackground;
    case 'off':
    case 'heatCool':
    case 'neutral':
      return Colors.neutralBackground;
  }
}

/**
 * Lightweight linear-gradient fallback for non-SVG contexts (e.g.
 * web during early bring-up). Public so screens can opt into it.
 */
export function EmberBackgroundLinear({
  mode = 'neutral',
  children,
}: EmberBackgroundProps) {
  const stops = stopsFor(mode);
  return (
    <LinearGradient
      colors={stops as unknown as [string, string, string]}
      start={{ x: 0.5, y: 0.2 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      {children}
    </LinearGradient>
  );
}
