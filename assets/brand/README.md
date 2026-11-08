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

### White variants (for the `navy` launch style)

Recoloured copies of the three logos for use on a dark background — the logo's
**shape is untouched**; only the ink is set to white, preserving the smooth alpha
edges (`convert in.png -channel RGB -evaluate set 100% +channel out.png`, which
sets the RGB channels to white while leaving the alpha channel exactly as-is).
Same intrinsic sizes as their black counterparts above.

| File | Contents |
| --- | --- |
| `esim-logo-full-white.png` | white symbol + wordmark |
| `esim-logo-symbol-white.png` | white symbol only |
| `esim-logo-wordmark-white.png` | white "ESIM GLOBAL" wordmark only |

These are used by the animated launch intro (`src/components/LaunchIntro.tsx`)
when `LAUNCH_STYLE` is `navy`. See CLAUDE.md § "Launch intro (animated opening)".

Also generated from the **symbol** (centred with padding on the ivory background
`#F4F1EC`, or transparent where noted):
- `../icon.png` — 1024×1024, **opaque** ivory (store requirement).
- `../splash-icon.png` — 1024×1024, black symbol on **opaque ivory** `#F4F1EC`
  (native splash + the ivory launch intro). The symbol is scaled to ~59% of the
  canvas so it sits comfortably inside Android 12+'s circular splash mask.
- `../splash-icon-navy.png` — 1024×1024, white symbol on **opaque navy** `#1C2430`
  (native splash + launch intro when `LAUNCH_STYLE` is `navy`). Same symbol scale.
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
