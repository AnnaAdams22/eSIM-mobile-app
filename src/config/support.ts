/**
 * Support contact details, kept in one place so the client can fill them in
 * without touching any screen code.
 *
 * These are PUBLIC, non-secret values (a public WhatsApp number, a public
 * Instagram handle, a support inbox). Leave a value as an empty string to hide
 * its contact row on the Support screen until the real detail is available.
 *
 * TODO (client): provide the real WhatsApp number and Instagram handle. Confirm
 * the support email below is correct.
 */

export interface SupportConfig {
  /** International phone number in any format (used to build a wa.me link). Empty = hidden. */
  whatsappNumber: string;
  /** Instagram handle, with or without a leading "@". Empty = hidden. */
  instagramHandle: string;
  /** Support inbox address. Empty = hidden. */
  supportEmail: string;
}

export const support: SupportConfig = {
  whatsappNumber: '',
  instagramHandle: '',
  supportEmail: 'info@esim-global.net',
};
