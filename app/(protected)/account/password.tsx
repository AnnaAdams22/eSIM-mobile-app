/**
 * Change password.
 *
 * Validates locally (current required, new meets the length minimum, confirm
 * matches, new ≠ current), then re-authenticates with the current password and
 * updates it. Errors are mapped to friendly messages — including a wrong current
 * password, "same as old", weak passwords and rate limits — via the pure
 * `validatePasswordChange` / `mapPasswordChangeError` helpers.
 */

import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Header, Screen, TextField, useToast } from '@/components/ui';
import { useAuth, type PasswordChangeStage } from '@/features/auth';
import {
  PASSWORD_MIN_LENGTH,
  mapPasswordChangeError,
  validatePasswordChange,
} from '@/features/account';
import { errorNotify, successNotify } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const { changePassword } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nextRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const onSubmit = async () => {
    const invalidKey = validatePasswordChange({ current, next, confirm });
    if (invalidKey) {
      setError(t(invalidKey, { count: PASSWORD_MIN_LENGTH }));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      successNotify();
      toast.show(t('changePassword.changed'), { tone: 'success' });
      router.back();
    } catch (err) {
      errorNotify();
      const stage = (err as { stage?: PasswordChangeStage })?.stage ?? 'update';
      setError(t(mapPasswordChangeError(err, stage), { count: PASSWORD_MIN_LENGTH }));
    } finally {
      setSaving(false);
    }
  };

  const clearError = () => {
    if (error) setError(null);
  };

  return (
    <Screen>
      <Header title={t('changePassword.title')} />

      <View style={{ gap: theme.spacing.lg }}>
        <TextField
          label={t('changePassword.currentLabel')}
          placeholder={t('changePassword.currentPlaceholder')}
          value={current}
          onChangeText={(v) => {
            setCurrent(v);
            clearError();
          }}
          secureToggle
          revealLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          onSubmitEditing={() => nextRef.current?.focus()}
          editable={!saving}
        />

        <TextField
          ref={nextRef}
          label={t('changePassword.newLabel')}
          value={next}
          onChangeText={(v) => {
            setNext(v);
            clearError();
          }}
          hint={t('changePassword.hint', { count: PASSWORD_MIN_LENGTH })}
          secureToggle
          revealLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          editable={!saving}
        />

        <TextField
          ref={confirmRef}
          label={t('changePassword.confirmLabel')}
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            clearError();
          }}
          error={error}
          secureToggle
          revealLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          editable={!saving}
        />

        <Button
          label={t('changePassword.submit')}
          onPress={onSubmit}
          loading={saving}
          disabled={saving}
        />
      </View>
    </Screen>
  );
}
