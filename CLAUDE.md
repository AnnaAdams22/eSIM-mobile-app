# CLAUDE.md — standing rules for the ESIM Global mobile app

## Project summary
The React Native (Expo) mobile app for **ESIM.Global**, an eSIM store where
travellers buy mobile data plans for 190+ countries. Users browse destinations,
buy a plan, install the eSIM, and manage usage/top-ups. This is a **new, separate
repo** from the backend.

The backend already exists and is complete: `../esim-backend` (Node/Express,
Railway Postgres, Stripe, Yesim provisioning, Supabase JWT auth). It is deployed
to staging. **`../esim-backend` is READ-ONLY from this repo — never modify it.**
Its rules and API live in `../esim-backend/CLAUDE.md`.

## Stack
- **Expo SDK 57**, React Native 0.86, React 19, **TypeScript** (strict).
- **expo-router** (file-based routing, typed routes).
- **@tanstack/react-query** for server state.
- **@supabase/supabase-js** for auth only (identity provider; no business data).
  Session persisted via a large-value-safe **expo-secure-store** adapter.
- **i18next / react-i18next / expo-localization** (English only for now).
- **expo-image**, **expo-font**, **@expo-google-fonts/inter**.
- Icons: **lucide-react-native** (the one icon set — use it everywhere).
- **Payments: `@stripe/stripe-react-native`** (native PaymentSheet) + Apple Pay /
  Google Pay. **`expo-clipboard`** for copyable activation details.
- Runs as a **development build** (`expo-dev-client`) built with **EAS**, **not
  Expo Go** — the Stripe SDK is native. Build once, then use `expo start
  --dev-client` for fast JS reloads (see "How to run"). Apple-sign-in and other
  native auth libraries are still later tasks.

## Folder structure
```
app/                      # expo-router routes
  _layout.tsx             # root: fonts, providers, config gate, splash
  (tabs)/                 # bottom tab bar + Home, My eSIMs, Explore, Profile
  destinations/           # list + [id] detail
  esim/[iccid].tsx        # eSIM detail
  checkout.tsx, order-success.tsx, install-guide.tsx, support.tsx, settings.tsx
  (auth)/                 # sign-in / sign-up
  dev/design.tsx          # DEV-ONLY design system preview (redirects in prod)
  +not-found.tsx
src/
  theme/                  # typed tokens (colors, typography, spacing, shadows) + useTheme()
  components/ui/          # reusable, accessible, theme-only UI kit
  components/             # app-level composites (PlaceholderScreen, ConfigError)
  hooks/                  # shared hooks (useReducedMotion)
  lib/                    # supabase, api client + types, queryClient, secure-store
  i18n/                   # i18next setup + en.json
  config.ts               # EXPO_PUBLIC_* config with fail-fast validation
assets/brand/             # TEMPORARY logo assets (see below)
design/                   # client reference.png + logo.png (DO NOT move/delete)
```

## Rules
1. **Theme tokens only.** No hardcoded colours, font sizes, spacing, radii, or
   shadows in components/screens. Use `useTheme()` and the tokens in `src/theme`.
2. **Translation keys only.** Every user-visible string comes from an i18n key
   (`src/i18n/en.json`) via `useTranslation()`. No literal UI strings.
3. **No secrets in the app.** Only `EXPO_PUBLIC_*` **publishable/anon** keys
   belong here (they ship in the bundle and are public). NEVER add a secret key:
   no `sb_secret_…`, no Stripe `sk_…`, no webhook secrets. Secrets live only in
   the backend.
4. **Accessible components.** Every interactive element has an
   `accessibilityRole` and label, a **minimum 44pt touch target**, and text that
   scales with the system font size without breaking layout. Respect reduced
   motion.
5. **`../esim-backend` is read-only.** Never edit it from this repo. Treat its
   route files as the API contract (see `src/lib/api-types.ts`).
6. **Every screen handles loading, empty, and error states.** Use `Skeleton`,
   `EmptyState`, and `ErrorState`. No screen should show a blank or a raw spinner
   with no recovery path.
7. **Prices are always EUR and come from the backend.** The app **never
   calculates prices, discounts, or totals** — it displays the server's
   `*_display` / `*_cents` values verbatim.
8. Prefer `npx expo install` for anything SDK-related so versions match.
9. Keep `npx tsc --noEmit` and `npx expo lint` green before committing.

## Design principles (from design/reference.png)
A calm, premium travel brand. Specifics:
- **Warm ivory backgrounds** (`#F4F1EC`) — **never pure white** full screens.
- **Deep navy-charcoal primary** (`#1C2430`): the one bold element per screen
  (primary pill button, active tab, headings).
