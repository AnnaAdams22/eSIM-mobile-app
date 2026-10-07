import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function InstallGuideScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('installGuide.title')} showHeader />;
}
