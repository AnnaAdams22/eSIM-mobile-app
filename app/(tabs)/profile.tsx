/**
 * Profile tab — the account hub.
 *  - Signed out: a card inviting the user to sign in or create an account.
 *  - Signed in:  a profile card (avatar initials, name, email → Edit profile),
 *    a menu of account links, then Sign out (with a confirmation dialog) and a
 *    danger-coloured Delete account.
 *  - Loading:    lightweight skeletons while the session is read from storage.
 */

import { Alert, Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  ChevronRight,
  Globe,
  Info,
  LifeBuoy,
  Smartphone,
  SmartphoneNfc,
} from 'lucide-react-native';

import { Button, Card, Divider, ListRow, Screen, Skeleton, Text } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { lightTap } from '@/lib/haptics';
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
        <Skeleton height={260} radius="lg" style={{ marginTop: theme.spacing.lg }} />
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
  const iconColor = theme.colors.textSecondary;

  const go = (pathname: Href) => () => {
    lightTap();
    router.push(pathname);
  };

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

      {/* Profile card → Edit profile. */}
      <Card onPress={go('/account/edit')} accessibilityHint={t('profile.editHint')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View style={avatar(theme)} accessible={false}>
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
          <ChevronRight size={20} color={iconColor} />
        </View>
      </Card>

      {/* Account menu. */}
      <Card padding="xs" style={{ marginTop: theme.spacing.lg }}>
        <ListRow
          title={t('profile.menu.myEsims')}
          leading={<Smartphone size={22} color={iconColor} />}
          accessibilityHint={t('profile.menu.myEsimsHint')}
          onPress={go('/(tabs)/esims')}
          style={menuRowStyle(theme)}
        />
        <Divider inset={38} />
        <ListRow
          title={t('profile.menu.notifications')}
          leading={<Bell size={22} color={iconColor} />}
          accessibilityHint={t('profile.menu.notificationsHint')}
          onPress={go('/account/notifications')}
          style={menuRowStyle(theme)}
        />
        <Divider inset={38} />
        <ListRow
          title={t('profile.menu.language')}
          leading={<Globe size={22} color={iconColor} />}
          accessibilityHint={t('profile.menu.languageHint')}
          onPress={go('/account/language')}
          style={menuRowStyle(theme)}
        />
        <Divider inset={38} />
        <ListRow
          title={t('profile.menu.help')}
          leading={<LifeBuoy size={22} color={iconColor} />}
          accessibilityHint={t('profile.menu.helpHint')}
          onPress={go('/support')}
          style={menuRowStyle(theme)}
        />
        <Divider inset={38} />
        <ListRow
          title={t('profile.menu.install')}
          leading={<SmartphoneNfc size={22} color={iconColor} />}
          accessibilityHint={t('profile.menu.installHint')}
          onPress={go('/install-guide')}
          style={menuRowStyle(theme)}
        />
        <Divider inset={38} />
        <ListRow
          title={t('profile.menu.about')}
          leading={<Info size={22} color={iconColor} />}
          accessibilityHint={t('profile.menu.aboutHint')}
          onPress={go('/account/about')}
          style={menuRowStyle(theme)}
        />
      </Card>

      {/* Sign out + delete, visually separated at the bottom. */}
      <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Button label={t('profile.signOut')} variant="secondary" onPress={confirmSignOut} />
        <Pressable
          onPress={go('/account/delete-account')}
          accessibilityRole="button"
          accessibilityLabel={t('profile.deleteAccount')}
          accessibilityHint={t('profile.deleteAccountHint')}
          hitSlop={8}
          style={({ pressed }) => ({
            minHeight: theme.layout.minTouchTarget,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text variant="button" color="danger">
            {t('profile.deleteAccount')}
          </Text>
        </Pressable>
      </View>
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

/** Horizontal padding so menu rows breathe inside the tight-padded card. */
function menuRowStyle(theme: Theme) {
  return { paddingHorizontal: theme.spacing.md };
}
