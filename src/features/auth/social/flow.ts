/**
 * Pure post-sign-in decisions shared by both providers.
 *
 *  - `decidePostSignIn` — did the native step actually yield an id token we can
 *    exchange with Supabase? (A missing token means the SDK returned without a
 *    usable credential — treat it as a silent no-op rather than an error.)
 *  - `appleDisplayName` — Apple only shares the user's name on the FIRST sign-in.
 *    Compute the display name to persist (user_metadata.full_name, display only)
 *    from the credential's fullName, or null when there's nothing to save (so we
 *    never overwrite an existing name with blanks on later sign-ins).
 */

export interface PostSignInDecision {
  /** True when we have a usable id token and should call Supabase. */
  proceed: boolean;
}

export function decidePostSignIn(idToken: string | null | undefined): PostSignInDecision {
  return { proceed: typeof idToken === 'string' && idToken.trim().length > 0 };
}

export interface AppleFullName {
  givenName?: string | null;
  familyName?: string | null;
}

/** Join given + family name into a display name, or null if neither is present. */
export function appleDisplayName(fullName: AppleFullName | null | undefined): string | null {
  if (!fullName) return null;
  const parts = [fullName.givenName, fullName.familyName]
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 0);
  return parts.length > 0 ? parts.join(' ') : null;
}
