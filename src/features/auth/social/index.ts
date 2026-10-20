/**
 * Social sign-in feature. Pure, tested logic + the composed UI section. Native
 * wrappers (google.ts / apple.ts) are imported by the hook, not re-exported here,
 * so importing this barrel never pulls a native module into a test.
 */

export { SocialAuthSection } from './SocialAuthSection';
export type { SocialAuthSectionProps } from './SocialAuthSection';

export { socialConfig } from './config';

export { socialProvidersVisible, anySocialVisible } from './visibility';
export type { SocialPlatform, SocialVisibility, SocialVisibilityInput } from './visibility';

export { classifySocialError, SOCIAL_ERROR_KEYS } from './errors';
export type { SocialErrorReason, SocialErrorResult, SocialErrorKey } from './errors';

export { rawNonceFromBytes, isRawNonce, RAW_NONCE_BYTES } from './nonce';

export { decidePostSignIn, appleDisplayName } from './flow';
export type { AppleFullName, PostSignInDecision } from './flow';

export { signOutGoogle } from './google';
