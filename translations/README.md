# Translations

The app ships four languages. English is the **source of truth and fallback**;
the other three are **machine-generated drafts that need native review** before
release.

| Code | Language | Native name | Status |
| ---- | -------- | ----------- | ------ |
| `en` | English  | English     | source |
| `ru` | Russian  | Русский     | **draft — needs native review** |
| `de` | German   | Deutsch     | **draft — needs native review** |
| `es` | Spanish  | Español     | **draft — needs native review** |

The bundles themselves live in [`src/i18n/`](../src/i18n) (`en.json`, `ru.json`,
`de.json`, `es.json`), registered in [`src/i18n/resources.ts`](../src/i18n/resources.ts).

## What "draft" means

`ru`, `de` and `es` were produced with machine assistance against `en.json`:
natural, concise app language (not literal), consistent terminology, "eSIM" kept
verbatim, matching `{{placeholders}}`, and the correct i18next plural forms for
each language (Russian: one/few/many/other; German and Spanish: one/other). They
are **not yet reviewed by a native speaker** — wording, tone and a few
context-specific menu names (e.g. the on-device iOS/Android settings paths in the
install hints) should be checked before launch.

## Guardrails

`src/i18n/__tests__/translations.test.ts` fails CI if any language is missing a
key, has an extra key, has mismatched `{{placeholders}}`, or is missing a plural
form it needs. Keep it green.

## Adding or removing a language

1. Add (or delete) `src/i18n/<code>.json`, mirroring **every** key in `en.json`
   (same placeholders; the plural forms the language needs).
2. Register (or remove) it in `src/i18n/resources.ts` — one `import` + one entry
   in the `translations` map.
3. Add (or remove) the entry in `AVAILABLE_LANGUAGES` in
   `src/features/settings/language.ts` (`{ code, label }`, label = native name).
4. Add country-name data by registering the matching
   [`i18n-iso-countries`](https://www.npmjs.com/package/i18n-iso-countries) locale
   in `src/features/catalog/countryNames.ts` (and list it in
   `COUNTRY_NAME_LOCALES`).
5. Update this table and run `npm test`.

No screen or component code changes are needed — the Language screen, the startup
resolver and every formatter read from the lists above.

## Not translated yet (follow-ups)

- **Backend / auth emails** (eSIM delivery, refund, top-up, Supabase auth) stay
  English — they're owned by `../esim-backend`, not this app.
- **Legal pages** (Terms, Privacy, Refund) live on the website; translated
  versions would need to be produced there.
- **RTL languages** (Arabic, Hebrew) are out of scope — see CLAUDE.md for what
  adding them would require.
