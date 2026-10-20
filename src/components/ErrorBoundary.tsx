/**
 * Root error boundary — a last-resort catch so a render-time crash shows a calm
 * "Something went wrong" screen instead of a white screen.
 *
 * Offers "Restart" (reset navigation to Home and clear the error) and a support
 * link. Errors are logged to the console only in __DEV__. It wraps the app
 * content inside the providers the fallback needs (safe-area, i18n, theme,
 * router), so the fallback itself renders reliably.
 */

import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react-native';

import { Button, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    if (__DEV__) {
      // Dev-only: surface the crash and its component stack. Never logs in prod.
      console.error('[errorBoundary]', error, info?.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorFallback onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const restart = () => {
    // Point navigation at Home first; clearing the error remounts the stack,
    // which then renders that route (expo-router holds its state above here).
    router.replace('/');
    onReset();
  };

  const contactSupport = () => {
    router.replace('/support');
    onReset();
  };

  return (
    <Screen scroll={false}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.lg,
          paddingVertical: theme.spacing.huge,
        }}
      >
        <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
          <TriangleAlert size={48} color={theme.colors.discount} accessible={false} />
          <Text variant="h2" center accessibilityRole="header">
            {t('errorBoundary.title')}
          </Text>
          <Text variant="body" color="textSecondary" center style={{ maxWidth: 320 }}>
            {t('errorBoundary.body')}
          </Text>
        </View>
        <View style={{ alignSelf: 'stretch', gap: theme.spacing.sm }}>
          <Button label={t('errorBoundary.restart')} onPress={restart} />
          <Button
            label={t('errorBoundary.support')}
            variant="secondary"
            onPress={contactSupport}
          />
        </View>
      </View>
    </Screen>
  );
}
