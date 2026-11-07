/**
 * TopupNote — a short, calm note that explains top-up only adds the SAME plan,
 * and points a traveller who needs a different amount at buying a new eSIM.
 *
 * Shown under the "Top up" button (eSIM detail + My eSIMs card) and at the top of
 * the top-up options screen. "Buy a new eSIM" is tappable when an `onBuyNew`
 * handler is given (navigating to the same destination's plans via the
 * newEsimRoute helper); without one it stays plain text so the sentence still
 * reads naturally.
 */

import { type StyleProp, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

export interface TopupNoteProps {
  /** Navigate to buy a new eSIM for the same destination. Omit to render plain text. */
  onBuyNew?: () => void;
  style?: StyleProp<TextStyle>;
}

export function TopupNote({ onBuyNew, style }: TopupNoteProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Text variant="caption" color="textSecondary" style={style}>
      {t('topup.note')}{' '}
      {onBuyNew ? (
        <Text
          variant="caption"
          color="primary"
          onPress={onBuyNew}
          accessibilityRole="link"
          style={{ fontFamily: theme.fontFamily.semibold }}
        >
          {t('topup.buyNewEsim')}
        </Text>
      ) : (
        <Text variant="caption" color="textSecondary">
          {t('topup.buyNewEsim')}
        </Text>
      )}
    </Text>
  );
}
