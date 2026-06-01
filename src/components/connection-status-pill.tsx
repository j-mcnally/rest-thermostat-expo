/**
 * Connection-status pill. Reflects the current react-query state of
 * the devices poll: live / refetching / stale / error.
 *
 * Decoupled from upstream's `connection_status.dart` — the source of
 * truth for "are we connected" lives in react-query and the polling
 * cadence rather than a separate riverpod provider.
 */

import { StyleSheet, Text, View } from 'react-native';

import { isNleError } from '@/lib/errors/nle-error';
import { EmberTypography } from '@/lib/theme';
import * as Colors from '@/lib/theme/colors';

export type ConnectionState = 'idle' | 'live' | 'refetching' | 'stale' | 'error';

interface PillProps {
  state: ConnectionState;
  /** Optional error to colour the pill differently for auth vs net. */
  error?: unknown;
}

export function ConnectionStatusPill({ state, error }: PillProps) {
  const label = labelFor(state, error);
  const tint = tintFor(state, error);
  return (
    <View style={[styles.pill, { borderColor: tint }]}>
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <Text style={EmberTypography.labelSmall(Colors.textPrimary)}>{label}</Text>
    </View>
  );
}

function labelFor(state: ConnectionState, error: unknown): string {
  if (state === 'error') {
    if (isNleError(error)) {
      switch (error.type) {
        case 'auth':
          return 'AUTH';
        case 'network':
          return 'OFFLINE';
        case 'server':
          return 'SERVER';
        case 'rateLimit':
          return 'LIMITED';
        case 'client':
          return 'REJECTED';
        case 'parse':
          return 'BAD JSON';
      }
    }
    return 'ERROR';
  }
  switch (state) {
    case 'idle':
      return 'IDLE';
    case 'live':
      return 'LIVE';
    case 'refetching':
      return 'SYNC';
    case 'stale':
      return 'STALE';
  }
}

function tintFor(state: ConnectionState, error: unknown): string {
  if (state === 'error') {
    if (isNleError(error) && error.type === 'auth') return '#FFB07A';
    return '#FF6B6B';
  }
  if (state === 'stale') return '#FFC36B';
  if (state === 'refetching') return Colors.coolGlow;
  if (state === 'live') return Colors.eco;
  return Colors.textTertiary;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#0000004d',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
