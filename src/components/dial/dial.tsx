/**
 * Segmented-ring temperature dial. Ported from
 * `lib/widgets/temperature_dial.dart` upstream.
 *
 * Visual:
 * - 72 ticks on a 270° arc (bottom 90° empty).
 * - Active ticks (i ≤ targetIndex) paint along the mode gradient with
 *   a soft glow.
 * - Inactive ticks paint at rgba(255,255,255,0.06).
 * - A brighter overlay tick marks the current temperature index.
 * - Center text: target (Fraunces large) above current (italic).
 *
 * Interactivity:
 * - When `onDragUpdate` / `onDragEnd` / `onTap` are provided the dial
 *   becomes a slider: pan-anywhere updates `optimisticC`, throttled
 *   selection-click haptic at every new tick, and parent-debounced
 *   commit on pan-end / tap.
 *
 * Read-only dials (no callbacks) skip the GestureDetector entirely.
 */

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityActionEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Line, Stop } from 'react-native-svg';

import type { DeviceMode } from '@/lib/api/types/device';
import { throttledSelectionClick } from '@/lib/util/haptics';
import {
  ARC_START,
  ARC_SWEEP,
  MIN_CELSIUS,
  MAX_CELSIUS,
  PREFERRED_DIAMETER,
  TICK_COUNT,
  celsiusForTickIndex,
  celsiusToDisplay,
  tickIndexForCelsius,
  tickIndexForLocalPoint,
} from '@/lib/util/dial-math';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface TemperatureDialProps {
  currentTemperatureCelsius: number;
  targetTemperatureCelsius: number;
  mode: DeviceMode;
  displayUnit: 'C' | 'F';
  /** Diameter in logical px; defaults to the §10.3 240dp target. */
  diameter?: number;
  /** Optional tween duration override; defaults to 400ms. */
  animationDurationMs?: number;
  /** Pan-update callback (parent owns optimistic state). */
  onDragUpdate?: (celsius: number) => void;
  /** Pan-end callback (parent debounces 250ms then POSTs). */
  onDragEnd?: (celsius: number) => void;
  /** Tap callback (parent treats as both update + commit). */
  onTap?: (celsius: number) => void;
  /** Accessibility increase/decrease. */
  onIncrease?: () => void;
  onDecrease?: () => void;
}

