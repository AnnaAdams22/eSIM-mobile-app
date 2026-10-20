# Google Play — Data safety form answers

> Fill these into **Play Console → your app → App content → Data safety**. Same
> facts as `privacy-apple.md`, mapped to Google's categories. **TO CONFIRM** marks
> anything the app can't verify from its own code.

## Section 1 — Overview answers

- **Does your app collect or share any of the required user data types?** → **Yes.**
- **Is all of the user data collected by your app encrypted in transit?** → **Yes.**
  All app ↔ backend traffic is HTTPS; Supabase and Stripe are HTTPS. (The app uses
  standard TLS only — this is also why `ios.config.usesNonExemptEncryption` is set
  to `false`.)
- **Do you provide a way for users to request that their data be deleted?** → **Yes.**
  In-app (Profile → Delete account) **and** via the web page
  `esim-global.net/delete-account`. Provide that URL in the form.
- **Independent security review:** optional / **TO CONFIRM** (none performed; leave
  unchecked).

## Section 2 — Data types

For each: **Collected?**, **Shared?** (sent to a third party), **Processing**
(optional vs required for the feature), **Purpose(s)**. We do **no** advertising or
analytics, so "Advertising or marketing" and "Analytics" are **never** selected.
"Shared" below means shared with **processors** (Stripe, Yesim, Postmark, Expo/FCM,
Supabase) acting on our behalf — declare these as Shared and name the purpose.

### Personal info
| Data | Collected | Shared | Optional/Required | Purpose |
|---|---|---|---|---|
| **Email address** | Yes | Yes (Supabase, Postmark) | Required (to have an account) | Account management; App functionality; Customer support |
| **Name** | Yes | No | Optional | App functionality (display name only) |
| **User IDs** | Yes | Yes (backend/Supabase) | Required | Account management; App functionality |

### Financial info
| Data | Collected | Shared | Optional/Required | Purpose |
|---|---|---|---|---|
| **Purchase history** | Yes | No (stored by us; not sold/shared for other purposes) | Required | App functionality; Customer support |
| **Payment info (card number, etc.)** | **Not collected by the app** | Handled by **Stripe** | — | Processed by Stripe; never stored by us. See note. |

> **Payment info note:** card data is entered in Stripe's sheet and goes straight to
> Stripe. Google's guidance: payment data processed **only** by a payment processor
> and never sent to your servers generally need **not** be declared as collected by
> your app. We therefore mark payment card data as **not collected**, and name
> Stripe as the payment processor in the privacy policy. **TO CONFIRM** against the
> current Data safety wording at submission.

### Device or other IDs
| Data | Collected | Shared | Optional/Required | Purpose |
|---|---|---|---|---|
| **Device or other IDs** (Expo push token) | Yes | Yes (Expo + Firebase Cloud Messaging) | Optional (only if notifications are turned on) | App functionality (deliver low-data / expiry / depleted alerts) |

### Messages / App activity / App info & performance
- **Messages, Photos, Contacts, Calendar, Audio, Files:** not collected.
- **Location (approximate or precise):** **not collected** — the app requests no
  location permission.
- **App activity (in-app search, interactions):** not collected or sent off-device.
- **Crash logs / diagnostics:** **not collected** (no crash-reporting SDK). If one
  is added later, declare "Crash logs" → not for advertising, encrypted in transit.

## Section 3 — Data usage & handling summary (for the policy)

- **Purposes used:** App functionality, Account management, Customer support only.
  **Not** used for advertising, marketing, analytics, personalization, or fraud
  prevention beyond what Stripe performs as the payment processor.
- **Processors (declare as "shared"):** Supabase (auth), Stripe (payments), Yesim
  (eSIM provisioning), Postmark (email), Expo + Firebase Cloud Messaging (push),
  Railway (hosting).
- **Encryption in transit:** Yes (HTTPS/TLS everywhere).
- **Deletion:** in-app + web request path available; order records are retained
  detached from the account for accounting/legal reasons (**TO CONFIRM** retention
  period).
