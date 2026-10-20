# Privacy Policy checklist (for the website policy)

> **Not a legal document.** This is a checklist so the Privacy Policy published on
> esim-global.net **matches what the app actually does**. Both Apple and Google (and
> Stripe) require a privacy policy URL, and the policy must be consistent with the
> App Privacy / Data safety answers. **Recommendation:** have a lawyer draft/review
> it, or use a reputable generator (e.g. **Termly**, iubenda) and then tailor it to
> the points below.

The policy MUST mention:

## 1. Who the controller is
- eSIM.Global LLC (US LLC), website esim-global.net, contact **info@esim-global.net**.

## 2. What data is collected
- **Email address** (account + receipts).
- **Name** (optional display name; may come from Apple/Google at social sign-in).
- **Purchase history** (plans bought, amounts in EUR, dates, eSIM ICCID, status).
- **Account / user identifiers.**
- **Device push token + platform + app language** (only when notifications are on).
- **No location, no contacts, no photos, no advertising identifiers.**
- State clearly: **we do no advertising, analytics tracking, or data selling.**

## 3. Payment data handling
- Card / Apple Pay / Google Pay details are entered into **Stripe** and processed by
  Stripe; eSIM.Global does **not** store card numbers.

## 4. Processors / third parties (name them and link their policies)
- **Supabase** — authentication/identity.
- **Stripe** — payments.
- **Yesim** — eSIM provisioning.
- **Postmark** — transactional & auth emails.
- **Expo + Firebase Cloud Messaging** — push notification delivery.
- **Railway** — hosting (backend + database, EU West).

## 5. Push notifications
- What they are used for (low-data, plan-expiring, data-depleted alerts), that they
  are **optional**, and how to turn them off (device settings / in-app toggle).

## 6. How data is used (purposes)
- Provide the service (buy/install/manage eSIMs), process payments, deliver
  requested notifications, customer support. **Not** advertising or profiling.

## 7. Data retention
- Accounts kept until deleted. **Order records retained (detached) for
  accounting/legal reasons** — state the period (**TO CONFIRM** with accountant/lawyer).

## 8. Account & data deletion
- In-app (Profile → Delete account) **and** web request
  (esim-global.net/delete-account or email from the account address). Link the
  deletion page. State what is deleted vs kept (mirror `account-deletion-page.md`).

## 9. International transfers
- Data may be processed outside the user's country by the processors above (US/EU).
  Mention the legal basis / safeguards (**TO CONFIRM** with lawyer).

## 10. Children
- The service is not directed at children (see `content-rating.md` — rated for all
  ages but a commercial purchase product). State a minimum age if the client wants
  one (**TO CONFIRM**).

## 11. Users' rights & contact
- Access/correction/deletion rights and how to exercise them; contact
  **info@esim-global.net**. Add GDPR/CCPA language as the lawyer advises.

## 12. Changes & effective date
- How changes are communicated; a "last updated" date.

---

### Related website pages the stores/Stripe also expect (TO CONFIRM they're live)
- **Privacy Policy** (this).
- **Terms & Conditions** — app links to `esim-global.net/terms-and-conditions`.
- **Refund Policy** — app links to `esim-global.net/refund-policy`.
- **Account deletion** — `esim-global.net/delete-account` (see `account-deletion-page.md`).

> The app's About screen links to Terms, Privacy and Refund at the URLs above
> (`src/config.ts` → `legal`). These pages must contain **real** content before
> launch.
