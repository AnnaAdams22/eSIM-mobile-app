# Notes for App Store / Google Play reviewers

> Paste the relevant parts into **App Store Connect → App Review Information → Notes**
> and **Play Console → how to test / review notes**. Create a fresh reviewer demo
> account just before submission and fill in the credentials below.

## Demo account

- **Email:** `TO CONFIRM — create a fresh reviewer account before submission`
- **Password:** `TO CONFIRM`
- This account already has **existing eSIMs** so the reviewer can open **My eSIMs**,
  view an eSIM's details, usage/data balance, QR and install instructions, and the
  account/top-up screens **without making a real purchase**.
- Do **not** reuse the internal test account; create a dedicated reviewer account on
  the production environment and rotate/delete it after review.

> Note (internal): the current staging demo account is `test@esim-global.net`. Make a
> **production** reviewer account; don't share the staging one.

## What the reviewer will see

- Browse the catalogue of travel data plans for 148+ countries and regions **without
  signing in** (guest browsing is allowed).
- Sign in with the demo account to see **My eSIMs**, eSIM detail with live usage,
  install instructions (QR + manual details), order history and in-app top-up.
- Account management: edit profile, change password, notification settings, language,
  and **Delete account**.

## Payments & why there is no Apple In-App Purchase

ESIM Global sells **mobile data connectivity plans (eSIMs)**. These are a **service
consumed outside the app** — the data is used on the device's cellular connection
while travelling, not as digital content inside the app. Under **App Store Review
Guideline 3.1.3(e)** (goods and services consumed outside the app), such purchases
are made with payment methods other than In-App Purchase.

Payments are therefore processed securely through **Stripe**, supporting card,
**Apple Pay** and **Google Pay**. We believe this is the correct and compliant
model for a connectivity/eSIM service, consistent with other travel-eSIM apps. If
the review team has any concern here, we're happy to clarify promptly.

## Real purchases

Once the app is live, purchases are **real** and provision a real eSIM. Installing an
eSIM requires a **compatible, eSIM-capable and carrier-unlocked device**. So the
reviewer does not need to buy anything, the **demo account already has eSIMs** to
inspect. If the reviewer wishes to test a purchase, Stripe test cards can be provided
on request (**TO CONFIRM** whether to point the review build at a test payment
environment).

## Sign in with Apple (iOS)

On iOS, the app offers **Sign in with Apple** alongside Google sign-in, satisfying
**Guideline 4.8** (equivalent login option with the required privacy properties).
Email/password sign-in is also available.

> Status note: Sign in with Apple is gated behind a config flag
> (`EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED`) and must be **enabled** for the iOS
> production build once the Apple Developer account is active. On iOS, Google is only
> shown when Apple sign-in is also enabled (per 4.8). **TO CONFIRM** before iOS
> submission.

## Account deletion location

Account deletion is available **in-app** at **Profile → Delete account** (type DELETE
to confirm) and via the web at **esim-global.net/delete-account**. This satisfies
Apple's in-app account-deletion requirement and Google's data-deletion requirement.

## Permissions

- **Notifications** (optional): used only for low-data, plan-expiring and
  data-depleted alerts. The app works fully without granting it.
- No location, camera, contacts, photos or microphone access is requested.
