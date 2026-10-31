# Contributing translations

Thank you for helping localize Paglora. Please contribute through a GitHub **pull request** from your fork, not as a downloadable ZIP attached to an issue.

## New-language starter

From your fork, run `node scripts/new-locale.mjs fr "Français" "French"` to create `locales/fr.json` with an empty `messages` map. To use right-to-left text metadata, append `rtl` as the fourth argument, for example for Arabic. Copy only the keys you can translate from `locales/en.json`, then run `node scripts/validate.mjs` and `node scripts/coverage.mjs`. Missing keys fall back to English. Do **not** submit an empty pack as a complete translation.

## Checklist

- [ ] My locale uses a valid `ll` or `ll-RR` language code and correctly declares text direction.
- [ ] I changed translated **values only**; all keys exist in `locales/en.json`.
- [ ] I preserved all `{namedPlaceholders}` unchanged.
- [ ] I removed unfinished English values from partial locale files.
- [ ] I checked clarity, accessibility, spelling, punctuation and terminology with a native speaker.
- [ ] I ran `node scripts/validate.mjs` and `node --test` (or checked the PR CI results).
- [ ] My PR says whether this is a **new language**, **update**, or **correction**.

### How submissions are reviewed

CI checks JSON shape, names, duplicate/unknown keys, placeholders and suspicious markup. CI **cannot verify whether translations are linguistically correct**. Maintainers can request native-language review; high-traffic translations can require a second human reviewer. A merged catalog is eligible for the next Paglora language snapshot, not an instant update to previously published installers.

### Translation principles

Translate the intent rather than the English sentence order. Preserve technical terms such as Paglora, Markdown and GitHub where necessary. Keep button text short; make error text actionable. Variables such as `{date}` and `{query}` are interpolated by Paglora. Avoid raw HTML, inline Markdown, and printf-style placeholders.

### Issue versus pull request

Open a **Language request** issue to suggest a locale or coordinate with other translators; open a **Translation problem** issue to flag incorrect terminology. When your translation JSON is ready, **open a pull request directly**. Fork links in issues are only a fallback for people who cannot use PRs.

### English source changes

If you want to add new UI keys, create an issue in the [Paglora app repository](https://github.com/m1nsook/paglora/issues). Introduce the English key before updating other language catalogs. Keep keys stable.
