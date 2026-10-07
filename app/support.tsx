import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function SupportScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('support.title')} showHeader />;
}
