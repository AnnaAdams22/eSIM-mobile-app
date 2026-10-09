/**
 * AuthScaffold — the shared frame for every auth screen.
 *
 * Calm/premium styling to match design/reference.png: ivory ground, the brand
 * logo, generous spacing, a close affordance (these screens are a modal, so
 * closing returns the user to wherever they were). Handles keyboard avoidance
 * and scrolling so fields are never hidden behind the keyboard.
 */

import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';

import { Logo, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export interface AuthScaffoldProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Bottom row (e.g. "Already have an account? Sign in"). */
  footer?: ReactNode;
  showLogo?: boolean;
}

export function AuthScaffold({
  title,
  subtitle,
  children,
  footer,
  showLogo = true,
}: AuthScaffoldProps) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const close = () => {
    if (router.canDismiss?.()) router.dismissAll();
    else if (router.canGoBack()) router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Close button */}
        <View
          style={{
            paddingHorizontal: theme.layout.screenPadding,
            paddingTop: theme.spacing.sm,
            alignItems: 'flex-end',
          }}
        >
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={t('auth.close')}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surfaceMuted,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <X size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.layout.screenPadding,
            paddingBottom: theme.spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showLogo ? (
            <View style={{ alignItems: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing.xl }}>
              <Logo variant="full" size={44} />
            </View>
          ) : null}

          <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.xl }}>
            <Text variant="display" accessibilityRole="header" style={{ fontSize: 24, lineHeight: 30 }}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="body" color="textSecondary">
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={{ gap: theme.spacing.lg }}>{children}</View>

          {footer ? <View style={{ marginTop: theme.spacing.xl }}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
