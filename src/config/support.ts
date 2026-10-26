/**
 * Support contact details, kept in one place so the client can fill them in
 * without touching any screen code.
 *
 * These are PUBLIC, non-secret values (a public WhatsApp link, a public
 * Instagram handle, a support inbox). Leave a value as an empty string to hide
 * its contact row on the Support screen until the real detail is available.
 */

export interface SupportConfig {
  /**
   * A full WhatsApp link, opened as-is (e.g. a wa.me business "message" link
   * like `https://wa.me/message/XXXX`). Takes precedence over `whatsappNumber`.
   * Empty = fall back to `whatsappNumber`.
   */
  whatsappUrl: string;
  /**
   * International phone number in any format, used to build a `wa.me/<digits>`
   * link when `whatsappUrl` is empty. Kept for the future. Empty = hidden.
   */
  whatsappNumber: string;
  /** Instagram handle, with or without a leading "@". Empty = hidden. */
  instagramHandle: string;
  /** Support inbox address. Empty = hidden. */
  supportEmail: string;
}

export const support: SupportConfig = {
  // Client-provided WhatsApp business message link (opened verbatim).
  whatsappUrl: 'https://wa.me/message/CE4JZHWV2PSJD1',
  whatsappNumber: '',
  instagramHandle: 'esim_global01',
  supportEmail: 'info@esim-global.net',
};
