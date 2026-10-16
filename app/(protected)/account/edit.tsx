/**
 * Edit profile.
 *  - Change the display name (Supabase user_metadata.full_name — display only).
 *    On success we show a toast and go back; the Home greeting and profile card
 *    update immediately because `displayName` is derived from the refreshed
 *    session.
 *  - Email is read-only (changing it is a support request).
 *  - A row navigates to the dedicated Change-password screen.
 */

import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyRound } from 'lucide-react-native';

import { Button, Card, Header, ListRow, Screen, TextField, useToast } from '@/components/ui';
import { isNonEmptyName, useAuth } from '@/features/auth';
import { errorNotify, successNotify } from '@/lib/haptics';
import { useTheme } from '@/theme';

const NAME_MAX_LENGTH = 80;

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const { user, displayName, updateDisplayName } = useAuth();

  const [name, setName] = useState(displayName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<TextInput>(null);

  const email = user?.email ?? '';

  const onSave = async () => {
    const trimmed = name.trim();
    if (!isNonEmptyName(trimmed)) {
      setError(t('editProfile.validation.nameRequired'));
      nameRef.current?.focus();
      return;
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      setError(t('editProfile.validation.nameTooLong'));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await updateDisplayName(trimmed);
      successNotify();
      toast.show(t('editProfile.saved'), { tone: 'success' });
      router.back();
    } catch {
      errorNotify();
      setError(t('editProfile.errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title={t('editProfile.title')} />

      <View style={{ gap: theme.spacing.lg }}>
        <TextField
          ref={nameRef}
          label={t('editProfile.nameLabel')}
          placeholder={t('editProfile.namePlaceholder')}
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (error) setError(null);
          }}
          error={error}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          onSubmitEditing={onSave}
          editable={!saving}
        />

        <TextField
          label={t('editProfile.emailLabel')}
          value={email}
          editable={false}
          hint={t('editProfile.emailReadonlyNote')}
          selectTextOnFocus={false}
        />

        <Button
          label={t('editProfile.save')}
          onPress={onSave}
          loading={saving}
          disabled={saving}
        />
      </View>

      <Card padding="xs" style={{ marginTop: theme.spacing.xl }}>
        <ListRow
          title={t('editProfile.changePasswordRow')}
          leading={<KeyRound size={22} color={theme.colors.textSecondary} />}
          accessibilityHint={t('editProfile.changePasswordHint')}
          onPress={() => router.push({ pathname: '/account/password' })}
          style={{ paddingHorizontal: theme.spacing.md }}
        />
      </Card>
    </Screen>
  );
}
