/**
 * UsageMeter — a calm, accessible data-usage bar.
 *
 * Renders the fraction of a plan's data already used as a rounded fill on a muted
 * track. A null fraction (unknown total) shows an empty track so we never draw a
 * misleading bar. The whole control carries a single spoken label supplied by the
 * caller (e.g. "620 MB used of 1 GB") rather than exposing the raw geometry.
 */

import { View } from 'react-native';

import { useTheme } from '@/theme';

export interface UsageMeterProps {
  /** Share used, in [0, 1]; null when the total is unknown. */
  fraction: number | null;
  /** Spoken description of the usage, e.g. "620 MB used of 1 GB". */
  accessibilityLabel: string;
  /** Bar height in points. */
  height?: number;
  /**
   * Unlimited plan: there is no meaningful percentage, so render a calm, full
   * bar (never a progress value) instead of a misleading fill.
   */
  unlimited?: boolean;
}

export function UsageMeter({ fraction, accessibilityLabel, height = 10, unlimited = false }: UsageMeterProps) {
  const theme = useTheme();

  // Unlimited: no percentage to convey — a full, calm navy bar, not a progressbar.
  if (unlimited) {
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.surfaceMuted,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: '100%',
            height: '100%',
            borderRadius: height / 2,
            backgroundColor: theme.colors.primary,
          }}
        />
      </View>
    );
  }

  const clamped = fraction == null ? 0 : Math.min(1, Math.max(0, fraction));
  // Red once nearly depleted, so "almost out" reads at a glance; navy otherwise.
  const fillColor = clamped >= 0.9 ? theme.colors.discount : theme.colors.primary;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: theme.colors.surfaceMuted,
        overflow: 'hidden',
      }}
    >
      {clamped > 0 ? (
        <View
          style={{
            width: `${clamped * 100}%`,
            height: '100%',
            borderRadius: height / 2,
            backgroundColor: fillColor,
          }}
        />
      ) : null}
    </View>
  );
}
