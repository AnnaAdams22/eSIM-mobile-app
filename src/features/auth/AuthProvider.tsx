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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Build an Error carrying a Supabase-style `code`, for cases we detect ourselves. */
function codedError(code: string, message: string): Error {
  const err = new Error(message);
  (err as Error & { code?: string }).code = code;
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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'signedIn' : 'signedOut');
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

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const user = session?.user ?? null;
  const displayName =
    (typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
    null;

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
