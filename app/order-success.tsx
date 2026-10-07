import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function OrderSuccessScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('orderSuccess.title')} subtitle={t('orderSuccess.subtitle')} />;
}
