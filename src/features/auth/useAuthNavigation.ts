/**
 * Post-auth navigation. On success we dismiss the auth modal (returning the user
 * to wherever they were) and, if a VALID internal redirect was supplied, push
 * it on top — e.g. the checkout for the plan they tried to buy. External or
 * malformed redirects are ignored (see safeRedirect).
 */

import { useRouter, type Href } from 'expo-router';

import { safeRedirect } from './redirect';

export function useAuthNavigation() {
  const router = useRouter();

  const finishAuth = (redirect?: string) => {
    const target = safeRedirect(redirect);
    if (router.canDismiss?.()) router.dismissAll();
    if (target) router.push(target as Href);
  };

  return { finishAuth };
}
