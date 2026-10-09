/**
 * Verify email — the user enters the 6-digit code emailed on sign-up (or re-sent
 * from sign-in for an unconfirmed account). A correct code confirms the email,
 * signs the user in, and continues to the original redirect (or dismisses).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, CodeInput, Text } from '@/components/ui';
import {
  AuthScaffold,
  CODE_LENGTH,
  PASSWORD_MIN_LENGTH,
  isCodeComplete,
  mapAuthError,
  useAuth,
  useAuthNavigation,
} from '@/features/auth';
import { errorNotify, successNotify } from '@/lib/haptics';
import { useTheme } from '@/theme';

const RESEND_SECONDS = 60;

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { email = '', redirect } = useLocalSearchParams<{ email?: string; redirect?: string }>();
  const emailStr = String(email);
  const { verifyEmail, resendCode } = useAuth();
  const { finishAuth } = useAuthNavigation();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  // Guard against a double-submit when onComplete and the button both fire.
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const submit = useCallback(
    async (value: string) => {
      if (verifyingRef.current || !isCodeComplete(value)) return;
      verifyingRef.current = true;
      setSubmitting(true);
      setError(null);
      setNotice(null);
      try {
        await verifyEmail(emailStr, value);
        successNotify();
        finishAuth(redirect);
      } catch (err) {
        errorNotify();
        setError(t(mapAuthError(err), { count: PASSWORD_MIN_LENGTH }));
        setCode('');
      } finally {
        verifyingRef.current = false;
        setSubmitting(false);
      }
    },
    [emailStr, redirect, verifyEmail, finishAuth, t]
  );

  const resend = async () => {
    if (secondsLeft > 0) return;
    setError(null);
    setNotice(null);
    try {
      await resendCode(emailStr);
      setSecondsLeft(RESEND_SECONDS);
      setNotice(t('auth.resent'));
      successNotify();
    } catch (err) {
      errorNotify();
      setError(t(mapAuthError(err), { count: PASSWORD_MIN_LENGTH }));
    }
  };

  return (
    <AuthScaffold
      title={t('auth.verifyTitle')}
      subtitle={t('auth.verifySubtitle', { email: emailStr })}
      showLogo={false}
    >
      <CodeInput
        value={code}
        onChangeText={(next) => {
          setCode(next);
          if (error) setError(null);
        }}
        onComplete={submit}
        length={CODE_LENGTH}
        label={t('auth.codeLabel')}
        error={error}
        autoFocus
        editable={!submitting}
      />

      {notice ? (
        <Text variant="caption" color="success" center accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}

      <Button
        label={t('auth.verify')}
        onPress={() => submit(code)}
        loading={submitting}
        disabled={code.length < CODE_LENGTH || submitting}
      />

      <View style={{ alignItems: 'center', marginTop: theme.spacing.xs }}>
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
    </AuthScaffold>
  );
}
