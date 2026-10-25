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
 * Registration runs through a SINGLE instrumented `registerNow()` that records a
 * `RegistrationDiag` (so the Notifications screen can surface a real error and a
 * dev-only panel) rather than failing silently. Push tokens are device
 * identifiers and are NEVER logged in full (only a 12-char prefix, in __DEV__).
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

import { api, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { esimsKeys } from '@/hooks/useEsims';
import type { EsimsResponse } from '@/lib/api-types';
import { registerBeforeSignOut, useAuth } from '@/features/auth';

import { decideNotificationRoute } from './routing';
import type { RegisteredSnapshot } from './register';
import type { PushPermission } from './prompt';
import {
  EMPTY_DIAG,
  isValidExpoPushToken,
  type RegistrationDiag,
} from './diagnostics';
import {
  devicePlatform,
  ensureAndroidChannel,
  getExpoPushToken,
  getPermissionDetail,
  getPermissionStatus,
  isPhysicalDevice,
  requestPermissionDetail,
  resolveProjectId,
  Notifications,
} from './push';
import { getNotifPrefs, setUserDisabled as persistUserDisabled } from './store';

function devLog(message: string): void {
  if (__DEV__) console.warn(`[push] ${message}`);
}

interface NotificationsContextValue {
  /** Current OS permission status. */
  permission: PushPermission;
  /** The user's explicit "off" choice on the Notifications screen. */
  userDisabled: boolean;
  /** True when the device is currently registered with the backend. */
  isRegistered: boolean;
  /** Effective on/off state the toggle shows. */
  isOn: boolean;
  /** Diagnostics for the last registration attempt (for the dev panel + errors). */
  diag: RegistrationDiag;
  /** Re-read the OS permission (e.g. after returning from Settings). */
  refreshPermission: () => Promise<void>;
  /** Explicit opt-in: request permission if needed, clear "off", register. */
  enable: () => Promise<RegistrationDiag>;
  /** Explicit opt-out: remember "off" and deregister the device. */
  disable: () => Promise<void>;
  /** Re-attempt registration (same as enable); used by the "Retry" button. */
  retry: () => Promise<RegistrationDiag>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const [permission, setPermission] = useState<PushPermission>('undetermined');
  const [userDisabled, setUserDisabledState] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [diag, setDiag] = useState<RegistrationDiag>(EMPTY_DIAG);

  // Refs so the long-lived listeners/hooks always read current values, and the
  // registration logic never fights stale closures.
  const statusRef = useRef(status);
  const userDisabledRef = useRef(userDisabled);
  const isRegisteredRef = useRef(isRegistered);
  const lastRegisteredRef = useRef<RegisteredSnapshot | null>(null);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    userDisabledRef.current = userDisabled;
  }, [userDisabled]);
  useEffect(() => {
    isRegisteredRef.current = isRegistered;
  }, [isRegistered]);

  // Load the persisted "off" choice + the current permission once.
  useEffect(() => {
    let active = true;
    (async () => {
      const prefs = await getNotifPrefs();
      const perm = await getPermissionStatus();
      if (!active) return;
      setUserDisabledState(prefs.userDisabled);
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

  const deregisterNow = useCallback(async () => {
    const snap = lastRegisteredRef.current;
    if (!snap) return;
    try {
      await api.deregisterDevice(snap.token);
    } catch {
      devLog('deregister failed (best-effort).');
    }
    lastRegisteredRef.current = null;
    setIsRegistered(false);
  }, []);

  /**
   * One instrumented path to register this device, step by step. `prompt` is
   * true only for explicit user actions (toggle / Retry), when we may surface
   * the OS permission dialog and clear a previous "off" choice. Records a
   * RegistrationDiag either way and returns it.
   */
  const registerNow = useCallback(
    async ({ prompt }: { prompt: boolean }): Promise<RegistrationDiag> => {
      const d: RegistrationDiag = { ...EMPTY_DIAG, attemptedAt: Date.now() };
      const fail = (step: RegistrationDiag['failingStep']): RegistrationDiag => {
        d.failingStep = step;
        setDiag(d);
        devLog(`attempt failed at step=${step} code=${d.errorCode ?? '-'} msg=${d.errorMessage ?? '-'}`);
        return d;
      };

      // 1. Auth — must be signed in for the authenticated POST.
      d.signedIn = statusRef.current === 'signedIn';
      devLog(`signedIn=${d.signedIn}`);
      if (!d.signedIn) return fail('auth');

      // 2. Permission — read, and prompt only on explicit user action.
      let perm = await getPermissionDetail();
      devLog(`permission before: status=${perm.status} canAskAgain=${perm.canAskAgain}`);
      if (perm.status !== 'granted' && prompt) {
        perm = await requestPermissionDetail();
        devLog(`permission after request: status=${perm.status} canAskAgain=${perm.canAskAgain}`);
      }
      d.permission = perm.status;
      d.canAskAgain = perm.canAskAgain;
      setPermission(perm.status);
      if (prompt && perm.status === 'granted') {
        await persistUserDisabled(false);
        setUserDisabledState(false);
      }
      if (perm.status !== 'granted') return fail('permission');

      // 3. Physical device — tokens can't be minted on a simulator.
      d.isDevice = isPhysicalDevice();
      devLog(`isDevice=${d.isDevice}`);
      if (!d.isDevice) return fail('device');

      // 4. EAS projectId — required to mint the Expo token.
      d.projectId = resolveProjectId();
      devLog(`projectId=${d.projectId ?? 'MISSING'}`);
      if (!d.projectId) return fail('config');

      // 5. Mint the Expo push token.
      const result = await getExpoPushToken(d.projectId);
      if (!result.token) {
        d.errorCode = result.errorCode;
        d.errorMessage = result.errorMessage;
        devLog(`getExpoPushToken threw: code=${result.errorCode ?? '-'} msg=${result.errorMessage ?? '-'}`);
        return fail('token');
      }
      d.tokenObtained = true;
      d.tokenPrefix = result.token.slice(0, 12);
      devLog(`token obtained prefix=${d.tokenPrefix}…`);

      // 6. Token format must match the backend's validation.
      if (!isValidExpoPushToken(result.token)) return fail('token-format');

      const platform = devicePlatform();
      if (!platform) return fail('device');

      // 7. Register with the backend.
      try {
        await api.registerDevice({
          expo_push_token: result.token,
          platform,
          locale,
        });
        lastRegisteredRef.current = { token: result.token, locale };
        setIsRegistered(true);
        d.postStatus = 200;
        d.failingStep = null;
        setDiag(d);
        devLog('registered OK (POST /api/me/devices 200).');
        return d;
      } catch (err) {
        if (err instanceof ApiError) {
          d.postStatus = err.status;
          d.errorCode = err.code ?? null;
          d.errorMessage = err.message;
        } else {
          d.errorMessage = err instanceof Error ? err.message : String(err);
        }
        return fail('server');
      }
    },
    [locale]
  );

  // Keep backend registration in sync with the current state. Register when
  // eligible and not already registered (or the language changed); otherwise
  // deregister. The explicit enable()/retry() paths use registerNow({prompt:true}).
  useEffect(() => {
    const eligible = status === 'signedIn' && permission === 'granted' && !userDisabled;
    if (eligible) {
      const needs =
        !isRegisteredRef.current || lastRegisteredRef.current?.locale !== locale;
      if (needs) void registerNow({ prompt: false });
    } else {
      void deregisterNow();
    }
  }, [status, permission, userDisabled, locale, registerNow, deregisterNow]);

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

  // Token rotation → clear the registration record so the sync effect re-registers.
  useEffect(() => {
    const sub = Notifications.addPushTokenListener(() => {
      lastRegisteredRef.current = null;
      setIsRegistered(false);
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
  }, [refreshPermission]);

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
  const enable = useCallback(() => registerNow({ prompt: true }), [registerNow]);
  const retry = enable;

  const disable = useCallback(async () => {
    await persistUserDisabled(true);
    setUserDisabledState(true);
    // the sync effect (via the userDisabled dep) will deregister.
  }, []);

  const isOn = permission === 'granted' && !userDisabled && isRegistered;

  return (
    <NotificationsContext.Provider
      value={{
        permission,
        userDisabled,
        isRegistered,
        isOn,
        diag,
        refreshPermission,
        enable,
        disable,
        retry,
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
