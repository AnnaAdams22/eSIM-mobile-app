# Brand assets

These are the **official client logo** files, derived from the high-resolution
source the client supplied (`design/logo-hires.png`, 2048×2048). The source is a
pure-black logo whose shape lives entirely in its alpha channel, so the
"background" is already transparent — nothing was keyed out, recoloured or
reshaped. We only split and tightly crop it. The logo keeps its own colour (black).

| File | Contents | Intrinsic size (px) |
| --- | --- | --- |
| `esim-logo-full.png` | symbol + "ESIM GLOBAL" wordmark | 1802 × 1187 |
| `esim-logo-symbol.png` | interlocking-e mark only | 1368 × 851 |
| `esim-logo-wordmark.png` | "ESIM GLOBAL" wordmark only | 1802 × 194 |

Also generated from the **symbol** (centred with padding on the ivory background
`#F4F1EC`, or transparent where noted):
- `../icon.png` — 1024×1024, **opaque** ivory (store requirement).
- `../splash-icon.png` — 1024×1024, symbol on ivory.
- `../favicon.png` — 48×48, symbol on ivory.
- `../android-icon-foreground.png` — 1024×1024, symbol on **transparent**, inside
  the adaptive-icon safe zone; `../android-icon-background.png` — solid ivory;
  `../android-icon-monochrome.png` — symbol silhouette on transparent (themed icon).
- `../notification-icon.png` — 96×96, **white silhouette on transparent** (Android
  renders the notification status-bar icon as a flat monochrome mask, tinted with
  the `#1C2430` colour set in `app.json`).

Store copies live in `../../store/assets/` (`icon-1024.png` for the App Store,
`icon-512.png` for Google Play).

To regenerate from a new source, the deterministic pipeline is documented inline
in the commit that introduced these assets (PIL: source alpha → pure-black →
auto-split symbol/wordmark by the empty row gap → compose per target).

## Future improvement

A vector **SVG** master from the client would still be ideal (crisper at every
size, smaller icon pipeline). Keep the same file names when swapping so the `Logo`
component and `app.json` need no code changes. If aspect ratios change, update the
`ASPECT` map in `src/components/ui/Logo.tsx`.
