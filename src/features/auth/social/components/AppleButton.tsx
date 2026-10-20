/**
 * "Continue with Apple" button — Apple's OFFICIAL button component, as required
 * by Apple's Human Interface Guidelines (you may not draw your own). Only the
 * layout (height, corner radius) is ours; the glyph, wording and colours are
 * Apple's. Rendered on iOS only (the caller gates on platform + the enabled
 * flag); returns null elsewhere so it's safe to import anywhere.
 */

import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { useTheme } from '@/theme';

export interface AppleButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function AppleButton({ onPress, disabled = false }: AppleButtonProps) {
  const theme = useTheme();

  if (Platform.OS !== 'ios') return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={theme.radii.pill}
      style={{ height: 54, alignSelf: 'stretch', opacity: disabled ? 0.45 : 1 }}
      onPress={() => {
        if (!disabled) onPress();
      }}
    />
  );
}
