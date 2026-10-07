/**
 * Flag — a small circular country flag loaded from the backend-provided flag URL.
 * Falls back to a muted circle with a globe icon when no image is available, so a
 * missing flag never leaves a broken-image gap.
 */

import { View } from 'react-native';
import { Image } from 'expo-image';
import { Globe } from 'lucide-react-native';

import { useTheme } from '@/theme';

export interface FlagProps {
  /** Flag image URL (the backend `image` field), or null. */
  uri?: string | null;
  /** Diameter in points. */
  size?: number;
}

export function Flag({ uri, size = 36 }: FlagProps) {
  const theme = useTheme();

  const base = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden' as const,
  };

  if (!uri) {
    return (
      <View
        accessible={false}
        style={[base, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <Globe size={size * 0.55} color={theme.colors.textSecondary} />
      </View>
    );
  }

  return (
    <Image
      accessible={false}
      source={{ uri }}
      style={base}
      contentFit="cover"
      transition={120}
    />
  );
}
