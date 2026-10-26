/**
 * Checkout — the native Stripe payment flow.
 *
 * Reached (auth-gated) from Destination detail → "Buy now" with the selected
 * `planId`. Shows a plan summary, an optional promo code, a server-computed order
 * summary, and a navy "Pay now · €X.XX" button that drives Stripe's PaymentSheet.
 *
 * Prices are NEVER computed here: list price is the backend's `price_display`;
 * discount and total come from the promo/validate and payment-sheet responses
 * (formatted from the integer cents the server returned — see src/lib/money.ts).
 */

import { useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStripe } from '@stripe/stripe-react-native';
import * as WebBrowser from 'expo-web-browser';
import { Tag, X } from 'lucide-react-native';

import {
  Button,
  Card,
  ErrorState,
  Header,
  Screen,
  Skeleton,
  Text,
  TextField,
} from '@/components/ui';
import { Flag } from '@/components/Flag';
import { usePlans } from '@/hooks/usePlans';
import { useAuth } from '@/features/auth';
import {
  formatPlanLabel,
  newEsimRouteForPlan,
  resolveGeoDisplay,
  useCatalogL10n,
  type GeoResolvers,
} from '@/features/catalog';
import {
  buildPaymentSheetAppearance,
  decidePaymentOutcome,
  makeRequestIdHolder,
  promoErrorKey,
  summarizeCheckoutError,
  type CheckoutStep,
} from '@/features/checkout';
import { requestTopupSheet } from '@/features/esims';
import { api, ApiError } from '@/lib/api';
import type { Plan, PaymentSheetResponse, PromoValidation } from '@/lib/api-types';
import { config, legal } from '@/config';
import { formatPrice } from '@/lib/price';
import { errorNotify, lightTap, successNotify } from '@/lib/haptics';
import { uuidv4 } from '@/lib/uuid';
import { useTheme } from '@/theme';

/** Google Pay / Apple Pay run in Stripe's test environment unless we ship a live key. */
const STRIPE_TEST_ENV = !config.stripePublishableKey.startsWith('pk_live_');

interface AppliedPromo {
  code: string;
  discountCents: number;
  amountCents: number;
}

/** Resolve the flag + localised title for a plan from the catalog groupings. */
function planSummary(
  plans: Plan[],
  plan: Plan,
  resolvers: GeoResolvers
): { flag: string | null; title: string } {
  return resolveGeoDisplay(
    plans,
    {
      countryIso2: plan.countryIso2,
      planType: plan.plan_type,
      fallbackFlag: plan.image,
      fallbackTitle: plan.countries_included?.trim() || plan.name,
    },
    resolvers
  );
}

