/**
 * DestinationThumb — a rounded-square photo thumbnail for a country, used in the
 * Home "popular destinations" rows. Falls back to the circular Flag when the
 * country has no bespoke photo, so a row never shows a broken/empty image.
 */

import { View } from 'react-native';
import { Image } from 'expo-image';

import { countryPhoto } from '@/features/catalog';
import { useTheme } from '@/theme';
import { Flag } from './Flag';

export interface DestinationThumbProps {
  iso2: string;
  flag?: string | null;
  /** Side length in points. */
  size?: number;
}

export function DestinationThumb({ iso2, flag, size = 52 }: DestinationThumbProps) {
  const theme = useTheme();
  const photo = countryPhoto(iso2);

  if (!photo) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Flag uri={flag} size={size - 8} />
      </View>
    );
  }

  return (
    <Image
      accessible={false}
      source={photo}
      style={{
        width: size,
        height: size,
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.surfaceMuted,
      }}
      contentFit="cover"
      transition={150}
    />
  );
}
