/**
 * AuthProvider — the single source of truth for authentication state.
 *
 * Wraps Supabase Auth (the identity provider) and exposes a small, typed API to
 * the app. Supabase owns identity only; after a successful sign-in or email
 * verification we call the backend GET /api/me ONCE so it can create/update the
 * user row (and so we learn about a soft-deleted account).
 *
 * Email confirmation and password reset both use 6-digit CODES (verifyOtp), not
 * magic links — so there is no deep linking to wire up and everything works in
 * Expo Go.
 *
 * Security notes:
 *  - Passwords, tokens and codes are NEVER logged.
 *  - `displayName` comes from user_metadata.full_name and is for DISPLAY ONLY;
 *    user_metadata is user-editable and must never gate anything security-relevant.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { api, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { deriveAuthState } from './authState';
import { runBeforeSignOutHooks } from './signOutHooks';

/** Max time we'll wait on best-effort pre-sign-out cleanup before cutting it loose. */
const BEFORE_SIGN_OUT_TIMEOUT_MS = 2500;

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

export interface SignUpParams {
  fullName: string;
  email: string;
  password: string;
}

export interface SignUpResult {
  /** True when Supabase requires email confirmation before a session is issued. */
  needsConfirmation: boolean;
}

export interface ResetPasswordParams {
  email: string;
  code: string;
  password: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

/** Which call failed during a password change, for friendly error mapping. */
export type PasswordChangeStage = 'reauth' | 'update';

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  /** full_name from user_metadata — display only. */
  displayName: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (params: ResetPasswordParams) => Promise<void>;
  /** Update the display name (user_metadata.full_name). Display only. */
  updateDisplayName: (fullName: string) => Promise<void>;
  /**
   * Change the password. Re-authenticates with the current password first; a
   * thrown error carries a `stage` ('reauth' | 'update') so the screen can map
   * it to the right message.
   */
  changePassword: (params: ChangePasswordParams) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Build an Error carrying a Supabase-style `code`, for cases we detect ourselves. */
function codedError(code: string, message: string): Error {
  const err = new Error(message);
  (err as Error & { code?: string }).code = code;
  return err;
}

/** Tag an error with the password-change stage it came from, preserving its code/message. */
function staged(stage: PasswordChangeStage, err: unknown): unknown {
  if (err && typeof err === 'object') {
    (err as { stage?: PasswordChangeStage }).stage = stage;
  }
  return err;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? 'signedIn' : 'signedOut');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'signedIn' : 'signedOut');
      // Every sign-out path funnels through here — manual, a forced sign-out
      // (401 that couldn't be refreshed), account_deleted, or account deletion —
      // so clear the cached per-user queries (/api/me, eSIMs, usage, orders) in
      // one place, no matter who triggered it.
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /**
   * Call GET /api/me once after a successful interactive auth so the backend
   * creates/updates the user row. A 403 account_deleted is fatal: sign out and
   * rethrow so the screen can show a clear message. Any other failure (e.g. a
   * transient network blip) is non-fatal — the session is already valid and the
   * row will sync on the next authenticated request, so we don't block sign-in.
   */
  const runPostAuth = async (): Promise<void> => {
    try {
      await api.getMe();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.code === 'account_deleted') {
        await supabase.auth.signOut();
        throw err;
      }
      if (__DEV__) {
        console.warn('[auth] GET /api/me after sign-in failed (non-fatal).');
      }
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    await runPostAuth();
  };

  const signUp = async ({ fullName, email, password }: SignUpParams): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) throw error;

    // With email-enumeration protection on (Supabase default), signing up an
    // address that already exists returns a user with no identities and no
    // error. Treat that as "already registered".
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw codedError('user_already_exists', 'User already registered');
    }

    if (data.session) {
      // Confirmation is disabled on the project — we're already signed in.
      await runPostAuth();
      return { needsConfirmation: false };
    }
    return { needsConfirmation: true };
  };

  const verifyEmail = async (email: string, code: string): Promise<void> => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'signup',
    });
    if (error) throw error;
    await runPostAuth();
  };

  const resendCode = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) throw error;
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
  };

  const resetPassword = async ({ email, code, password }: ResetPasswordParams): Promise<void> => {
    // The recovery code establishes a short-lived session that authorises the
    // password change.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'recovery',
    });
    if (verifyError) throw verifyError;

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) throw updateError;

    // Per the flow spec, return the user to a clean sign-in with the new
    // password rather than leaving them in the recovery session.
    await supabase.auth.signOut();
  };

  const updateDisplayName = async (fullName: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    if (error) throw error;
    // The USER_UPDATED event refreshes `session` (and thus `displayName`), so the
    // Home greeting and profile update immediately — no manual refetch needed.
  };

  const changePassword = async ({
    currentPassword,
    newPassword,
  }: ChangePasswordParams): Promise<void> => {
    const email = session?.user?.email;
    if (!email) {
      throw staged('update', new Error('No active session.'));
    }
    // Prove the current password by re-authenticating. A failure here means the
    // current password is wrong (or a network/rate-limit issue).
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) throw staged('reauth', reauthError);

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) throw staged('update', updateError);
  };

  const signOut = async (): Promise<void> => {
    // Run best-effort cleanup that needs the still-valid session FIRST — notably
    // deregistering the push device token (DELETE /api/me/devices must be
    // authenticated). Time-boxed and non-throwing so a flaky network can never
    // block sign-out.
    await Promise.race([
      runBeforeSignOutHooks(),
      new Promise<void>((resolve) => setTimeout(resolve, BEFORE_SIGN_OUT_TIMEOUT_MS)),
    ]);

    // Flip to signed-out and drop cached user data IMMEDIATELY — don't wait on
    // Supabase's network token-revoke round-trip (which on a flaky connection
    // can take seconds), or the UI would keep showing the old user until it
    // returns. The listener's SIGNED_OUT also fires later; both are idempotent.
    setSession(null);
    setStatus('signedOut');
    queryClient.clear();
    try {
      await supabase.auth.signOut();
    } catch {
      // Best effort: the local session is already gone and will be cleared from
      // storage on the next launch; a failed server revoke must not block sign-out.
    }
  };

  const { user, displayName } = deriveAuthState(session);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      status,
      displayName,
      signIn,
      signUp,
      verifyEmail,
      resendCode,
      sendPasswordReset,
      resetPassword,
      updateDisplayName,
      changePassword,
      signOut,
    }),
    // signIn/… are stable closures over module-level `supabase`; re-create only
    // when identity state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, session, status, displayName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
