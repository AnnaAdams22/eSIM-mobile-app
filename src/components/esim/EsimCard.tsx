/**
 * EsimCard — one eSIM in the "My eSIMs" list.
 *
 * Shows the flag + destination, the plan ("1 GB · 7 days"), a status badge and
 * signal icon, a shortened copyable ICCID, the active-until / activation line,
 * and View details / Top up actions — matching design/reference.png. Live usage
 * is supplied by the parent (fetched per-ICCID); while it loads, the date line is
 * a skeleton and the eSIM stays optimistically under Active.
 */

import { Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { Copy, SignalHigh, SignalLow } from 'lucide-react-native';

import { Badge, Button, Card, Skeleton, Text } from '@/components/ui';
import { Flag } from '@/components/Flag';
import { formatPlanLabel } from '@/features/catalog';
import { esimDisplayStatus, statusTone, type EsimDisplayStatus } from '@/features/esims';
import type { EsimListItem, EsimUsage } from '@/lib/api-types';
import { formatShortDate } from '@/lib/date';
import { lightTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

export interface EsimCardProps {
  item: EsimListItem;
  usage: EsimUsage | null;
  usageLoading: boolean;
  flag: string | null;
  title: string;
  onViewDetails: () => void;
  onTopUp: () => void;
}

/** Show the ICCID as its first and last four digits so it's recognisable but compact. */
function shortIccid(iccid: string): string {
  if (iccid.length <= 10) return iccid;
  return `${iccid.slice(0, 4)}…${iccid.slice(-4)}`;
}

export function EsimCard({
  item,
  usage,
  usageLoading,
  flag,
  title,
  onViewDetails,
  onTopUp,
}: EsimCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const status = esimDisplayStatus({ orderStatus: item.status, usage });
  const planLabel = item.plan ? formatPlanLabel(item.plan, t) : '';
  const iccid = item.iccid;
  const ready = status !== 'processing';

  const copyIccid = async () => {
    if (!iccid) return;
    await Clipboard.setStringAsync(iccid);
    lightTap();
  };

  return (
    <Card padding="lg" radius="lg" shadow="sm" style={{ gap: theme.spacing.md }}>
      {/* Header: flag, destination + plan, status + signal */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Flag uri={flag} size={40} />
        <View style={{ flex: 1 }}>
          <Text variant="h3" numberOfLines={1}>
            {title}
          </Text>
          {planLabel ? (
            <Text variant="bodySmall" color="textSecondary" numberOfLines={1} dense>
              {planLabel}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: theme.spacing.xs }}>
          <Badge label={t(`esims.status.${status}`)} tone={statusTone(status)} />
          <SignalIcon status={status} />
        </View>
      </View>

      {/* ICCID with a copy affordance */}
      {iccid ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('esims.copyIccid')}
          accessibilityHint={t('esims.copyIccidHint')}
          onPress={copyIccid}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            minHeight: theme.layout.minTouchTarget,
          }}
        >
          <Text variant="caption" color="textSecondary" dense>
            {t('esims.iccidLabel')}
          </Text>
          <Text
            variant="caption"
            color="text"
            dense
            style={{ fontFamily: theme.fontFamily.medium }}
          >
            {shortIccid(iccid)}
          </Text>
          <Copy size={14} color={theme.colors.textSecondary} />
        </Pressable>
      ) : null}

      {/* The active-until / activation line (skeleton while usage loads) */}
      <DateLine status={status} usage={usage} loading={ready && usageLoading} />

      {/* Actions — only meaningful once there's an eSIM to act on */}
      {iccid ? (
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Button
            label={t('esims.viewDetails')}
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            onPress={onViewDetails}
          />
          <Button
            label={t('esims.topUp')}
            size="md"
            style={{ flex: 1 }}
            onPress={onTopUp}
          />
        </View>
      ) : null}
    </Card>
  );
}

function SignalIcon({ status }: { status: EsimDisplayStatus }) {
  const theme = useTheme();
  if (status === 'active') {
    return <SignalHigh size={18} color={theme.colors.success} accessible={false} />;
  }
  return <SignalLow size={18} color={theme.colors.textSecondary} accessible={false} />;
}

function DateLine({
  status,
  usage,
  loading,
}: {
  status: EsimDisplayStatus;
  usage: EsimUsage | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  if (loading) {
    return <Skeleton width={160} height={14} radius="sm" />;
  }

  let text: string | null = null;
  switch (status) {
    case 'active': {
      const date = formatShortDate(usage?.expires_at);
      text = date ? t('esims.activeUntil', { date }) : null;
      break;
    }
    case 'notActivated':
      text = t('esims.activatesOnConnection');
      break;
    case 'expired': {
      const date = formatShortDate(usage?.expires_at);
      text = date ? t('esims.expiredOn', { date }) : t('esims.status.expired');
      break;
    }
    case 'processing':
      text = t('esims.setupInProgress');
      break;
    case 'refunded':
      text = t('esims.refundedNote');
      break;
    case 'failed':
      text = t('esims.failedNote');
      break;
  }

  if (!text) return null;
  return (
    <Text variant="bodySmall" color="textSecondary" dense>
      {text}
    </Text>
  );
}
