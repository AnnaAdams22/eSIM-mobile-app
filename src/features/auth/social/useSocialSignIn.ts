/**
 * useSocialSignIn — orchestrates a social sign-in from the UI.
 *
 * For each provider: run the native step (wrapper) → on success exchange the id
 * token with Supabase via the AuthProvider primitive (which also runs the same
 * GET /api/me post-auth as email sign-in) → capture the Apple display name on
 * first sign-in → finish with the same success haptic + redirect as email.
 *
 * Cancellation is silent (no error shown). Everything else is mapped to a
 * friendly i18n key via `classifySocialError`. The hook owns its own loading +
 * error state so the screen stays thin.
 */

import { useState } from 'react';

import { errorNotify, successNotify } from '@/lib/haptics';
import { useAuth } from '../AuthProvider';
import { useAuthNavigation } from '../useAuthNavigation';
import { mapAuthError } from '../errors';
import {
  classifySocialError,
  socialErrorCode,
  type SocialErrorKey,
  type SocialErrorCode,
} from './errors';
import { appleDisplayName, decidePostSignIn } from './flow';
import { appleIdTokenExchange, googleIdTokenExchange } from './idToken';
import { signInWithGoogle } from './google';
import { signInWithApple } from './apple';
import { queueAppleAuthorizationCode } from './revocation';

export type SocialProvider = 'google' | 'apple';

export interface UseSocialSignIn {
  /** Which provider is currently signing in, or null. */
  submitting: SocialProvider | null;
  /** Friendly i18n key for the last failure, or null. */
  errorKey: SocialErrorKey | null;
  /** Short, non-sensitive diagnostic code shown under the message, or null. */
  errorCode: SocialErrorCode | null;
  clearError: () => void;
  signInGoogle: (redirect?: string) => Promise<void>;
  signInApple: (redirect?: string) => Promise<void>;
}

export function useSocialSignIn(): UseSocialSignIn {
  const { signInWithIdToken, updateDisplayName } = useAuth();
  const { finishAuth } = useAuthNavigation();

  const [submitting, setSubmitting] = useState<SocialProvider | null>(null);
  const [errorKey, setErrorKey] = useState<SocialErrorKey | null>(null);
  const [errorCode, setErrorCode] = useState<SocialErrorCode | null>(null);

  const clearError = () => {
    setErrorKey(null);
    setErrorCode(null);
  };

  const signInGoogle = async (redirect?: string): Promise<void> => {
    if (submitting) return;
    clearError();
    setSubmitting('google');
    try {
      const result = await signInWithGoogle();
      if (result.status === 'cancelled') return; // silent
      if (result.status === 'error') {
        const mapped = classifySocialError(result.reason, result.error);
        if (!mapped.silent) {
          errorNotify();
          setErrorKey(mapped.key);
          setErrorCode(mapped.code);
        }
        return;
      }
      if (!decidePostSignIn(result.idToken).proceed) return;

      // Google carries NO nonce (library exposes none) — rely on "Skip nonce check".
      const exchange = googleIdTokenExchange(result.idToken);
      await signInWithIdToken(exchange.provider, exchange.token, exchange.nonce);
      successNotify();
      finishAuth(redirect);
    } catch (err) {
      // A Supabase error from signInWithIdToken (nonce, network, rate limit, …).
      errorNotify();
      setErrorKey(mapAuthError(err));
      setErrorCode(socialErrorCode(err));
    } finally {
      setSubmitting(null);
    }
  };

  const signInApple = async (redirect?: string): Promise<void> => {
    if (submitting) return;
    clearError();
    setSubmitting('apple');
    try {
      const result = await signInWithApple();
      if (result.status === 'cancelled') return; // silent
      if (result.status === 'error') {
        const mapped = classifySocialError(result.reason, result.error);
        if (!mapped.silent) {
          errorNotify();
          setErrorKey(mapped.key);
          setErrorCode(mapped.code);
        }
        return;
      }
      if (!decidePostSignIn(result.identityToken).proceed) return;

      // Apple carries the RAW nonce; Supabase re-hashes it to match the token claim.
      const exchange = appleIdTokenExchange(result.identityToken, result.rawNonce);
      await signInWithIdToken(exchange.provider, exchange.token, exchange.nonce);

      // Apple only shares the name on the FIRST sign-in — persist it for display
      // if present (never overwrite with blanks on later sign-ins).
      const name = appleDisplayName(result.fullName);
      if (name) {
        try {
          await updateDisplayName(name);
        } catch {
          // Display-only; a failure here must not fail the sign-in.
        }
      }

      // Capture the Apple authorization code for later server-side revocation
      // (App Store requirement on account deletion). No-op until the backend
      // endpoint exists; never blocks sign-in.
      void queueAppleAuthorizationCode(result.authorizationCode);

      successNotify();
      finishAuth(redirect);
    } catch (err) {
      errorNotify();
      setErrorKey(mapAuthError(err));
      setErrorCode(socialErrorCode(err));
    } finally {
      setSubmitting(null);
    }
  };

  return {
    submitting,
    errorKey,
    errorCode,
    clearError,
    signInGoogle,
    signInApple,
  };
}
