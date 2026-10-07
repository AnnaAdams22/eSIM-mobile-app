import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/**
 * Checkout (placeholder). The shopping screens navigate here with the selected
 * `planId`; the real checkout flow is a later task.
 */
export default function CheckoutScreen() {
  const { t } = useTranslation();
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  return <PlaceholderScreen title={t('checkout.title')} subtitle={planId} showHeader />;
}
