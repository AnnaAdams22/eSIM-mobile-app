# App Store — App Privacy answers ("nutrition label")

> Fill these into **App Store Connect → your app → App Privacy**. Answers below are
> grounded in what the ESIM Global app and its backend (`esim-backend`) actually do.
> Anything the app cannot verify from its own code is marked **TO CONFIRM**.

## Headline answers

- **Does this app collect data?** → **Yes.**
- **Do you or your third-party partners use data for tracking?** → **No.**
  The app ships **no analytics, advertising, or attribution SDKs** (verified: the
  dependency list has no Firebase Analytics, Facebook, AppsFlyer, Adjust, Branch,
  Amplitude, Sentry, etc.). No IDFA / `AppTrackingTransparency` prompt is used, and
  no data is shared with data brokers or used for cross-app/cross-site advertising.

## Data types collected

For each type Apple asks: (a) is it collected, (b) is it **linked** to the user's
identity, (c) is it used for **tracking**, (d) the **purposes**. We never track, so
column (c) is **No** for every row.

| Apple data type | Collected | Linked to user | Tracking | Purpose(s) | Where it comes from in the app |
|---|---|---|---|---|---|
| **Email address** | Yes | Yes | No | App Functionality; Account Management | Sign-up / sign-in (Supabase). Also the receipt address for orders. |
| **Name** | Yes | Yes | No | App Functionality | Optional display name. Only set if the user types one, or from Apple/Google at first social sign-in (`user_metadata.full_name`). Not required. |
| **Purchase History** | Yes | Yes | No | App Functionality; Customer Support | Orders / eSIMs: plan bought, amount paid (EUR), status, dates, ICCID. Shown in "My eSIMs" and order history; stored in the backend. |
| **User ID** | Yes | Yes | No | App Functionality | Supabase user id (and the backend's own user row). Ties the account to its orders and devices. |
| **Device ID** | Yes | Yes | No | App Functionality | **Expo push token** (a push-delivery identifier), plus `platform` (ios/android) and app `locale`, sent only if the user turns notifications on. Used solely to deliver low-data / expiry / depleted alerts. |
| **Payment Info** | **No (not collected by us)** | — | — | — | Card details are entered in the **Stripe** PaymentSheet and sent directly to Stripe. The app and our backend never see or store card numbers. See "Payment Info" note below. |
| **Coarse / Precise Location** | No | — | — | — | The app requests **no** location permission. The destination is chosen by the user from a list, not detected. |
| **Contacts, Photos, Health, Browsing, Messages, Audio, etc.** | No | — | — | — | Not requested, not accessed. |

### Notes
- **Payment Info:** In Apple's model, if a third party (Stripe) collects payment
  data on your behalf *through your app*, Apple may still expect it listed. Our
  position: card data is collected **by Stripe**, not by us, and is never linked to
  data we hold. **TO CONFIRM** with the reviewer flow — if App Store Connect
  requires it, declare **Payment Info → collected, linked, no tracking, purpose
  "App Functionality"**, and note in Review Notes that Stripe is the processor.
- **Diagnostics / Crash data:** none collected — there is no crash-reporting SDK.
  If a crash reporter is ever added, add **Diagnostics → not linked, no tracking**.
- **Device info for the install guide:** the app reads the device *make* on-device
  (expo-device) to show the right install steps and to decide whether one-tap
  install is available. This is used **on the device only** and is **not sent** to
  our backend, so it is not a "collected" data type.

## Third parties that process user data

These are **processors acting for eSIM.Global**, not independent trackers. List them
in your privacy policy (see `privacy-policy-checklist.md`).

| Processor | Role | What it receives |
|---|---|---|
| **Supabase** | Authentication / identity | Email, password (hashed by Supabase), user id, optional name. Business data is **not** stored here. |
| **Stripe** | Payments | Card / Apple Pay / Google Pay details (entered in Stripe's sheet), amount, currency, a customer id. Card data never reaches our servers. |
| **Yesim** | eSIM provisioning | The plan ordered, enough to provision the eSIM (ICCID, activation/QR data). **TO CONFIRM** exactly which identifiers Yesim receives — from the backend it is the plan/order, not the customer email. |
| **Postmark** | Transactional email | Recipient email address and the order/eSIM details included in the receipt and auth emails. |
| **Expo (push) + Firebase Cloud Messaging** | Push notification delivery | The device push token and the alert payload (e.g. "data running low"). Android delivery is via FCM; iOS via APNs. |
| **Railway** | Backend hosting | Hosts the backend and its Postgres database (where accounts, orders and device tokens live). EU West region. |

## Data retention & deletion

- Users can **delete their account in-app** (Profile → Delete account) and from the
  web (`esim-global.net/delete-account`). See `account-deletion-page.md`.
- On deletion the backend **detaches and keeps order/purchase records** (required
  for accounting/legal) but deletes the Supabase user, the Stripe customer, device
  tokens and the notification log. Reflect this in the privacy policy.
- **TO CONFIRM:** exact retention period for detached order records (set by the
  client's accounting/legal requirements).