export function TemperatureDial({
  currentTemperatureCelsius,
  targetTemperatureCelsius,
  mode,
  displayUnit,
  diameter = PREFERRED_DIAMETER,
  animationDurationMs = 400,
  onDragUpdate,
  onDragEnd,
  onTap,
  onIncrease,
  onDecrease,
}: TemperatureDialProps) {
  const interactive = !!(onDragUpdate || onDragEnd || onTap);
  const targetIndex = tickIndexForCelsius(targetTemperatureCelsius);
  const currentIndex = tickIndexForCelsius(currentTemperatureCelsius);

  // Animated target index. Drives the tick painter's "fill cursor".
  const animatedTarget = useSharedValue(targetIndex);
  useEffect(() => {
    animatedTarget.value = withTiming(targetIndex, {
      duration: animationDurationMs,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    });
  }, [targetIndex, animationDurationMs, animatedTarget]);

  // Re-render the React tree when the tween crosses an integer tick so
  // we can re-emit the SVG <Line>s with the right stroke colors. The
  // shared-value -> JS bridge fires only on integer transitions.
  const [animatedActive, setAnimatedActive] = useState<number>(targetIndex);
  useAnimatedReaction(
    () => Math.round(animatedTarget.value),
    (next, prev) => {
      if (next !== prev) {
        runOnJS(setAnimatedActive)(next);
      }
    },
    [],
  );

  // For haptic throttling and last-celsius bookkeeping.
  const lastHapticTick = useRef<number | null>(null);
  const lastDragCelsius = useRef<number | null>(null);

  function maybeHaptic(tick: number) {
    if (lastHapticTick.current === tick) return;
    lastHapticTick.current = tick;
    throttledSelectionClick();
  }

  function dispatchPan(x: number, y: number) {
    const tick = tickIndexForLocalPoint(x, y, diameter);
    if (tick == null) return;
    const celsius = celsiusForTickIndex(tick);
    lastDragCelsius.current = celsius;
    maybeHaptic(tick);
    onDragUpdate?.(celsius);
  }

  function dispatchPanEnd() {
    const c = lastDragCelsius.current;
    lastDragCelsius.current = null;
    if (c == null) return;
    onDragEnd?.(c);
  }

  function dispatchTap(x: number, y: number) {
    const tick = tickIndexForLocalPoint(x, y, diameter);
    if (tick == null) return;
    const celsius = celsiusForTickIndex(tick);
    maybeHaptic(tick);
    onDragUpdate?.(celsius);
    onTap?.(celsius);
  }

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => runOnJS(dispatchPan)(e.x, e.y))
        .onUpdate((e) => runOnJS(dispatchPan)(e.x, e.y))
        .onEnd(() => runOnJS(dispatchPanEnd)())
        .onFinalize(() => runOnJS(dispatchPanEnd)()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [diameter, onDragUpdate, onDragEnd],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((e, success) => {
        if (!success) return;
        runOnJS(dispatchTap)(e.x, e.y);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [diameter, onTap],
  );

  const gesture = useMemo(
    () => Gesture.Race(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  const targetDisplay = celsiusToDisplay(targetTemperatureCelsius, displayUnit);
  const currentDisplay = celsiusToDisplay(
    currentTemperatureCelsius,
    displayUnit,
  );

  const ticks = renderTicks({
    diameter,
    animatedActive,
    currentIndex,
    mode,
  });

  const a11yActions = interactive
    ? [
        { name: 'increment' as const, label: 'increase target' },
        { name: 'decrement' as const, label: 'decrease target' },
      ]
    : undefined;

  function handleA11yAction(event: AccessibilityActionEvent) {
    switch (event.nativeEvent.actionName) {
      case 'increment':
        onIncrease?.();
        break;
      case 'decrement':
        onDecrease?.();
        break;
    }
  }

  const body = (
    <View
      style={[styles.dial, { width: diameter, height: diameter }]}
      accessibilityRole={interactive ? 'adjustable' : undefined}
      accessibilityValue={{
        text: `${Math.round(targetDisplay)} degrees ${displayUnit === 'F' ? 'Fahrenheit' : 'Celsius'}`,
      }}
      accessibilityActions={a11yActions}
      onAccessibilityAction={interactive ? handleA11yAction : undefined}
    >
      <Svg width={diameter} height={diameter}>
        <Defs>
          <SvgGradient
            id="dial-active"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop
              offset="0%"
              stopColor={gradientColorsFor(mode)[0]}
              stopOpacity="1"
            />
            <Stop
              offset="100%"
              stopColor={gradientColorsFor(mode)[1]}
              stopOpacity="1"
            />
          </SvgGradient>
        </Defs>
        {ticks}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={EmberTypography.displayLarge()}>
          {Math.round(targetDisplay)}°
        </Text>
        <Text style={EmberTypography.bodyMediumItalic()}>
          Currently {Math.round(currentDisplay)}°
        </Text>
      </View>
    </View>
  );

  if (!interactive) return body;
  return <GestureDetector gesture={gesture}>{body}</GestureDetector>;
}

function renderTicks({
  diameter,
  animatedActive,
  currentIndex,
  mode,
}: {
  diameter: number;
  animatedActive: number;
  currentIndex: number;
  mode: DeviceMode;
}) {
  const center = diameter / 2;
  const radius = diameter / 2;
  const tickOuter = radius - 6;
  const tickInner = tickOuter - radius * 0.1;
  const stepRadians = ARC_SWEEP / (TICK_COUNT - 1);
  const grad = gradientColorsFor(mode);

  const lines: React.ReactNode[] = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const theta = ARC_START + i * stepRadians;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const ox = center + tickOuter * cosT;
    const oy = center + tickOuter * sinT;
    const ix = center + tickInner * cosT;
    const iy = center + tickInner * sinT;
    const isActive = i <= animatedActive;
    const t = i / (TICK_COUNT - 1);
    const color = isActive ? lerpColor(grad[0], grad[1], t) : 'rgba(255,255,255,0.06)';
    lines.push(
      <Line
        key={i}
        x1={ix}
        y1={iy}
        x2={ox}
        y2={oy}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />,
    );
    if (i === currentIndex) {
      lines.push(
        <Line
          key={`${i}-current`}
          x1={ix}
          y1={iy}
          x2={ox}
          y2={oy}
          stroke={Colors.textPrimary}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.95}
        />,
      );
    }
  }
  return lines;
}

function gradientColorsFor(mode: DeviceMode): readonly [string, string] {
  switch (mode) {
    case 'heat':
    case 'emergency':
      return [Colors.heatGradient[0], Colors.heatGradient[1]] as const;
    case 'cool':
      return [Colors.coolGradient[0], Colors.coolGradient[1]] as const;
    case 'heatCool':
    case 'off':
      return [Colors.neutralGradient[0], Colors.neutralGradient[1]] as const;
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
  if (!match) return null;
  let h = match[1];
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

const styles = StyleSheet.create({
  dial: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    pointerEvents: 'box-none',
  },
});

// Re-exports for the InteractiveTemperatureDial wrapper.
export { tickIndexForCelsius, celsiusForTickIndex, MIN_CELSIUS, MAX_CELSIUS, TICK_COUNT };
