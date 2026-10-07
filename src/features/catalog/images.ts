/**
 * Hero image registry — the single place that maps an image "slot" to a real,
 * licensed photo.
 *
 * COPYRIGHT: we ship NO stock photos we don't have a licence for. Every slot is
 * `null` today, so `<HeroImage>` renders a tasteful brand gradient placeholder.
 * To drop in a real photo later with NO other code change:
 *   1. add the file to `assets/images/` (e.g. `hero-europe.jpg`), and
 *   2. set the slot below to `require('../../../assets/images/hero-europe.jpg')`.
 *
 * The slots that need real photography are also listed in CLAUDE.md.
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
  | 'continent:Oceania';

/**
 * Slot → photo. All null until licensed photography is supplied. Keys are stable
 * so the swap is a one-line edit per slot.
 */
const HERO_IMAGES: Record<HeroSlot, ImageSourcePropType | null> = {
  home: null,
  destinationDefault: null,
  'continent:Europe': null,
  'continent:Asia': null,
  'continent:Americas': null,
  'continent:Africa': null,
  'continent:Middle East': null,
  'continent:Oceania': null,
};

/**
 * The real photo for a slot, or null when none is supplied yet. Accepts any
 * string (e.g. a computed `continent:${name}` key); unknown slots resolve to null.
 */
export function heroImage(slot: HeroSlot | string): ImageSourcePropType | null {
  return HERO_IMAGES[slot as HeroSlot] ?? null;
}
