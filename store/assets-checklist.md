# Store assets checklist (images & sizes)

> Current store requirements as of this prep. **Verify against the live console at
> submission** — Apple/Google adjust required sizes over time. Dimensions below are
> the ones the consoles enforce today.

## App icon

| Store | Size | Format | Notes |
|---|---|---|---|
| **App Store (iOS)** | **1024 × 1024 px** | PNG, no alpha, no rounded corners | Uploaded in App Store Connect (or embedded via the build). |
| **Google Play** | **512 × 512 px** | 32-bit PNG | "App icon" in the store listing. |
| Adaptive icon (in-app, Android) | foreground/background/monochrome | PNG | Already configured in `app.json` (`android.adaptiveIcon`). |

> **Blocker (client):** the current logo/icon in `assets/` is a **temporary, low-res
> PNG** derived from `design/logo.png`. The official **high-res / vector logo** and a
> clean **1024×1024** master icon are still needed from the client. Do not recolour
> the logo. (See CLAUDE.md "Logo / brand assets — TODO".)

## Google Play feature graphic

- **1024 × 500 px**, PNG or JPEG, no transparency. Required for the Play listing.
  Use the brand ivory background with the wordmark; calm/premium, not busy.

## Screenshots

Capture on a real device or the correct simulator/emulator size. Portrait.

### iPhone (App Store requires at least the largest size; it can scale down)
| Set | Device class | Pixel size (portrait) |
|---|---|---|
| **6.9"** (required) | iPhone 16 Pro Max / 15 Pro Max class | **1320 × 2868** |
| **6.5"** (recommended/legacy) | iPhone 11 Pro Max / XS Max class | **1242 × 2688** |

- 3–10 screenshots per set. **iPad: not supported for v1.0** — `app.json` sets
  `ios.supportsTablet: false`, so no iPad screenshots are required.

### Android phone (Google Play)
- **2–8 screenshots**, PNG/JPEG, 16:9 or 9:16, min 320 px, max 3840 px on a side;
  e.g. **1080 × 1920** or **1080 × 2400**.

### Which 5–6 screens to capture (same set for both stores)
1. **Home** — hero + popular destinations (shows the brand).
2. **Destinations** — list with search / continent chips.
3. **Plan details** — a destination's plans with the Buy now pill.
4. **Checkout** — native Stripe PaymentSheet / order summary.
5. **Order success with QR** — the installable eSIM QR + install options.
6. **My eSIMs** — active eSIM card with the live usage meter.

> Tip: use the demo/reviewer account (see `review-notes.md`) so the My eSIMs and
> usage screens show real content. Capture one set per language if you want
> localised screenshots (EN at minimum; RU/DE/ES optional and marked draft).

## Optional / promotional
- **App preview video** (iOS) and **promo video** (Play): optional, skip for v1.0.
- Play **promo graphic** (180×120) is legacy/optional.

## Summary of what's blocked on the client
- Official high-res / vector **logo** + **1024×1024 icon** master.
- ~~Decision on **iPad** support for screenshots.~~ Resolved: iPad **not** supported
  for v1.0 (`ios.supportsTablet: false`).
- Final **screenshots** (need the production demo account and, ideally, real brand
  photos for the hero slots — all hero slots currently render brand-gradient
  placeholders; see CLAUDE.md "Hero images — TODO").
