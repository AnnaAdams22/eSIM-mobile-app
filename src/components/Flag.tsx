/**
 * Flag — a small circular country flag loaded from the backend-provided flag URL.
 * Falls back to a muted circle with a globe icon when no image is available, so a
 * missing flag never leaves a broken-image gap.
 */

import { useState } from 'react';
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
  // Fall back to the globe if the URL is missing OR fails to load (broken link),
  // so a flag never leaves a broken-image gap.
  const [failed, setFailed] = useState(false);

  const base = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden' as const,
    // Hairline ring so white/pale flags don't vanish against light surfaces.
    borderWidth: 1,
    borderColor: theme.colors.border,
  };

  if (!uri || failed) {
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
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
    />
  );
}
