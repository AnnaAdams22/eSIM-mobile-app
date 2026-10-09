/**
 * Sign in — email + password. On success, returns to the `redirect` route (e.g.
 * the checkout the user came from) or simply dismisses. An unconfirmed email is
 * routed to the verification screen with a fresh code sent automatically.
 */

import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Text, TextField } from '@/components/ui';
import {
  AUTH_ERROR_KEYS,
  AuthScaffold,
  LinkRow,
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  mapAuthError,
  useAuth,
  useAuthNavigation,
} from '@/features/auth';
import { errorNotify, successNotify } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { signIn, resendCode } = useAuth();
  const { finishAuth } = useAuthNavigation();

  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = isValidEmail(email) && password.length > 0 && !submitting;

  const submit = async () => {
    setFormError(null);
    if (!isValidEmail(email)) {
      setEmailError(t('auth.validation.email'));
      return;
    }
    setEmailError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      successNotify();
      finishAuth(redirect);
    } catch (err) {
      const key = mapAuthError(err);
      errorNotify();
      if (key === AUTH_ERROR_KEYS.emailNotConfirmed) {
        // Send a fresh code and send them to verify.
        try {
          await resendCode(email);
        } catch {
          // If the resend is itself rate-limited, the verify screen can retry.
        }
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email, ...(redirect ? { redirect } : {}) },
        });
        return;
      }
      setFormError(t(key, { count: PASSWORD_MIN_LENGTH }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title={t('auth.signInTitle')}
      subtitle={t('auth.signInSubtitle')}
      footer={
        <LinkRow
          prefix={t('auth.noAccount')}
          linkLabel={t('auth.createOne')}
          onPress={() =>
            router.push({ pathname: '/(auth)/sign-up', params: redirect ? { redirect } : {} })
          }
        />
      }
    >
      <TextField
        label={t('auth.emailLabel')}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
      />

      <TextField
        ref={passwordRef}
        label={t('auth.passwordLabel')}
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        secureToggle
        revealLabel={t('auth.showPassword')}
        hideLabel={t('auth.hidePassword')}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <View style={{ alignItems: 'flex-end', marginTop: -theme.spacing.xs }}>
        <Text
          variant="bodySmall"
          color="accent"
          onPress={() =>
            router.push({ pathname: '/(auth)/forgot-password', params: email ? { email } : {} })
          }
          accessibilityRole="link"
          accessibilityLabel={t('auth.forgotPassword')}
        >
          {t('auth.forgotPassword')}
        </Text>
      </View>

      {formError ? (
        <Text variant="bodySmall" color="danger" accessibilityLiveRegion="polite">
          {formError}
        </Text>
      ) : null}

      <Button
        label={t('auth.signIn')}
        onPress={submit}
        loading={submitting}
        disabled={!canSubmit}
        accessibilityHint={t('auth.signInSubtitle')}
      />
    </AuthScaffold>
  );
}
