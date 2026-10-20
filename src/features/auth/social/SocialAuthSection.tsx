/**
 * The social sign-in block shown ABOVE the email form on the Sign in and Create
 * account screens: the visible provider buttons ("Continue with Google" / Apple)
 * followed by an "or" divider. Which buttons appear is the pure `socialProviders
 * Visible` decision (platform × configured × Apple-enabled). Renders nothing (no
 * divider) when no provider is available, so the email form stands alone.
 */

import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { socialConfig } from './config';
import { socialProvidersVisible, anySocialVisible, type SocialPlatform } from './visibility';
import { useSocialSignIn } from './useSocialSignIn';
import { GoogleButton } from './components/GoogleButton';
import { AppleButton } from './components/AppleButton';

function currentPlatform(): SocialPlatform {
  return Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
}

export interface SocialAuthSectionProps {
  /** Validated internal redirect to honour after sign-in (same as the email form). */
  redirect?: string;
}

export function SocialAuthSection({ redirect }: SocialAuthSectionProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const visibility = socialProvidersVisible({
    platform: currentPlatform(),
    googleConfigured: socialConfig.googleConfigured,
    appleEnabled: socialConfig.appleSignInEnabled,
  });

  const { submitting, errorKey, signInGoogle, signInApple } = useSocialSignIn();

  if (!anySocialVisible(visibility)) return null;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {visibility.apple ? (
        <AppleButton
          onPress={() => signInApple(redirect)}
          disabled={submitting !== null}
        />
      ) : null}

      {visibility.google ? (
        <GoogleButton
          label={t('auth.social.continueWithGoogle')}
          onPress={() => signInGoogle(redirect)}
          loading={submitting === 'google'}
          disabled={submitting !== null}
        />
      ) : null}

      {errorKey ? (
        <Text variant="bodySmall" color="danger" accessibilityLiveRegion="polite">
          {t(errorKey)}
        </Text>
      ) : null}

      {/* "or" divider between the social buttons and the email form. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          marginVertical: theme.spacing.xs,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
        <Text variant="caption" color="textSecondary">
          {t('auth.social.or')}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
      </View>
    </View>
  );
}
