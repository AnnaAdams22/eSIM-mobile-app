/**
 * Pure rule for what we hand to `supabase.auth.signInWithIdToken` per provider —
 * specifically, WHETHER a nonce travels with the id token. Getting this wrong is
 * exactly the production bug (Supabase: "Passed nonce and nonce in id_token
 * should either both exist or not"), so the decision lives here, pure and tested,
 * instead of being retyped at each call site.
 *
 *  - Apple: we generate the nonce ourselves — a raw nonce whose SHA-256 (hex) is
 *    embedded in Apple's identity token. Supabase must receive the RAW nonce so it
 *    can re-hash and match. So the exchange ALWAYS carries the raw nonce.
 *  - Google: `@react-native-google-signin` exposes no nonce API and its native
 *    flow puts none in the id token, so we must send NO nonce and rely on the
 *    Supabase Google provider's "Skip nonce check" (which MUST stay ON). Sending a
 *    nonce here — or leaving "Skip nonce check" off while a nonce is present —
 *    trips the "both exist or not" error. Same on iOS and Android.
 */

export interface IdTokenExchange {
  provider: 'google' | 'apple';
  token: string;
  /** Raw nonce for Supabase — present ONLY for Apple; always absent for Google. */
  nonce?: string;
}

/** Apple: carry the RAW nonce (Supabase re-hashes it to match the token's claim). */
export function appleIdTokenExchange(identityToken: string, rawNonce: string): IdTokenExchange {
  return { provider: 'apple', token: identityToken, nonce: rawNonce };
}

/** Google (iOS + Android): never carry a nonce — rely on "Skip nonce check". */
export function googleIdTokenExchange(idToken: string): IdTokenExchange {
  return { provider: 'google', token: idToken };
}
