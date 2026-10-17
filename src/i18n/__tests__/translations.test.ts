/**
 * Translation-completeness guard.
 *
 * English is the source of truth. For every other shipped language this test
 * fails if a bundle:
 *   - is missing a key that English has, or has an extra key English doesn't,
 *   - has a message whose {{placeholders}} don't match English's, or
 *   - is missing a plural form that the language's grammar requires (Russian
 *     needs one/few/many/other; German and Spanish need one/other).
 *
 * It reads the same `resources` map the app uses, so adding a language is picked
 * up automatically. Keep it green — it is the safety net behind the machine-
 * generated drafts (see translations/README.md).
 */

import { resources } from '../resources';

/** i18next plural suffixes. */
const PLURAL_SUFFIXES = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;
const PLURAL_RE = new RegExp(`_(${PLURAL_SUFFIXES.join('|')})$`);

/**
 * Plural categories each language is REQUIRED to provide, per the client scope
 * (not CLDR's full set — e.g. CLDR gives Spanish a `many` category for large
 * numbers, but we only ship one/other). English is the reference.
 */
const REQUIRED_PLURAL_FORMS: Record<string, string[]> = {
  en: ['one', 'other'],
  de: ['one', 'other'],
  es: ['one', 'other'],
  ru: ['one', 'few', 'many', 'other'],
};

type Leaves = Record<string, string>;

/** Flatten a bundle to `path -> string`, indexing arrays by position. */
function flatten(value: unknown, prefix = '', out: Leaves = {}): Leaves {
  if (typeof value === 'string') {
    out[prefix] = value;
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  }
  return out;
}

/** The set of distinct placeholder names in a message, e.g. "{{count}} of {{x}}" → {count,x}. */
function placeholders(message: string): Set<string> {
  const set = new Set<string>();
  for (const m of message.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) set.add(m[1]);
  return set;
}

function pluralBase(key: string): { base: string; form: string } | null {
  const m = key.match(PLURAL_RE);
  if (!m) return null;
  return { base: key.slice(0, key.length - m[0].length), form: m[1] };
}

const EN = flatten(resources.en.translation);

/** English non-plural leaf keys, and the set of plural "bases". */
const enPluralBases = new Set<string>();
const enSingularKeys = new Set<string>();
for (const key of Object.keys(EN)) {
  const p = pluralBase(key);
  if (p) enPluralBases.add(p.base);
  else enSingularKeys.add(key);
}

const otherLangs = Object.keys(resources).filter((l) => l !== 'en');

describe('translation completeness', () => {
  it('knows the required plural forms for every shipped language', () => {
    for (const lang of Object.keys(resources)) {
      expect(REQUIRED_PLURAL_FORMS[lang]).toBeDefined();
    }
  });

  it.each(otherLangs)('%s: has no missing or extra keys', (lang) => {
    const leaves = flatten(resources[lang as keyof typeof resources].translation);
    const keys = new Set(Object.keys(leaves));

    // Every English singular key must exist.
    const missing = [...enSingularKeys].filter((k) => !keys.has(k));
    expect({ lang, missing }).toEqual({ lang, missing: [] });

    // No extra keys: each key is either an English singular key, or a valid
    // plural form of an English plural base.
    const extra = [...keys].filter((k) => {
      if (enSingularKeys.has(k)) return false;
      const p = pluralBase(k);
      return !(p && enPluralBases.has(p.base));
    });
    expect({ lang, extra }).toEqual({ lang, extra: [] });
  });

  it.each(otherLangs)('%s: placeholders match English', (lang) => {
    const leaves = flatten(resources[lang as keyof typeof resources].translation);

    // Singular keys: compare directly.
    const mismatches: { key: string; en: string[]; got: string[] }[] = [];
    for (const key of enSingularKeys) {
      if (leaves[key] == null) continue; // reported by the missing-keys test
      const en = placeholders(EN[key]);
      const got = placeholders(leaves[key]);
      if (en.size !== got.size || [...en].some((p) => !got.has(p))) {
        mismatches.push({ key, en: [...en], got: [...got] });
      }
    }

    // Plural keys: every form must carry English's placeholder set for that base.
    for (const base of enPluralBases) {
      const enForms = Object.keys(EN)
        .map(pluralBase)
        .filter((p): p is { base: string; form: string } => !!p && p.base === base);
      const enSet = placeholders(EN[`${base}_${enForms[0].form}`]);
      for (const form of REQUIRED_PLURAL_FORMS[lang]) {
        const msg = leaves[`${base}_${form}`];
        if (msg == null) continue; // reported by the plural-forms test
        const got = placeholders(msg);
        if (enSet.size !== got.size || [...enSet].some((p) => !got.has(p))) {
          mismatches.push({ key: `${base}_${form}`, en: [...enSet], got: [...got] });
        }
      }
    }

    expect({ lang, mismatches }).toEqual({ lang, mismatches: [] });
  });

  it.each(otherLangs)('%s: has every required plural form', (lang) => {
    const leaves = flatten(resources[lang as keyof typeof resources].translation);
    const required = REQUIRED_PLURAL_FORMS[lang];

    const problems: { base: string; missing: string[] }[] = [];
    for (const base of enPluralBases) {
      const missing = required.filter((form) => leaves[`${base}_${form}`] == null);
      if (missing.length) problems.push({ base, missing });
    }
    expect({ lang, problems }).toEqual({ lang, problems: [] });
  });
});
