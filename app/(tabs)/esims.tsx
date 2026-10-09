/**
 * My eSIMs tab. Signed out → an invitation to sign in. Signed in → the
 * placeholder for now (the real list is a later task).
 */

import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react-native';

import { EmptyState, Screen } from '@/components/ui';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme';

export default function EsimsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { status } = useAuth();

  if (status === 'signedOut') {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon={<Smartphone size={44} color={theme.colors.textSecondary} />}
          title={t('auth.signedOut.esimsTitle')}
          body={t('auth.signedOut.esimsBody')}
          actionLabel={t('auth.signIn')}
          onAction={() => router.push({ pathname: '/(auth)/sign-in' })}
        />
      </Screen>
    );
  }

  return <PlaceholderScreen title={t('esims.title')} />;
}
