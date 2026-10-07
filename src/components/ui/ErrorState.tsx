/**
 * ErrorState — a centred error placeholder with a retry action. Explains what to
 * do, in the interface's voice; it does not apologise or stay vague.
 */

import { View, type StyleProp, type ViewStyle } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export interface ErrorStateProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({ title, body, onRetry, retryLabel, style }: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: theme.spacing.huge,
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      <TriangleAlert size={40} color={theme.colors.textSecondary} />
      <Text variant="h2" center>
        {title ?? t('states.errorTitle')}
      </Text>
      <Text variant="body" color="textSecondary" center style={{ maxWidth: 300 }}>
        {body ?? t('states.errorBody')}
      </Text>
      {onRetry ? (
        <Button
          label={retryLabel ?? t('common.retry')}
          variant="secondary"
          onPress={onRetry}
          fullWidth={false}
          style={{ marginTop: theme.spacing.sm }}
        />
      ) : null}
    </View>
  );
}
