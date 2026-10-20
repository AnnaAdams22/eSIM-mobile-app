/**
 * Shows a friendly toast when the session expires and can't be refreshed (a
 * forced sign-out from the API client). Mounted once inside the ToastProvider.
 * The auth guard handles the actual redirect; if the user was mid-checkout, the
 * protected-route redirect preserves the attempted screen so they land back on
 * it (with their plan) after signing in again.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/ui';
import { onSessionExpired } from './authEvents';

export function SessionExpiryToast() {
  const { show } = useToast();
  const { t } = useTranslation();

  useEffect(() => onSessionExpired(() => show(t('auth.sessionExpired'))), [show, t]);

  return null;
}