- **White rounded cards** with **soft, low-contrast shadows** (subtle elevation).
- **Generous, calm spacing**; nothing cramped.
- **Rounded geometry**: pill buttons/chips, 14–20px card radii.
- **Warm travel photography** in banners and explore cards.
- Inter throughout; a wide-tracked uppercase **wordmark** ("ESIM GLOBAL", bold
  first word + light second word) matching the logo.
- Soft status accents: green for "Active", soft red for discounts, lavender for
  install-guide steps.

## Logo / brand assets — TODO
`assets/brand/` holds **TEMPORARY** logo files derived from `design/logo.png`
(background cleaned + tightly cropped; shapes unchanged; colour kept black).
Variants: `esim-logo-full.png`, `esim-logo-symbol.png`, `esim-logo-wordmark.png`.
The symbol also drives the splash + app icon on the ivory background.

> **TODO: Replace with official SVG / high-res transparent logo files from the
> client before release.** Keep the same file names so the swap needs no code
> changes (`src/components/ui/Logo.tsx` and `app.json` reference these paths; if
> aspect ratios change, update the `ASPECT` map in `Logo.tsx`). Do **not**
> recolour the logo.

## Hero images — TODO (need real licensed photos)
The Home hero, destination hero and Explore cards currently render tasteful warm
**brand-gradient placeholders** (no stock photos are shipped — see the copyright
rule in the shopping task). `src/components/HeroImage.tsx` reads a slot registry
at `src/features/catalog/images.ts`; every slot is `null` today. To drop in a
licensed photo with **no other code change**: add the file to `assets/images/`
and set the slot to its `require(...)`. Slots that need real photography:

| Slot key                    | Where it appears                     | Suggested asset         |
| --------------------------- | ------------------------------------ | ----------------------- |
| `home`                      | Home hero card                       | `hero-home.jpg`         |
| `destinationDefault`        | Destination detail hero (all)        | `hero-destination.jpg`  |
| `continent:Europe`          | Explore — Europe card                | `hero-europe.jpg`       |
| `continent:Asia`            | Explore — Asia card                  | `hero-asia.jpg`         |
| `continent:Americas`        | Explore — Americas card              | `hero-americas.jpg`     |
| `continent:Africa`          | Explore — Africa card                | `hero-africa.jpg`       |
| `continent:Middle East`     | Explore — Middle East card           | `hero-middle-east.jpg`  |
| `continent:Oceania`         | Explore — Oceania card               | `hero-oceania.jpg`      |

> Use warm, calm travel photography consistent with the brand. A dark scrim is
> applied automatically so white overlay text stays legible.

## Configuration
- Public config is read from `EXPO_PUBLIC_*` env vars in `.env` (see
  `.env.example`). `src/config.ts` validates them and the app shows a clear
  startup error screen if any required var is missing.
- Required vars: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- `.env` currently has staging API + Supabase URL; the two publishable keys are
  left blank for the owner to fill in.

## How to run
The app needs a **development build** (the Stripe SDK is native — Expo Go can no
longer run it).
```
npm install
# fill in the two publishable keys in .env (Supabase + Stripe, both pk_*)

# One-time: log in and link the EAS project.
npx eas-cli login          # or: npx eas login
npx eas init               # creates the project + writes extra.eas.projectId

# Build the Android dev client (cloud build; installs as an APK on the phone).
npx eas build --profile development --platform android
#   → open the QR / URL it prints on the phone and install the APK.
# (iOS dev client needs a registered device: npx eas device:create, then
#  npx eas build --profile development --platform ios.)

# Day-to-day: start the JS dev server and open the installed dev build.
npx expo start --dev-client   # scan the QR with the dev build (not Expo Go)
```
The dev-only design system preview is at the route `/dev/design` (there's a link
on the Home screen in dev builds). It is not reachable in production builds.

**EAS build profiles** (`eas.json`): `development` (dev client, internal, Android
APK), `preview` (internal APK, release JS), `production`. `development`/`preview`
point `EXPO_PUBLIC_API_URL` at staging; `production` has a placeholder to fill in
at launch. Cloud builds also need the two publishable keys — add them to each
profile's `env` (or as EAS env vars) before building, mirroring `.env`.

## Git & SSH
- Remote: `origin = git@github.com:AnnaAdams22/eSIM-mobile-app.git`. Day-to-day
  work is on `main`; feature work on `feat/*` branches.
- Git identity for this repo MUST be **`nomiich <naumanch456@gmail.com>`**. Check
  with `git config user.name` / `git config user.email` before committing; if
  either differs, set them **repo-locally** (`git config user.name "nomiich"`,
  `git config user.email "naumanch456@gmail.com"`). Never use another identity,
  and never change the global git config.
- For ANY git network command (push/pull/fetch), run it as ONE chained command
  so the right key is loaded:
  ```
  eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519_nomiich && git push ...
  ```
  If `ssh-add` asks for a passphrase or fails, STOP and ask the owner. Never
  change SSH config or remotes, and never switch to HTTPS.

