import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function EsimsScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('esims.title')} />;
}
