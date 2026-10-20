# Launch checklist — go-live runbook

> Ordered runbook for taking ESIM Global to production and into both stores. Do the
> **backend** section first (nothing in the app works in production until it's done),
> then the **store submission** section, then the **smoke test**. Items the app can't
> verify from its own code are marked **TO CONFIRM**.
>
> Source: PROJECT-CONTEXT §3, §6, §9B (handover doc, not committed).

---

## A. Backend production launch

Do this at a quiet time and watch production logs throughout.

1. **Set production Railway env vars BEFORE flipping the flag** (boot fails fast if
   missing): `MOBILE_API_ENABLED=true`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY=pk_live_…`. Leave
   `NOTIFICATIONS_ENABLED` off until step 6.
2. **Controlled merge** `feat/mobile-api` → `main` (production). Migrations 010–014
   auto-run on the live DB via the start command (`npm run migrate && npm start`) —
   they are additive/idempotent. Watch logs; **immediately test a web purchase** to
   confirm the existing web flow is unaffected.
3. **Live Stripe webhook:** add the **`payment_intent.succeeded`** event to the live
   webhook destination (the mobile flow relies on it; web Checkout PIs are ignored
   by the handler). Confirm the live signing secret is set in production.
4. **Rotate the Yesim token** (the production token was exposed on 15 Oct). Anna
   generates a new token → update Railway production `YESIM_TOKEN` → check logs /
   a provisioning test. Ensure production is **not** in mock mode (`MOCK_YESIM`
   unset/false).
5. **Supabase:** upgrade the project to **Pro** (free projects pause); raise the
   **auth email rate limit** to ~**100/h**; confirm custom SMTP (Postmark) templates.
6. **Push (when ready):** set `NOTIFICATIONS_ENABLED=true` in production. Requires
   the **APNs key** for iOS and the FCM setup for Android to be live. Low-data alert
   fires at 10% remaining (90% used).
7. **Change the shared staging test-account password**; create a **fresh production
   reviewer account** (see `review-notes.md`).
8. **Tidy (optional at launch):** sandbox webhook pointing at prod URL, production
   `DATABASE_URL` reference, retire the Supabase legacy JWT key only when nothing
   uses it.

## B. App production config

1. **`eas.json` production profile:** set the real **`EXPO_PUBLIC_API_URL`**
   (production Railway URL) and **`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…`**
   (currently placeholders). Confirm Supabase URL/key are the production values.
2. **Social sign-in:** set **`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`** (currently
   `REPLACE_…`) in all profiles; create the Google Cloud OAuth clients (Web +
   Android) in project `esim-global-41bbf`; configure the Supabase Google provider
   (add Web client id, **"Skip nonce check" ON**). For iOS: add
   `GoogleService-Info.plist` + iOS client id, and set
   **`EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED=true`** + the Apple provider in Supabase.
3. **Android Play app-signing:** after creating the Play app, take the **Play
   app-signing SHA-1** and add it as a **second Google OAuth Android client**
   (uploads signed by Google Play get a different SHA-1 than the local keystore), or
   Google sign-in fails on store builds. **TO CONFIRM.**
4. **Versioning:** `app.json` `version` = **1.0.0**. `eas.json` uses
   `appVersionSource: remote` with `autoIncrement: true` on the production profile —
   EAS manages iOS `buildNumber` / Android `versionCode` remotely and bumps them per
   build. This is correct; just don't also hand-edit build numbers. (`android.versionCode`
   / `ios.buildNumber` are intentionally **not** pinned in `app.json`.)
5. **Encryption compliance:** `ios.config.usesNonExemptEncryption = false` is set
   (standard HTTPS only) — no French encryption declaration / export docs needed.
6. Build the **production** binaries with EAS (`--profile production`), one per
   platform. Cloud builds need the two publishable keys in the profile `env` (or EAS
   env vars).

## C. Store submission — Apple App Store

> Needs the **Apple Developer account active** (the $99 charge previously failed —
> **TO CONFIRM** it is now paid/active) and the developer invited to App Store
> Connect.

1. Create the app record (bundle id **`net.esimglobal.app`**), name **ESIM Global**.
2. Fill the listing from **`listing-en.md`** (+ ru/de/es as localisations, marked
   draft). Set **support URL** and **marketing URL** (esim-global.net).
3. **App Privacy:** enter answers from **`privacy-apple.md`** (collects data, **no
   tracking**).
4. **Age rating:** from **`content-rating.md`** (expect 4+).
5. **App Review notes + demo account:** from **`review-notes.md`** (include the
   no-IAP 3.1.3(e) explanation and the Apple sign-in 4.8 note).
6. Upload screenshots (6.9" required) — **`assets-checklist.md`**.
7. Upload the production build via EAS Submit / Transporter; attach to TestFlight for
   a smoke test first, then submit for review.

## D. Store submission — Google Play

> Needs the **Play Console Organization account** created (**TO CONFIRM**) and the
> developer invited.

1. Create the app; package **`net.esimglobal.app`**.
2. Fill the listing from **`listing-en.md`** (Play fields) + localisations.
3. **Data safety:** enter answers from **`data-safety-google.md`**; set the data
   **deletion URL** to **esim-global.net/delete-account** (must be live — see
   `account-deletion-page.md`).
4. **Content rating:** complete the IARC questionnaire — **`content-rating.md`**.
5. Upload the app icon (512), **feature graphic (1024×500)** and phone screenshots.
6. Upload the **production AAB**; run **Internal testing** first, then promote to
   Production.

## E. Website prerequisites (must be live before submission)
- **Privacy Policy** (`/privacy-policy`), **Terms** (`/terms-and-conditions`),
  **Refund Policy** (`/refund-policy`) — the app links to these.
- **Account deletion page** (`/delete-account`) — required by Google Play.
- See `privacy-policy-checklist.md`. **TO CONFIRM** all four are published with real
  content.

## F. Post-launch smoke test (on production, a test account)

1. **Real purchase:** buy the cheapest plan with a real card → PaymentSheet succeeds
   → order-success shows a **real QR** + install details.
2. **Email:** the receipt/QR email arrives from `info@esim-global.net` (check
   Postmark activity; keep bounce rate low — only test with real addresses).
3. **eSIM works:** install on a compatible device and confirm it provisions (plan
   activates on first use in the destination).
4. **Push:** with notifications on, confirm a device token registers and a test alert
   is delivered (Android via FCM; iOS via APNs).
5. **Top-up:** top up the same plan → data/days accumulate (no loss).
6. **Account deletion:** on a throwaway account, delete via Profile → Delete account;
   confirm sign-out, Supabase user removed, and order records retained detached.
7. Verify prices display in EUR and match the backend (app never calculates).

> After the smoke test: transfer the **Expo project** and **GitHub repos** to Anna,
> confirm backend commit authorship, and update the handover docs (PROJECT-CONTEXT).
