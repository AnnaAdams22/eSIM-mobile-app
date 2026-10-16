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
import { Copy, RotateCw, SignalHigh, SignalLow } from 'lucide-react-native';

import { Badge, Button, Card, Skeleton, Text } from '@/components/ui';
import { Flag } from '@/components/Flag';
import { formatPlanLabel } from '@/features/catalog';
import {
  esimDisplayStatus,
  statusTone,
  usageLineState,
  type EsimDisplayStatus,
} from '@/features/esims';
import type { EsimListItem, EsimUsage } from '@/lib/api-types';
import { formatShortDate } from '@/lib/date';
import { lightTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

export interface EsimCardProps {
  item: EsimListItem;
  usage: EsimUsage | null;
  /** A usage request is in flight (first load or a retry). */
  usageLoading: boolean;
  /** The last usage request failed (and there's no cached usage). */
  usageError?: boolean;
  /** Retry the usage request (shown with the "Usage unavailable" state). */
  onRetryUsage?: () => void;
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
  usageError = false,
  onRetryUsage,
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

      {/* The active-until / activation line (skeleton while usage loads, or a
          calm "Usage unavailable" + Retry if it failed). */}
      <DateLine
        status={status}
        usage={usage}
        loading={usageLoading}
        error={usageError}
        onRetry={onRetryUsage}
      />

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
  error,
  onRetry,
}: {
  status: EsimDisplayStatus;
  usage: EsimUsage | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  const lineState = usageLineState({
    status,
    hasUsage: !!usage,
    inFlight: loading,
    isError: error,
  });

  // Skeleton only while a request is actually in flight.
  if (lineState === 'loading') {
    return <Skeleton width={160} height={14} radius="sm" />;
  }

  // Failed usage load → a calm inline state with a small Retry (stays Active).
  if (lineState === 'error') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Text variant="bodySmall" color="textSecondary" dense>
          {t('esims.usageUnavailable')}
        </Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={t('esims.usageRetry')}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.xxs,
              minHeight: theme.layout.minTouchTarget,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <RotateCw size={13} color={theme.colors.primary} />
            <Text
              variant="caption"
              color="primary"
              dense
              style={{ fontFamily: theme.fontFamily.semibold }}
            >
              {t('esims.usageRetry')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
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
