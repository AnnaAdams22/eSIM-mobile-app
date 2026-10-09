/**
 * Profile tab.
 *  - Signed out: a card inviting the user to sign in or create an account.
 *  - Signed in:  avatar initials, name and email, plus a Sign out button (with a
 *    confirmation dialog). The full profile menu is a later task.
 *  - Loading:    lightweight skeletons while the session is read from storage.
 */

import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, Skeleton, Text } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useTheme, type Theme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { status, user, displayName, signOut } = useAuth();

  if (status === 'loading') {
    return (
      <Screen>
        <Text variant="display" style={{ marginBottom: theme.spacing.xl }}>
          {t('profile.title')}
        </Text>
        <Skeleton height={88} radius="lg" />
      </Screen>
    );
  }

  if (status === 'signedOut') {
    return (
      <Screen>
        <Text variant="display" style={{ marginBottom: theme.spacing.xl }}>
          {t('profile.title')}
        </Text>
        <Card>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="h2">{t('auth.signedOut.profileTitle')}</Text>
            <Text variant="bodySmall" color="textSecondary">
              {t('auth.signedOut.profileBody')}
            </Text>
          </View>
          <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
            <Button label={t('auth.signIn')} onPress={() => router.push({ pathname: '/(auth)/sign-in' })} />
            <Button
              label={t('auth.signUp')}
              variant="secondary"
              onPress={() => router.push({ pathname: '/(auth)/sign-up' })}
            />
          </View>
        </Card>
      </Screen>
    );
  }

  // Signed in.
  const name = displayName ?? '';
  const email = user?.email ?? '';

  const confirmSignOut = () => {
    Alert.alert(t('profile.signOutConfirmTitle'), t('profile.signOutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signOutConfirm'), style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen>
      <Text variant="display" style={{ marginBottom: theme.spacing.xl }}>
        {t('profile.title')}
      </Text>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View style={avatar(theme)} accessible accessibilityLabel={name || email}>
            <Text variant="h2" color="onPrimary">
              {initials(name, email)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            {name ? (
              <Text variant="h2" numberOfLines={1}>
                {name}
              </Text>
            ) : null}
            {email ? (
              <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
                {email}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>

      <Button
        label={t('profile.signOut')}
        variant="secondary"
        onPress={confirmSignOut}
        style={{ marginTop: theme.spacing.xl }}
      />
    </Screen>
  );
}

/** Two-letter initials from the name, falling back to the email. */
function initials(name: string, email: string): string {
  const src = name.trim();
  if (src) {
    const parts = src.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return src.slice(0, 2).toUpperCase();
  }
  const handle = email.trim();
  return handle ? handle.slice(0, 2).toUpperCase() : '?';
}

function avatar(theme: Theme) {
  return {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}
