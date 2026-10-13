/**
 * Toast — a lightweight, accessible snackbar shown briefly at the bottom of the
 * screen for confirmations ("Profile updated", "Password changed"). There's one
 * provider at the app root; any screen calls `useToast().show(message)`.
 *
 * Because it lives at the root, a toast survives navigation — e.g. "Account
 * deleted" is shown, then we replace the route to Home, and the toast persists
 * over the new screen.
 *
 * Accessibility: the message is announced to screen readers, the container is a
 * polite live region, and the dismiss affordance is a labelled button. The
 * entrance/exit animation is skipped when the OS "reduce motion" setting is on.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, X } from 'lucide-react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme';
import { Text } from './Text';

export type ToastTone = 'default' | 'success';

interface ToastOptions {
  tone?: ToastTone;
  /** How long to stay on screen, ms. Default 3200. */
  durationMs?: number;
}

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
  durationMs: number;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);

  const show = useCallback((message: string, options?: ToastOptions) => {
    idRef.current += 1;
    setToast({
      id: idRef.current,
      message,
      tone: options?.tone ?? 'default',
      durationMs: options?.durationMs ?? DEFAULT_DURATION,
    });
    AccessibilityInfo.announceForAccessibility?.(message);
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastView key={toast.id} toast={toast} onDismiss={dismiss} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();
  const [opacity] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [translateY] = useState(() => new Animated.Value(reduceMotion ? 0 : 16));

  useEffect(() => {
    if (!reduceMotion) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 4 }),
      ]).start();
    }
    const timer = setTimeout(onDismiss, toast.durationMs);
    return () => clearTimeout(timer);
  }, [opacity, translateY, reduceMotion, onDismiss, toast.durationMs]);

  const isSuccess = toast.tone === 'success';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        bottom: insets.bottom + theme.spacing.xl,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <View
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radii.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          ...theme.shadows.lg,
        }}
      >
        {isSuccess ? (
          <CheckCircle2 size={20} color={theme.colors.success} />
        ) : null}
        <Text variant="bodySmall" color="onPrimary" style={{ flex: 1 }}>
          {toast.message}
        </Text>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: theme.spacing.xxs })}
        >
          <X size={18} color={theme.colors.onPrimary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>.');
  }
  return ctx;
}
