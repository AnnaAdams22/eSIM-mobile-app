/**
 * NotificationsProvider — the runtime glue for push notifications.
 *
 * Responsibilities (the decisions themselves live in the pure modules):
 *  - set the foreground banner handler + create the Android alerts channel;
 *  - keep the backend device registration in sync (register when signed in &
 *    permission granted & not user-disabled; deregister otherwise), reacting to
 *    auth, permission, token rotation, language and app foregrounding;
 *  - deregister BEFORE sign-out (via the before-sign-out hook) so DELETE
 *    /api/me/devices is still authenticated;
 *  - route a notification tap (foreground, background, cold start) to the eSIM,
 *    and refetch that eSIM's usage.
 *
 * It exposes a small context for the Notifications screen and the Order-success
 * soft prompt. Push tokens are device identifiers and are NEVER logged in full.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { esimsKeys } from '@/hooks/useEsims';
import type { EsimsResponse } from '@/lib/api-types';
import { registerBeforeSignOut, useAuth } from '@/features/auth';

import { decideNotificationRoute } from './routing';
import { nextRegistration, type RegisteredSnapshot } from './register';
import type { PushPermission } from './prompt';
import {
  devicePlatform,
  ensureAndroidChannel,
  getPermissionStatus,
  getPushToken,
  requestPermission,
  Notifications,
} from './push';
import { getNotifPrefs, setUserDisabled as persistUserDisabled } from './store';

interface NotificationsContextValue {
  /** Current OS permission status. */
  permission: PushPermission;
  /** The user's explicit "off" choice on the Notifications screen. */
  userDisabled: boolean;
  /** True when the device is currently registered with the backend. */
  isRegistered: boolean;
  /** Effective on/off state the toggle shows. */
  isOn: boolean;
  /** Re-read the OS permission (e.g. after returning from Settings). */
  refreshPermission: () => Promise<void>;
  /** Explicit opt-in: request permission if needed, clear "off", register. */
  enable: () => Promise<PushPermission>;
  /** Explicit opt-out: remember "off" and deregister the device. */
  disable: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const [permission, setPermission] = useState<PushPermission>('undetermined');
  const [userDisabled, setUserDisabled] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Refs so the long-lived listeners/hooks (which capture once) always see the
  // current auth status; synced in an effect so we never write a ref in render.
  const statusRef = useRef(status);
  const lastRegisteredRef = useRef<RegisteredSnapshot | null>(null);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const eligibleForToken = status === 'signedIn' && permission === 'granted' && !userDisabled;

  // Load the persisted "off" choice + the current permission once.
  useEffect(() => {
    let active = true;
    (async () => {
      const prefs = await getNotifPrefs();
      const perm = await getPermissionStatus();
      if (!active) return;
      setUserDisabled(prefs.userDisabled);
      setPermission(perm);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Create/refresh the Android channel with the localised name (re-runs on
  // language change — cheap and keeps the channel name in the user's language).
  useEffect(() => {
    void ensureAndroidChannel(t('notifications.channelName'));
  }, [t, locale]);

  // Fetch the Expo push token only once we're eligible (and we don't have one).
  useEffect(() => {
    if (!eligibleForToken || token) return;
    let active = true;
    (async () => {
      const next = await getPushToken();
      if (active && next) setToken(next);
    })();
    return () => {
      active = false;
    };
  }, [eligibleForToken, token]);

  // Keep backend registration in sync with the current state. One place; the
  // pure `nextRegistration` decides the single action. Re-runs whenever any
  // input changes (auth, permission, token, language, user toggle). The backend
  // state update lands after the network round-trip, so this is a genuine sync
  // with an external system, not a cascading render.
  useEffect(() => {
    let active = true;
    (async () => {
      const permissionGranted = permission === 'granted' && !userDisabled;
      const action = nextRegistration(
        { signedIn: status === 'signedIn', permissionGranted, token, locale },
        lastRegisteredRef.current
      );

      if (action.action === 'register') {
        const platform = devicePlatform();
        if (!platform) return;
        try {
          await api.registerDevice({
            expo_push_token: action.token,
            platform,
            locale: action.locale,
          });
          lastRegisteredRef.current = { token: action.token, locale: action.locale };
          if (active) setIsRegistered(true);
        } catch {
          if (__DEV__) console.warn('[push] device register failed (will retry).');
        }
      } else if (action.action === 'deregister') {
        try {
          await api.deregisterDevice(action.token);
        } catch {
          if (__DEV__) console.warn('[push] device deregister failed.');
        }
        lastRegisteredRef.current = null;
        if (active) setIsRegistered(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [status, permission, userDisabled, token, locale]);

  const refreshPermission = useCallback(async () => {
    setPermission(await getPermissionStatus());
  }, []);

  // Deregister BEFORE the session is cleared, so the DELETE is authenticated.
  useEffect(() => {
    return registerBeforeSignOut(async () => {
      const tok = lastRegisteredRef.current?.token;
      lastRegisteredRef.current = null;
      if (tok) await api.deregisterDevice(tok);
    });
  }, []);

  // Token rotation → update state (triggers a re-register via syncRegistration).
  useEffect(() => {
    const sub = Notifications.addPushTokenListener((t2) => {
      if (t2?.data) setToken(t2.data);
    });
    return () => sub.remove();
  }, []);

  // Re-read permission when the app returns to the foreground (the user may have
  // changed it in system Settings).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refreshPermission();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Tap handling (foreground, background, cold start) ──────────────────────
  const handleResponse = useCallback((data: unknown) => {
    const cached = queryClient.getQueryData<EsimsResponse>(esimsKeys.list);
    const knownIccids = cached?.esims
      ?.map((e) => e.iccid)
      .filter((i): i is string => !!i);

    const target = decideNotificationRoute({
      data,
      signedIn: statusRef.current === 'signedIn',
      knownIccids,
    });

    if (target.type === 'esim') {
      // Refresh that eSIM's usage now that the user is opening it.
      void queryClient.invalidateQueries({ queryKey: esimsKeys.usage(target.iccid) });
      router.push({ pathname: '/esim/[iccid]', params: { iccid: target.iccid } });
    } else if (target.type === 'signin') {
      router.push({ pathname: '/(auth)/sign-in', params: { redirect: target.redirectTo } });
    } else {
      router.push('/(tabs)/esims');
    }
  }, []);

  // Taps while the app is running (foreground or background).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleResponse(response.notification.request.content.data);
    });
    return () => sub.remove();
  }, [handleResponse]);

  // Cold start: a tap that launched the app from killed. Wait until auth is
  // resolved so we don't bounce a signed-in user to sign-in.
  const handledColdStart = useRef(false);
  useEffect(() => {
    if (handledColdStart.current || status === 'loading') return;
    handledColdStart.current = true;
    (async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) handleResponse(response.notification.request.content.data);
    })();
  }, [status, handleResponse]);

  // ─── Context actions ────────────────────────────────────────────────────────
  const enable = useCallback(async (): Promise<PushPermission> => {
    const perm = await requestPermission();
    setPermission(perm);
    if (perm === 'granted') {
      await persistUserDisabled(false);
      setUserDisabled(false);
      // token + registration follow via effects.
    }
    return perm;
  }, []);

  const disable = useCallback(async () => {
    await persistUserDisabled(true);
    setUserDisabled(true);
    // syncRegistration (via the userDisabled dep) will deregister.
  }, []);

  const isOn = permission === 'granted' && !userDisabled && isRegistered;

  return (
    <NotificationsContext.Provider
      value={{
        permission,
        userDisabled,
        isRegistered,
        isOn,
        refreshPermission,
        enable,
        disable,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a <NotificationsProvider>.');
  return ctx;
}