## Status
**Task 1 complete** — project scaffolded (Expo SDK 57 + TS + expo-router),
approved dependencies installed, branding assets generated, full design system
(`src/theme`) and accessible UI kit (`src/components/ui`), navigation skeleton
(tabs + stack placeholders), typed API client + Supabase + React Query + i18n
wired, config with fail-fast validation, and a dev-only design preview.

**Task 2 complete** — the shopping screens (public catalog, no login):
- Data layer: `usePlans()` (React Query, 10-min stale time) + a pure,
  unit-tested catalog module at `src/features/catalog/` (grouping into
  destinations/regions, sorting, lowest-price, display formatting, a static
  ISO2→continent map with an "Other" fallback, and accent-insensitive search
  with aliases). Prices are always the backend's `*_display`/`*_cents` verbatim.
- Screens: Home, Destinations list (optimised `FlatList`), Destination detail
  (selectable plans + sticky Buy now → checkout placeholder), Explore. Each has
  loading / error / empty states, i18n keys only, theme tokens only, and a11y
  labels.
- Tests: `jest-expo` wired (`npm test`); unit tests cover grouping, sorting,
  lowest price, formatting, continent fallback and search.

**Task 3 complete** — native Stripe checkout + order success, and the move to a
development build:
- Dev build: `expo-dev-client` + `@stripe/stripe-react-native` (Stripe config
  plugin in `app.json`, merchant id `merchant.net.esimglobal.app`, Google Pay
  on), `eas.json` with development/preview/production profiles, and `.npmrc`
  (`legacy-peer-deps`) for cloud installs. `StripeProvider` wraps the app root
  (publishable key + `esimglobal://` url scheme).
- Checkout (`app/checkout.tsx`): plan summary, "Receipt sent to {email}", a
  collapsible promo code (POST `/api/me/promo/validate`, friendly error mapping,
  removable), a server-sourced order summary, and a navy "Pay now · €X.XX"
  button driving `initPaymentSheet`/`presentPaymentSheet` (CustomerSession via
  `customerId` + `customerSessionClientSecret`, themed appearance, Apple/Google
  Pay, return URL). One `client_request_id` (UUID) per attempt, reused on retry.
- Order success (`app/order-success.tsx`): polls
  `/api/me/orders/by-payment-intent/:id` every 2s (404 = processing); calm
  processing state, then QR on a white card, iOS one-tap install, manual SM-DP+ /
  activation details (copy + haptic), 60s timeout and failed/refund states.
  Reached via `router.replace` so "back" can't re-enter the paid checkout.
- Pure, unit-tested modules in `src/features/checkout/`: LPA parser, promo error
  mapping, the polling state machine, and the request-id-reuse holder (plus
  `src/lib/money.ts` EUR formatter mirroring the backend).

**Task 4 complete** — My eSIMs tab, eSIM detail with live usage, and in-app
top-up (branch `feat/my-esims`):
- My eSIMs tab (`app/(tabs)/esims.tsx`): Active/Past segmented list, one
  `EsimCard` per eSIM (flag, destination, plan, status badge, signal icon,
  shortened copyable ICCID, active-until/activation line), quick actions (Add
  eSIM / Top up / Support), empty + error + loading states, pull-to-refresh.
  Active vs Past is decided from LIVE usage, fetched per-ICCID (60s stale to
  match the backend cache); an eSIM is Past only when expired/failed/refunded,
  and stays Active (with a date skeleton) until its usage loads.
- eSIM detail (`app/esim/[iccid]/index.tsx`): usage card with an accessible
  `UsageMeter`, "{x} left of {y}", activated/expires dates and a relative "last
  updated" + refresh; the shared install section before activation; order
  history; a sticky Top up.
- Top-up (`app/esim/[iccid]/topup.tsx`): options with the same-plan
  "accumulates" option first, replace-confirmation before paying; reuses
  `app/checkout.tsx` in a **topup mode** (`iccid` + `acceptReplace`) which handles
  the backend's 409 `replace_confirmation_required` (confirm → retry with a NEW
  `client_request_id`); `app/order-success.tsx` reused for a no-QR "Top-up added"
  state that refetches usage and invalidates the eSIM queries.
- Shared/pure: install UI extracted to `src/components/esim/InstallSection.tsx`
  (QR, iOS one-tap, manual SM-DP+/activation copy) so checkout-success and detail
  share it; `resolveGeoDisplay` in `src/features/catalog`; pure, unit-tested
  `src/features/esims/` (Active/Past classification, MB/GB formatting, the
  replace-confirm decision, and the 409→confirm→retry flow). `ApiError` split to
  `src/lib/api-error.ts` so pure code imports it without Supabase.

`tsc --noEmit`, `expo lint` and `npm test` (146 tests) all pass; the app bundles
for iOS (`expo export`). Auth polish and install-guide deep links are still later
tasks.
