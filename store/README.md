# Store submission pack — ESIM Global

Documents and configuration to submit the app to the **Apple App Store** and
**Google Play**. Everything here is grounded in what the app and backend actually do
(no invented features). Items that can't be verified from the repo are marked
**TO CONFIRM**.

## Index

| File | What it's for |
|---|---|
| `listing-en.md` | Store listing copy (App Store + Google Play), with character counts — **source of truth** |
| `listing-ru.md` / `listing-de.md` / `listing-es.md` | Same, in Russian / German / Spanish — **machine-generated drafts, need native review** |
| `privacy-apple.md` | Apple App Privacy ("nutrition label") answers |
| `data-safety-google.md` | Google Play Data safety form answers |
| `account-deletion-page.md` | Ready-to-publish text for `esim-global.net/delete-account` (Google Play requirement) |
| `privacy-policy-checklist.md` | What the website Privacy Policy must cover to match the app |
| `review-notes.md` | Notes for App Store / Play reviewers (demo account, no-IAP rationale, deletion location) |
| `assets-checklist.md` | Required images and sizes; which screens to capture |
| `content-rating.md` | IARC (Google) + Apple age-rating answers |
| `launch-checklist.md` | End-to-end go-live runbook (backend → store → smoke test) |

## Config changes made in this task (app.json)

Small, non-feature config only:

1. **`ios.config.usesNonExemptEncryption = false`** — the app uses only standard
   HTTPS/TLS; no custom/proprietary encryption. This lets App Store builds skip the
   export-compliance prompt.
2. **`android.blockedPermissions`** — see the audit below.

Version is **1.0.0** (`app.json` + `package.json`). `eas.json` production profile
uses `appVersionSource: remote` + `autoIncrement: true`, so EAS manages the iOS
`buildNumber` / Android `versionCode` remotely and increments per build — correct;
do not also hand-pin build numbers.

## Android permissions audit

Taken from the real merged picture: a throwaway `expo prebuild --platform android`
generated `AndroidManifest.xml`, inspected, then removed (`android/` is gitignored).
The notification/FCM permissions are merged in at build time from the
`expo-notifications` + Firebase libraries.

### Kept (needed — do NOT block)
| Permission | Why it's needed |
|---|---|
| `INTERNET` | All API/auth/payment traffic. Mandatory. |
| `VIBRATE` | Haptic feedback (expo-haptics) and notification vibration. |
| `POST_NOTIFICATIONS` | Android 13+ runtime permission for push alerts (low-data / expiry / depleted). Optional for the user; the app works without it. |
| `WAKE_LOCK` | Added by FCM to deliver pushes. |
| `RECEIVE_BOOT_COMPLETED` | Added by expo-notifications/FCM to restore push delivery after reboot. |
| `com.google.android.c2dm.permission.RECEIVE` | FCM push receipt. |
| `ACCESS_NETWORK_STATE` *(if present from a lib)* | Harmless connectivity check. Note: our own offline detection does **not** use NetInfo — it polls `GET /health` — so we don't request this ourselves. |

### Blocked (unnecessary — added via `android.blockedPermissions` in app.json)
| Permission | Why blocked |
|---|---|
| `SYSTEM_ALERT_WINDOW` | "Draw over other apps" — pulled in by React Native tooling; the app has no overlay UI and Google Play flags this sensitive permission. Not needed in production. |
| `READ_EXTERNAL_STORAGE` | Legacy shared-storage read (capped at SDK ≤32). The app doesn't read user media/files; it has no media-library dependency. |
| `WRITE_EXTERNAL_STORAGE` | Legacy shared-storage write (capped at SDK ≤32). The app never saves to shared storage (QR is rendered on-screen; no save-to-gallery). |

### Confirmed NOT requested
`CAMERA` (QR is displayed, never scanned), `RECORD_AUDIO`, `ACCESS_FINE/COARSE_LOCATION`,
`READ_CONTACTS`, `READ_MEDIA_*`. Good — matches the privacy answers (no location, no
camera, no contacts).

> After the next production build, re-check the final merged manifest in the Play
> Console's "app bundle → permissions" view to confirm the blocked ones are gone.

## What the client must still do (blockers)

- **Website pages (live, real content):** Privacy Policy, Terms, Refund Policy, and
  the **Account deletion** page (`/delete-account`). See `privacy-policy-checklist.md`
  and `account-deletion-page.md`.
- **Official logo** (high-res / vector) + **1024×1024** app-icon master. Current
  asset is a temporary low-res PNG.
- **Screenshots** reviewed/approved (ideally with real brand hero photos; all hero
  slots are placeholders today).
- **Native translation review** of RU/DE/ES listings (Anna can do Russian).
- **Accounts active:** Apple Developer (the $99 charge previously failed), Google
  Play **Organization** account; developer invited to both.
- **Production reviewer demo account** created fresh before submission.

## Master "TO CONFIRM" list

- Whether App Store Connect / Play require **Payment Info** declared even though
  Stripe (not us) handles cards. (privacy-apple / data-safety)
- **Retention period** for detached order records. (all privacy docs)
- Exactly which identifiers **Yesim** receives. (privacy-apple)
- **iPad** support decision (affects iOS screenshots / tablet support).
- Play **app-signing SHA-1** added as a second Google OAuth Android client.
- Apple Developer account **active**; **Sign in with Apple enabled** for the iOS
  build; Apple-token **revocation** backend endpoint (deletion requirement) still a
  backend TODO.
- Minimum purchase age statement in Terms (if the client wants one).
