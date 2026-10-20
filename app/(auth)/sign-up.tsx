/**
 * Create account — full name, email, password (with a strength hint). On
 * success, continues to email verification (6-digit code). Terms & Privacy open
 * in an in-app browser.
 */

import { useMemo, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';

import { Button, Text, TextField } from '@/components/ui';
import {
  AuthScaffold,
  LinkRow,
  PASSWORD_MIN_LENGTH,
  isNonEmptyName,
  isValidEmail,
  isValidPassword,
  mapAuthError,
  passwordStrength,
  useAuth,
  useAuthNavigation,
} from '@/features/auth';
import { SocialAuthSection } from '@/features/auth/social';
import { legal } from '@/config';
import { errorNotify, successNotify } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { signUp } = useAuth();
  const { finishAuth } = useAuthNavigation();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const strengthColor =
    strength === 'strong' ? 'success' : strength === 'fair' ? 'accent' : 'textSecondary';

  const canSubmit =
    isNonEmptyName(name) && isValidEmail(email) && isValidPassword(password) && !submitting;

  const submit = async () => {
    setFormError(null);
    const nextErrors: { name?: string; email?: string } = {};
    if (!isNonEmptyName(name)) nextErrors.name = t('auth.validation.name');
    if (!isValidEmail(email)) nextErrors.email = t('auth.validation.email');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !isValidPassword(password)) return;

    setSubmitting(true);
    try {
      const { needsConfirmation } = await signUp({ fullName: name, email, password });
      successNotify();
      if (needsConfirmation) {
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email, ...(redirect ? { redirect } : {}) },
        });
      } else {
        finishAuth(redirect);
      }
    } catch (err) {
      errorNotify();
      setFormError(t(mapAuthError(err), { count: PASSWORD_MIN_LENGTH }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title={t('auth.signUpTitle')}
      subtitle={t('auth.signUpSubtitle')}
      footer={
        <LinkRow
          prefix={t('auth.haveAccount')}
          linkLabel={t('auth.signInLink')}
          onPress={() =>
            router.replace({ pathname: '/(auth)/sign-in', params: redirect ? { redirect } : {} })
          }
        />
      }
    >
      <SocialAuthSection redirect={redirect} />

      <TextField
        label={t('auth.fullNameLabel')}
        placeholder={t('auth.fullNamePlaceholder')}
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        submitBehavior="submit"
      />

      <TextField
        ref={emailRef}
        label={t('auth.emailLabel')}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
      />

      <View>
        <TextField
          ref={passwordRef}
          label={t('auth.passwordLabel')}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          hint={t('auth.passwordHint', { count: PASSWORD_MIN_LENGTH })}
          secureToggle
          revealLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {password.length > 0 ? (
          <Text variant="caption" color={strengthColor} style={{ marginTop: theme.spacing.xs }}>
            {t('auth.strength.label')}: {t(`auth.strength.${strength}`)}
          </Text>
        ) : null}
      </View>

      {formError ? (
        <Text variant="bodySmall" color="danger" accessibilityLiveRegion="polite">
          {formError}
        </Text>
      ) : null}

      <Button
        label={t('auth.signUp')}
        onPress={submit}
        loading={submitting}
        disabled={!canSubmit}
      />

      <Text variant="caption" color="textSecondary" center style={{ lineHeight: 18 }}>
        {t('auth.termsPrefix')}
        <Text
          variant="caption"
          color="accent"
          onPress={() => WebBrowser.openBrowserAsync(legal.termsUrl)}
          accessibilityRole="link"
          accessibilityLabel={t('auth.termsLink')}
        >
          {t('auth.termsLink')}
        </Text>
        {t('auth.termsAnd')}
        <Text
          variant="caption"
          color="accent"
          onPress={() => WebBrowser.openBrowserAsync(legal.privacyUrl)}
          accessibilityRole="link"
          accessibilityLabel={t('auth.privacyLink')}
        >
          {t('auth.privacyLink')}
        </Text>
        {t('auth.termsSuffix')}
      </Text>
    </AuthScaffold>
  );
}
