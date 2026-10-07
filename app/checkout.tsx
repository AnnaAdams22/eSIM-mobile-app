import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('checkout.title')} showHeader />;
}
