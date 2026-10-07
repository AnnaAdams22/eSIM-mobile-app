import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function EsimDetailScreen() {
  const { iccid } = useLocalSearchParams<{ iccid: string }>();
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('esimDetail.title')} subtitle={iccid} showHeader />;
}