export default function CheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { planId, iccid } = useLocalSearchParams<{
    planId?: string;
    /** Present ⇒ this is a top-up of the given eSIM. */
    iccid?: string;
  }>();
  const isTopup = !!iccid;

  const { user } = useAuth();
  const email = user?.email ?? null;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const { lang, nameResolver, regionResolvers } = useCatalogL10n();
  const { data: plans, isLoading, isError, refetch } = usePlans();
  const plan = useMemo(() => plans?.find((p) => p.id === planId) ?? null, [plans, planId]);
  const summary = useMemo(
    () =>
      plan && plans
        ? planSummary(plans, plan, { nameResolver, regionResolvers })
        : null,
    [plan, plans, nameResolver, regionResolvers]
  );

  // One idempotency id per checkout attempt; reused across retries (same ref
  // across re-renders), reset only when the promo changes the amount.
  const requestId = useRef(makeRequestIdHolder(uuidv4)).current;

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedPromo | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  // Set when the backend rejects a top-up as a plan replacement: the app never
  // replaces, so we point the customer at buying a new eSIM instead.
  const [cannotAdd, setCannotAdd] = useState(false);
  // __DEV__ only: a compact "step · code · message" hint shown under the friendly
  // error and logged to the console. Never populated or rendered in production.
  const [devDetail, setDevDetail] = useState<string | null>(null);

  // ─── Loading / error / not-found states ──────────────────────────────────
  if (isError) {
    return (
      <Screen scroll={false}>
        <Header title={t(isTopup ? 'topup.title' : 'checkout.title')} onBack={() => router.back()} />
        <ErrorState onRetry={() => refetch()} />
      </Screen>
    );
  }
  if (isLoading) {
    return (
      <Screen>
        <Header title={t(isTopup ? 'topup.title' : 'checkout.title')} onBack={() => router.back()} />
        <Skeleton height={88} radius="lg" />
        <Skeleton height={48} radius="md" style={{ marginTop: theme.spacing.lg }} />
        <Skeleton height={120} radius="lg" style={{ marginTop: theme.spacing.lg }} />
      </Screen>
    );
  }
  if (!plan || !summary) {
    return (
      <Screen scroll={false}>
        <Header title={t(isTopup ? 'topup.title' : 'checkout.title')} onBack={() => router.back()} />
        <ErrorState
          title={t('checkout.notFoundTitle')}
          body={t('checkout.notFoundBody')}
          retryLabel={t('common.back')}
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  const planLabel = formatPlanLabel(plan, t, lang);

  // All money shown comes from the server: the amount is the server's (list price
  // in cents, or the promo response's total); we only FORMAT it for the locale.
  const totalDisplay = applied
    ? formatPrice(applied.amountCents, lang, plan.price_display)
    : formatPrice(plan.price_eur_cents, lang, plan.price_display);

  // ─── Promo code ──────────────────────────────────────────────────────────
  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code || promoChecking) return;
    lightTap();
    setPromoChecking(true);
    setPromoError(null);
    try {
      const result: PromoValidation = await api.validatePromo(plan.id, code);
      if (result.valid) {
        setApplied({
          code,
          discountCents: result.discount_cents,
          amountCents: result.amount_cents,
        });
        requestId.reset(); // amount changed → new idempotency key
      } else {
        setApplied(null);
        setPromoError(t(promoErrorKey(result.error)));
        errorNotify();
      }
    } catch {
      setPromoError(t('checkout.promoErrors.generic'));
      errorNotify();
    } finally {
      setPromoChecking(false);
    }
  };

  const removePromo = () => {
    lightTap();
    setApplied(null);
    setPromoInput('');
    setPromoError(null);
    requestId.reset(); // amount changed → new idempotency key
  };

  const goBuyNewEsim = () => {
    lightTap();
    router.replace(newEsimRouteForPlan(plan));
  };

  // ─── Pay ─────────────────────────────────────────────────────────────────
  const pay = async () => {
    if (paying) return; // double-tap guard
    lightTap();
    setPaying(true);
    setPayError(null);
    if (__DEV__) setDevDetail(null);
    // Which step we're on, so a failure can be attributed precisely in __DEV__.
    let step: CheckoutStep = 'create-sheet';
    // Captured once we have an intent, so a post-drop failure can route to polling.
    let paymentIntentId: string | undefined;
    try {
      let sheet: PaymentSheetResponse;
      if (isTopup && iccid) {
        // Top-up: always a same-plan "add data" (accept_replace:false). If the
        // backend still rejects it as a replacement, we don't replace — we point
        // the customer at buying a new eSIM instead.
        const outcome = await requestTopupSheet(
          {
            planId: plan.id,
            promoCode: applied?.code,
            clientRequestId: requestId.current(),
          },
          { createSheet: (payload) => api.createTopupPaymentSheet(iccid, payload) }
        );
        if (!outcome.ok) {
          setCannotAdd(true);
          setPaying(false);
          return;
        }
        sheet = outcome.sheet;
      } else {
        sheet = await api.createPaymentSheet({
          plan_id: plan.id,
          promo_code: applied?.code,
          client_request_id: requestId.current(),
        });
      }
      paymentIntentId = sheet.payment_intent_id;

      step = 'init';
      const init = await initPaymentSheet({
        merchantDisplayName: 'ESIM Global',
        paymentIntentClientSecret: sheet.payment_intent_client_secret,
        customerId: sheet.customer_id,
        customerSessionClientSecret: sheet.customer_session_client_secret,
        returnURL: 'esimglobal://stripe-redirect',
        googlePay: {
          merchantCountryCode: 'US',
          currencyCode: 'EUR',
          testEnv: STRIPE_TEST_ENV,
        },
        applePay: { merchantCountryCode: 'US' },
        defaultBillingDetails: email ? { email } : undefined,
        appearance: buildPaymentSheetAppearance(theme),
      });
      if (init.error) throw init.error;

      step = 'present';
      const result = await presentPaymentSheet();
      if (result.error) {
        // User dismissed the sheet — stay quietly on checkout, keep the id for retry.
        if (result.didCancel || result.error.code === 'Canceled') {
          setPaying(false);
          return;
        }
        throw result.error;
      }

      // Paid. Replace history so "back" can't return to the paid checkout.
      successNotify();
      router.replace({
        pathname: '/order-success',
        params: {
          paymentIntentId: sheet.payment_intent_id,
          flag: summary.flag ?? '',
          title: summary.title,
          planLabel,
          ...(isTopup && iccid ? { mode: 'topup', iccid } : {}),
        },
      });
    } catch (err) {
      // If connectivity dropped AFTER the sheet was presented, the payment may
      // have gone through — go to order-success polling (which reads the real
      // backend state) instead of suggesting a retry that could double-submit.
      if (
        decidePaymentOutcome({ step, error: err, hasPaymentIntentId: !!paymentIntentId }) ===
          'poll' &&
        paymentIntentId
      ) {
        router.replace({
          pathname: '/order-success',
          params: {
            paymentIntentId,
            flag: summary.flag ?? '',
            title: summary.title,
            planLabel,
            ...(isTopup && iccid ? { mode: 'topup', iccid } : {}),
          },
        });
        return;
      }
      errorNotify();
      // __DEV__ only: surface the real failure (step + status/code/message) in the
      // console and under the friendly message. Secret-free — see summarizeCheckoutError.
      if (__DEV__) {
        const detail = summarizeCheckoutError(step, err);
        console.warn(`[checkout] ${detail}`);
        setDevDetail(detail);
      }
      const message =
        err instanceof ApiError ? err.message : t('checkout.errorGeneric');
      setPayError(message || t('checkout.errorGeneric'));
      setPaying(false);
    }
  };

  return (
    // Top safe-area inset so the Header clears the status bar (the sticky Pay bar
    // below handles the bottom inset itself). Mirrors how <Screen> insets its top.
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingBottom: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Header title={t(isTopup ? 'topup.title' : 'checkout.title')} onBack={() => router.back()} />

        {/* Plan summary */}
        <Card padding="lg" radius="lg" shadow="sm">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Flag uri={summary.flag} size={44} />
            <View style={{ flex: 1 }}>
              <Text variant="h3" numberOfLines={2}>
                {summary.title}
              </Text>
              <Text
                variant="bodySmall"
                color="textSecondary"
                style={{ marginTop: 2 }}
                numberOfLines={1}
              >
                {planLabel}
              </Text>
            </View>
            <Text
              variant="h3"
              numberOfLines={1}
              style={{ fontFamily: theme.fontFamily.semibold, flexShrink: 0 }}
            >
              {formatPrice(plan.price_eur_cents, lang, plan.price_display)}
            </Text>
          </View>
        </Card>

        {/* Receipt line */}
        {email ? (
          <Text
            variant="caption"
            color="textSecondary"
            style={{ marginTop: theme.spacing.md }}
          >
            {t('checkout.receipt', { email })}
          </Text>
        ) : null}

        {/* Promo code */}
        <PromoSection
          open={promoOpen}
          onToggle={() => {
            lightTap();
            setPromoOpen((v) => !v);
          }}
          input={promoInput}
          onInput={setPromoInput}
          checking={promoChecking}
          error={promoError}
          applied={applied}
          onApply={applyPromo}
          onRemove={removePromo}
        />

        {/* Order summary */}
        <Text
          variant="h2"
          accessibilityRole="header"
          style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}
        >
          {t('checkout.summaryTitle')}
        </Text>
        <Card padding="lg" radius="lg" shadow="sm">
          <SummaryRow
            label={t('checkout.priceLabel')}
            value={formatPrice(plan.price_eur_cents, lang, plan.price_display)}
          />
          {applied ? (
            <SummaryRow
              label={t('checkout.discountLabel')}
              value={formatPrice(-applied.discountCents, lang)}
              tone="discount"
            />
          ) : null}
          <View
            style={{
              height: 1,
              backgroundColor: theme.colors.border,
              marginVertical: theme.spacing.md,
            }}
          />
          <SummaryRow label={t('checkout.totalLabel')} value={totalDisplay} emphasize />
        </Card>

        {cannotAdd ? (
          <View
            accessibilityLiveRegion="polite"
            style={{
              marginTop: theme.spacing.lg,
              padding: theme.spacing.lg,
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.surfaceMuted,
              gap: theme.spacing.sm,
            }}
          >
            <Text variant="h3" accessibilityRole="header">
              {t('checkout.cannotAddTitle')}
            </Text>
            <Text variant="bodySmall" color="textSecondary">
              {t('checkout.cannotAddBody')}
            </Text>
            <Button
              label={t('checkout.cannotAddAction')}
              onPress={goBuyNewEsim}
              style={{ marginTop: theme.spacing.xs }}
            />
          </View>
        ) : null}

        {payError ? (
          <View
            accessibilityLiveRegion="polite"
            style={{
              marginTop: theme.spacing.lg,
              padding: theme.spacing.md,
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.discountSoft,
            }}
          >
            <Text variant="caption" color="discountText" style={{ fontFamily: theme.fontFamily.semibold }}>
              {t('checkout.errorTitle')}
            </Text>
            <Text variant="bodySmall" color="text" style={{ marginTop: 2 }}>
              {payError}
            </Text>
            {__DEV__ && devDetail ? (
              <Text
                variant="caption"
                color="textSecondary"
                style={{ marginTop: theme.spacing.xs, fontFamily: theme.fontFamily.regular }}
              >
                {devDetail}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Pay bar above the system navigation bar. Hidden once a top-up is
          rejected as a replacement — the "buy a new eSIM" action takes over. */}
      {cannotAdd ? null : (
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingHorizontal: theme.layout.screenPadding,
            paddingBottom: insets.bottom + theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          }}
        >
          <Button
            label={paying ? t('checkout.paying') : t('checkout.payNow', { price: totalDisplay })}
            onPress={pay}
            loading={paying}
            disabled={paying}
            accessibilityHint={t('checkout.payNow', { price: totalDisplay })}
          />
          <Text
            variant="caption"
            color="textSecondary"
            center
            style={{ marginTop: theme.spacing.sm }}
          >
            {t('auth.termsPrefix')}
            <Text
              variant="caption"
              color="accent"
              onPress={() => WebBrowser.openBrowserAsync(legal.termsUrl)}
              accessibilityRole="link"
              accessibilityLabel={t('auth.termsLink')}
            >
              {t('auth.termsLink')}
            </Text>
            {t('auth.termsAnd')}
            <Text
              variant="caption"
              color="accent"
              onPress={() => WebBrowser.openBrowserAsync(legal.privacyUrl)}
              accessibilityRole="link"
              accessibilityLabel={t('auth.privacyLink')}
            >
              {t('auth.privacyLink')}
            </Text>
            {t('auth.termsSuffix')}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  emphasize,
  tone,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  tone?: 'discount';
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.md,
      }}
    >
      <Text variant={emphasize ? 'h3' : 'body'} color={emphasize ? 'text' : 'textSecondary'}>
        {label}
      </Text>
      <Text
        variant={emphasize ? 'h3' : 'body'}
        color={tone === 'discount' ? 'discount' : 'text'}
        style={emphasize ? { fontFamily: theme.fontFamily.semibold } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

function PromoSection({
  open,
  onToggle,
  input,
  onInput,
  checking,
  error,
  applied,
  onApply,
  onRemove,
}: {
  open: boolean;
  onToggle: () => void;
  input: string;
  onInput: (v: string) => void;
  checking: boolean;
  error: string | null;
  applied: AppliedPromo | null;
  onApply: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Once applied, show a confirmation row with a Remove action instead of the input.
  if (applied) {
    return (
      <Card padding="md" radius="md" style={{ marginTop: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Tag size={18} color={theme.colors.success} />
          <Text variant="bodySmall" color="text" style={{ flex: 1 }} numberOfLines={1}>
            {t('checkout.promoApplied', { code: applied.code })}
          </Text>
          <Button
            label={t('checkout.promoRemove')}
            variant="ghost"
            size="md"
            fullWidth={false}
            onPress={onRemove}
            accessibilityHint={t('checkout.promoRemoveHint')}
            icon={<X size={16} color={theme.colors.primary} />}
          />
        </View>
      </Card>
    );
  }

  return (
    <View style={{ marginTop: theme.spacing.lg }}>
      <Button
        label={t('checkout.promoToggle')}
        variant="ghost"
        size="md"
        fullWidth={false}
        onPress={onToggle}
        icon={<Tag size={16} color={theme.colors.primary} />}
        accessibilityHint={t('checkout.promoToggle')}
        style={{ alignSelf: 'flex-start' }}
      />
      {open ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('checkout.promoLabel')}
                placeholder={t('checkout.promoPlaceholder')}
                value={input}
                onChangeText={onInput}
                autoCapitalize="characters"
                autoCorrect={false}
                error={error}
                returnKeyType="done"
                onSubmitEditing={onApply}
                editable={!checking}
              />
            </View>
            <Button
              label={checking ? t('checkout.promoApplying') : t('checkout.promoApply')}
              variant="secondary"
              size="md"
              fullWidth={false}
              loading={checking}
              disabled={checking || input.trim().length === 0}
              onPress={onApply}
              style={{ marginBottom: error ? 26 : 2 }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
