# Brand assets (TEMPORARY)

These logo files were derived programmatically from `design/logo.png` (the
client's supplied logo). The source PNG already had a transparent background in
its palette; these crops only **remove stray background data and tightly crop** —
no shapes were redrawn or recoloured. The logo keeps its own colour (black).

| File | Contents | Intrinsic size (px) |
| --- | --- | --- |
| `esim-logo-full.png` | symbol + "ESIM GLOBAL" wordmark | 182 × 129 |
| `esim-logo-symbol.png` | interlocking-e mark only | 154 × 98 |
| `esim-logo-wordmark.png` | "ESIM GLOBAL" wordmark only | 182 × 21 |

Also generated from the symbol (on the ivory background `#F4F1EC`):
`../icon.png`, `../splash-icon.png`, `../favicon.png`,
`../android-icon-foreground.png`, `../android-icon-background.png`,
`../android-icon-monochrome.png`.

`../notification-icon.png` is a **TEMPORARY** push-notification status-bar icon:
a white-on-transparent 96×96 silhouette of the symbol (Android renders it as a
flat monochrome mask, tinted with the `#1C2430` colour set in `app.json`).
Replace it with the official logo's silhouette at the same path — no code change
needed (`app.json`'s `expo-notifications` plugin references this path).

## ⚠️ TODO before release

**Replace with official SVG / high-res transparent logo files from the client.**
Keep the same file names so the swap needs no code changes (the `Logo` component
and `app.json` reference these paths). If the aspect ratios change, update the
`ASPECT` map in `src/components/ui/Logo.tsx`.
