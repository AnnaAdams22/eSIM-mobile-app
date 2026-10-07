import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function SignUpScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('auth.signUpTitle')} showHeader />;
}
