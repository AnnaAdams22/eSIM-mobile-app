/**
 * Forgot password — three steps in one screen:
 *   1. request: enter email → a 6-digit reset code is emailed.
 *   2. reset:   enter the code + a new password (twice) → password updated.
 *   3. done:    success → back to sign in (with the new password).
 */

import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react-native';

import { Button, CodeInput, Text, TextField } from '@/components/ui';
import {
  AuthScaffold,
  CODE_LENGTH,
  PASSWORD_MIN_LENGTH,
  isCodeComplete,
  isValidEmail,
  isValidPassword,
  mapAuthError,
  passwordsMatch,
  useAuth,
} from '@/features/auth';
import { errorNotify, successNotify } from '@/lib/haptics';
import { useTheme } from '@/theme';

type Step = 'request' | 'reset' | 'done';

const RESEND_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { sendPasswordReset, resetPassword } = useAuth();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState(String(emailParam ?? ''));
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const sendCode = async () => {
    setFormError(null);
    if (!isValidEmail(email)) {
      setEmailError(t('auth.validation.email'));
      return;
    }
    setEmailError(null);
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      successNotify();
      setSecondsLeft(RESEND_SECONDS);
      setStep('reset');
    } catch (err) {
      errorNotify();
      setFormError(t(mapAuthError(err), { count: PASSWORD_MIN_LENGTH }));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (secondsLeft > 0) return;
    setFormError(null);
    try {
      await sendPasswordReset(email);
      setSecondsLeft(RESEND_SECONDS);
      successNotify();
    } catch (err) {
      errorNotify();
      setFormError(t(mapAuthError(err), { count: PASSWORD_MIN_LENGTH }));
    }
  };

  const submitReset = async () => {
    setFormError(null);
    let bad = false;
    if (!isValidPassword(password)) {
      setPasswordError(t('auth.validation.password', { count: PASSWORD_MIN_LENGTH }));
      bad = true;
    } else {
      setPasswordError(null);
    }
    if (!passwordsMatch(password, confirm)) {
      setConfirmError(t('auth.validation.passwordsMatch'));
      bad = true;
    } else {
      setConfirmError(null);
    }
    if (bad || !isCodeComplete(code)) return;

    setSubmitting(true);
    try {
      await resetPassword({ email, code, password });
      successNotify();
      setStep('done');
    } catch (err) {
      errorNotify();
      setFormError(t(mapAuthError(err), { count: PASSWORD_MIN_LENGTH }));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 3: done ──────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <AuthScaffold title={t('auth.resetDoneTitle')} showLogo={false}>
        <View style={{ alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          <CheckCircle2 size={56} color={theme.colors.success} />
          <Text variant="body" color="textSecondary" center style={{ maxWidth: 300 }}>
            {t('auth.resetDoneBody')}
          </Text>
        </View>
        <Button
          label={t('auth.backToSignIn')}
          onPress={() => router.replace({ pathname: '/(auth)/sign-in' })}
        />
      </AuthScaffold>
    );
  }

  // ── Step 2: reset ─────────────────────────────────────────────────────────
  if (step === 'reset') {
    const canSubmit =
      isCodeComplete(code) &&
      isValidPassword(password) &&
      passwordsMatch(password, confirm) &&
      !submitting;
    return (
      <AuthScaffold
        title={t('auth.resetTitle')}
        subtitle={t('auth.resetSubtitle', { email })}
        showLogo={false}
      >
        <CodeInput
          value={code}
          onChangeText={(next) => {
            setCode(next);
            if (formError) setFormError(null);
          }}
          length={CODE_LENGTH}
          label={t('auth.codeLabel')}
          autoFocus
          editable={!submitting}
        />

        <View style={{ alignItems: 'center' }}>
          {secondsLeft > 0 ? (
            <Text variant="bodySmall" color="textSecondary">
              {t('auth.resendIn', { seconds: secondsLeft })}
            </Text>
          ) : (
            <Text
              variant="bodySmall"
              color="accent"
              onPress={resend}
              accessibilityRole="link"
              accessibilityLabel={t('auth.resend')}
              style={{ fontFamily: theme.fontFamily.semibold }}
            >
              {t('auth.resend')}
            </Text>
          )}
        </View>

        <TextField
          label={t('auth.newPasswordLabel')}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          hint={t('auth.passwordHint', { count: PASSWORD_MIN_LENGTH })}
          secureToggle
          revealLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          submitBehavior="submit"
        />

        <TextField
          ref={confirmRef}
          label={t('auth.confirmPasswordLabel')}
          placeholder={t('auth.passwordPlaceholder')}
          value={confirm}
          onChangeText={setConfirm}
          error={confirmError}
          secureToggle
          revealLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submitReset}
        />

        {formError ? (
          <Text variant="bodySmall" color="danger" accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}

        <Button
          label={t('auth.resetPassword')}
          onPress={submitReset}
          loading={submitting}
          disabled={!canSubmit}
        />
      </AuthScaffold>
    );
  }

  // ── Step 1: request ───────────────────────────────────────────────────────
  return (
    <AuthScaffold title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')} showLogo={false}>
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
        returnKeyType="go"
        onSubmitEditing={sendCode}
        autoFocus
      />

      {formError ? (
        <Text variant="bodySmall" color="danger" accessibilityLiveRegion="polite">
          {formError}
        </Text>
      ) : null}

      <Button
        label={t('auth.sendCode')}
        onPress={sendCode}
        loading={submitting}
        disabled={!isValidEmail(email) || submitting}
      />
    </AuthScaffold>
  );
}
