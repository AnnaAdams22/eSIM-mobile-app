/**
 * Image registry — the single place that maps an image "slot" (or a country ISO2)
 * to a real, licensed photo bundled in `assets/images/`.
 *
 * LICENSING: every photo here is sourced from Unsplash or Pexels under their free
 * licences; attribution is recorded in `assets/images/CREDITS.md`. A slot left
 * `null` falls back to a tasteful brand gradient (see `<HeroImage>`), so the app
 * still looks intentional if a photo is ever missing.
 *
 * To change a photo: drop the file into `assets/images/` and point the slot/ISO2
 * entry at its `require(...)`. No other code change is needed.
 */

import type { ImageSourcePropType } from 'react-native';

export type HeroSlot =
  | 'home'
  | 'destinationDefault'
  | 'continent:Europe'
  | 'continent:Asia'
  | 'continent:Americas'
  | 'continent:Africa'
  | 'continent:Middle East'
  | 'continent:Oceania'
  | 'support:banner';

/** Slot → photo. Keys are stable so each swap is a one-line edit. */
const HERO_IMAGES: Record<HeroSlot, ImageSourcePropType | null> = {
  home: require('../../../assets/images/hero-home.jpg'),
  destinationDefault: require('../../../assets/images/hero-destination-default.jpg'),
  'continent:Europe': require('../../../assets/images/hero-europe.jpg'),
  'continent:Asia': require('../../../assets/images/hero-asia.jpg'),
  'continent:Americas': require('../../../assets/images/hero-americas.jpg'),
  'continent:Africa': require('../../../assets/images/hero-africa.jpg'),
  'continent:Middle East': require('../../../assets/images/hero-middle-east.jpg'),
  'continent:Oceania': require('../../../assets/images/hero-oceania.jpg'),
  // No licensed photo yet → renders the brand gradient. Drop in a warm
  // support/travel photo (hero-support.jpg) here when available; no other change.
  'support:banner': null,
};

/**
 * Per-country photos, keyed by uppercase ISO2. Used for the Home "popular" row
 * thumbnails and the destination-detail hero. Any country not listed falls back to
 * the generic `destinationDefault` photo.
 */
const DEST_IMAGES: Record<string, ImageSourcePropType> = {
  FR: require('../../../assets/images/dest-fr.jpg'),
  IT: require('../../../assets/images/dest-it.jpg'),
  ES: require('../../../assets/images/dest-es.jpg'),
  US: require('../../../assets/images/dest-us.jpg'),
  GB: require('../../../assets/images/dest-gb.jpg'),
  TR: require('../../../assets/images/dest-tr.jpg'),
  AE: require('../../../assets/images/dest-ae.jpg'),
  JP: require('../../../assets/images/dest-jp.jpg'),
  TH: require('../../../assets/images/dest-th.jpg'),
  DE: require('../../../assets/images/dest-de.jpg'),
};

/**
 * The photo for a hero slot, or null when none is supplied (→ gradient fallback).
 * Accepts any string (e.g. a computed `continent:${name}` key); unknown → null.
 */
export function heroImage(slot: HeroSlot | string): ImageSourcePropType | null {
  return HERO_IMAGES[slot as HeroSlot] ?? null;
}

/**
 * The bespoke photo for a country (by ISO2), or null when none exists. Use for
 * small thumbnails that should fall back to the flag rather than a generic photo.
 */
export function countryPhoto(iso2: string | null | undefined): ImageSourcePropType | null {
  if (!iso2) return null;
  return DEST_IMAGES[iso2.toUpperCase()] ?? null;
}

/**
 * The photo for a country (by ISO2), falling back to the generic destination
 * photo. Use for the full-bleed detail hero, which always wants a photo.
 * Returns null only if even the default is unavailable (→ gradient).
 */
export function destinationImage(iso2: string | null | undefined): ImageSourcePropType | null {
  return countryPhoto(iso2) ?? HERO_IMAGES.destinationDefault ?? null;
}
