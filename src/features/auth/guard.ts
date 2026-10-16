/**
 * The central auth-guard decision — a pure function so the routing layer stays
 * declarative and the policy is unit-testable in isolation.
 *
 * Applied in two layout-level places that share this one rule:
 *  - the (protected) route group's layout (protected routes always require auth);
 *  - the root AuthGate (enforces REQUIRE_SIGN_IN_TO_BROWSE for public routes too).
 *
 * See CLAUDE.md § "Auth routing" for which routes are protected vs public.
 */

import type { AuthStatus } from './AuthProvider';

export type GuardDecision =
  /** Render the route. */
  | 'allow'
  /** Send the user to the sign-in screen. */
  | 'redirect'
  /** Auth state is still resolving — show a neutral loading state, don't redirect yet. */
  | 'wait';

export interface GuardInput {
  status: AuthStatus;
  /** The current route is inside the protected group. */
  isProtected: boolean;
  /** The current route is one of the (auth) screens. */
  isAuthRoute: boolean;
  /** The REQUIRE_SIGN_IN_TO_BROWSE config flag. */
  requireSignIn: boolean;
}

export function guardDecision({
  status,
  isProtected,
  isAuthRoute,
  requireSignIn,
}: GuardInput): GuardDecision {
  // Never gate until we know who the user is — avoids a flash of protected
  // content and a premature redirect at startup.
  if (status === 'loading') return 'wait';

  // The auth screens themselves are always reachable (otherwise sign-in loops).
  if (isAuthRoute) return 'allow';

  if (status === 'signedIn') return 'allow';

  // Signed out from here on.
  if (isProtected) return 'redirect'; // protected routes always require sign-in
  if (requireSignIn) return 'redirect'; // global flag: gate public routes too
  return 'allow'; // guest browsing of public routes
}
