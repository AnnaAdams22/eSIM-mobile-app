/**
 * Delete account (an Apple requirement; reachable from Profile).
 *
 * Explains in plain language what deletion does, then requires the user to type
 * DELETE to enable the destructive button. Calls DELETE /api/me with
 * { confirm: "DELETE" } and handles the 409 orders_in_progress, network and
 * generic failures. On success: sign out locally (which clears the React Query
 * cache and the Supabase session), return to Home, and confirm with a toast.
 *
 * Apple requirement (Guideline 5.1.1(v)): a user who signed in with Apple must
 * have their Apple tokens revoked on deletion. For those users we re-authenticate
 * with Apple FIRST to get a fresh authorization code and forward it on
 * DELETE /api/me, so the backend can revoke. If the user cancels the Apple
 * prompt we do NOT delete (and explain why, with a retry). If Apple errors (not a
 * cancel) we continue without a code — the backend still revokes a stored token
 * if one exists, and a revoke failure never blocks deletion. Non-Apple users are
 * unaffected.
 */

import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react-native';

import { Header, Screen, Text, TextField, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { hasAppleIdentity, isDeleteConfirmed, resolveAppleReauth } from '@/features/account';
import { reauthenticateWithApple } from '@/features/auth/social/apple';
import { api, ApiError } from '@/lib/api';
import { errorNotify, successNotify } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function DeleteAccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const { signOut, user } = useAuth();
  const needsAppleReauth = hasAppleIdentity(user);

  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const enabled = isDeleteConfirmed(confirmText) && !deleting;
  const bullets = t('deleteAccount.bullets', { returnObjects: true }) as unknown as string[];

  const onDelete = async () => {
    if (!isDeleteConfirmed(confirmText)) return;
    setError(null);
    setDeleting(true);
    try {
      // Apple users: re-authenticate with Apple to get a fresh authorization code
      // for server-side token revocation. Cancel → do not delete; error → delete
      // without a code (the backend revokes a stored token if one exists).
      let appleAuthorizationCode: string | null = null;
      if (needsAppleReauth) {
        const decision = resolveAppleReauth(await reauthenticateWithApple());
        if (!decision.proceed) {
          setError(t('deleteAccount.errors.appleCancelled'));
          setDeleting(false);
          return;
        }
        appleAuthorizationCode = decision.code;
      }

      await api.deleteAccount(appleAuthorizationCode);
      // Leave this protected screen for Home BEFORE clearing auth, so the
      // central guard doesn't bounce the teardown to sign-in — a deletion should
      // land on Home. Then sign out (clears the session + React Query cache).
      router.replace('/');
      await signOut();
      successNotify();
      toast.show(t('deleteAccount.success'), { tone: 'success' });
    } catch (err) {
      errorNotify();
      setError(t(messageKeyFor(err)));
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <Header title={t('deleteAccount.title')} />

      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.discountSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.lg,
        }}
        accessible={false}
      >
        <TriangleAlert size={26} color={theme.colors.danger} />
      </View>

      <Text variant="h1" accessibilityRole="header" style={{ marginBottom: theme.spacing.md }}>
        {t('deleteAccount.heading')}
      </Text>
      <Text variant="body" color="textSecondary" style={{ marginBottom: theme.spacing.lg }}>
        {t('deleteAccount.intro')}
      </Text>

      <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
        {bullets.map((line, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Text variant="body" color="textSecondary" accessible={false}>
              •
            </Text>
            <Text variant="body" color="textSecondary" style={{ flex: 1 }}>
              {line}
            </Text>
          </View>
        ))}
      </View>

      <TextField
        label={t('deleteAccount.confirmLabel')}
        placeholder={t('deleteAccount.confirmPlaceholder')}
        value={confirmText}
        onChangeText={(v) => {
          setConfirmText(v);
          if (error) setError(null);
        }}
        error={error}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!deleting}
        containerStyle={{ marginBottom: theme.spacing.xl }}
      />

      <Pressable
        onPress={onDelete}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel={t('deleteAccount.button')}
        accessibilityState={{ disabled: !enabled, busy: deleting }}
        style={({ pressed }) => ({
          minHeight: 54,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: !enabled ? 0.45 : pressed ? 0.85 : 1,
        })}
      >
        {deleting ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text variant="button" color="onPrimary">
            {t('deleteAccount.button')}
          </Text>
        )}
      </Pressable>
    </Screen>
  );
}

/** Map a delete failure to a friendly i18n key. */
function messageKeyFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409 || err.code === 'orders_in_progress') {
      return 'deleteAccount.errors.ordersInProgress';
    }
    return 'deleteAccount.errors.generic';
  }
  const name = (err as { name?: string })?.name;
  if (name === 'TimeoutError') return 'deleteAccount.errors.network';
  const msg = ((err as { message?: string })?.message ?? '').toLowerCase();
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timed out')) {
    return 'deleteAccount.errors.network';
  }
  return 'deleteAccount.errors.generic';
}
