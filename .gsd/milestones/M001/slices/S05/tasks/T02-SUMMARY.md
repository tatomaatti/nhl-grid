---
id: T02
parent: S05
milestone: M001
provides:
  - lang.js lokalisaatiojärjestelmä (STRINGS.fi/en, t(), getCurrentLang(), setLang(), applyLanguage())
  - daily.html ja daily-game.js täysin lokalisoitu FI/EN
  - shared.js:n NATS/AWARDS/SPECIALS/TEAMS sisältävät englanninkieliset kentät (name_en, group_en, abbr_en, desc_en)
  - catLang() apufunktio lokalisoidun kategoriadata:n hakuun
key_files:
  - lang.js
  - shared.js
  - daily.html
  - daily-game.js
key_decisions:
  - Lokalisaatio toteutettu data-i18n-attribuuteilla (staattinen teksti) + t()-kutsuilla (dynaaminen JS-teksti) — yksinkertainen, ei vaadi build-vaihetta
  - Kansallisuusnimet ja kategoriaryhmät lokalisoitu shared.js:n name_en/group_en/abbr_en -kenttien kautta, ei STRINGS-sanakirjasta — välttää duplikaation ja pitää lähdedatan lähellä
  - catLang(info) apufunktio shared.js:ssä palauttaa lokalisoidun version mistä tahansa kategoriaobjektista
  - Joukkue- ja palkintonimet (Hart Trophy, EDM, Stanley Cup) pysyvät englanniksi molemmilla kielillä — ne ovat virallisia NHL-nimiä
patterns_established:
  - "[Lang]"-prefixoidut konsolilokit kaikissa kielenvaihto-eventeissä
  - data-i18n attribuutti staattisille teksteille, data-i18n-placeholder input-elementeille
  - langChanged custom event mahdollistaa game-tiedostojen reagoinnin kielenvaihtoon
  - buildCategoryPool() lukee getCurrentLang():n ja palauttaa lokalisoidun kategoriadatan
observability_surfaces:
  - "[Lang] Initialized: fi" — confirms language detection on page load
  - "[Lang] Language set: en" — confirms setLang() was called
  - "[Lang] Applied language to N elements" — confirms DOM update count
  - "[Lang] Missing key: <key>" — warns about untranslated strings
  - localStorage.getItem('nhl-grid-lang') — returns current language code
  - getCurrentLang() — global function returns current language
duration: 25m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T02: Luo lokalisaatiojärjestelmä (lang.js) ja lokalisoi daily.html + daily-game.js

**Luotu lang.js lokalisaatiojärjestelmä (FI/EN sanakirjat, t()-funktio, data-i18n DOM-päivitys, localStorage-persistenssi) ja lokalisoitu daily.html + daily-game.js kokonaan — kielenvaihtopainike vaihtaa kaiken tekstin lennossa**

## What Happened

Created `lang.js` with the full localization system: `STRINGS.fi` and `STRINGS.en` dictionaries (~40 keys each covering daily game UI), `t(key, ...args)` function with `{0}`/`{1}` parameter substitution, `getCurrentLang()`, `setLang(code)`, and `applyLanguage()` which updates all `[data-i18n]` and `[data-i18n-placeholder]` elements. Missing keys return the key itself and log `[Lang] Missing key: <key>`. Language switch button updates its label and aria-label. Default language detected from `navigator.language` with localStorage override.

Updated `shared.js`: added `name_en`, `abbr_en`, `group_en` to NATS; `desc_en`, `group_en` to AWARDS; `name_en`, `group_en` to SPECIALS; `group_en` to TEAMS. Added `catLang(info)` helper function that returns localized group/name/abbr/desc based on `getCurrentLang()`.

Updated `daily.html`: added `<script src="lang.js">` between shared.js and daily-game.js, added `data-i18n` attributes to 22 static text elements (loading text, hint banner, progress bar, end screen stats/labels, share/practice buttons, tomorrow messages, played screen, nav links), added `data-i18n-placeholder` to search input, added language switch button (🇬🇧/🇫🇮) in daily header.

Updated `daily-game.js`: replaced all hardcoded Finnish strings with `t()` calls (status messages, end screen text, practice label, puzzle fail message, guess panel title, no-results text, used/tried labels, copied confirmation). Updated `buildCategoryPool()` to produce localized category names/groups/abbrs based on current language. Updated `getDailyDateLabel()` to use locale-appropriate date formatting. Added `langChanged` event listener that rebuilds category pool, updates date label, re-localizes solved category headers, and re-renders grid/guess panel.

## Verification

- `node -c lang.js && node -c shared.js && node -c daily-game.js` — all three files parse without errors
- `grep -q "data-i18n" daily.html` — data-i18n attributes found (22 elements)
- `grep -q "lang.js" daily.html` — script tag found
- `grep -q "STRINGS" lang.js` — dictionaries found
- Browser test: daily.html loads with Finnish default (date "21. maaliskuuta 2026", "kategoriaa arvattu", "Sarake 1", "Rivi 1")
- Browser test: clicking 🇬🇧 EN switches all text to English ("March 21, 2026", "categories guessed", "Column 1", "Row 1")
- Browser test: guess panel shows localized content ("What connects:", "Search categories...", "TEAM", "NATIONALITY", "AWARD", "SPECIAL", "Canada", "Finland" etc.)
- Browser test: switching back to Finnish restores all text correctly
- `localStorage.getItem('nhl-grid-lang')` returns current language code after switch
- `getCurrentLang()` returns current language as global function
- No hardcoded Finnish strings remain in daily-game.js (verified with grep)
- `node -c grid-game.js` — shared.js changes don't break existing code

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node -c lang.js` | 0 | ✅ pass | <1s |
| 2 | `node -c shared.js` | 0 | ✅ pass | <1s |
| 3 | `node -c daily-game.js` | 0 | ✅ pass | <1s |
| 4 | `node -c grid-game.js` | 0 | ✅ pass | <1s |
| 5 | `grep -q "data-i18n" daily.html` | 0 | ✅ pass | <1s |
| 6 | `grep -q "lang.js" daily.html` | 0 | ✅ pass | <1s |
| 7 | `grep -q "STRINGS" lang.js` | 0 | ✅ pass | <1s |
| 8 | Browser: FI default text assertions | 5/5 | ✅ pass | 2s |
| 9 | Browser: EN switch assertions | 4/4 | ✅ pass | 2s |
| 10 | Browser: localStorage persistence | OK | ✅ pass | <1s |

## Diagnostics

- Filter browser console with `[Lang]` to see all language init/switch events
- `getCurrentLang()` in browser console returns current language code
- `localStorage.getItem('nhl-grid-lang')` shows persisted language preference
- `document.querySelectorAll('[data-i18n]').length` shows count of localizable elements
- Missing translation keys logged as `[Lang] Missing key: <key>` in console
- `t('any_key')` in browser console tests translation for current language

## Deviations

- Added `progress_suffix` key instead of using `progress_format` for the progress bar suffix text — the HTML structure uses `<span>N</span>/6 suffix` pattern which doesn't fit a single `{0}/6 text` format string cleanly
- Added `catLang()` helper in shared.js to centralize localized field access — not in original plan but needed to avoid duplicating language detection logic across files
- Added `langChanged` event listener in daily-game.js to rebuild category pool on language switch — not explicitly in plan but necessary for the guess panel to update when language changes mid-game

## Known Issues

- verify-s05.sh doesn't exist yet — will be created in T03
- Nationality search in guess panel matches on localized names only (e.g. "Kanada" in FI, "Canada" in EN) — this is intentional behavior

## Files Created/Modified

- `lang.js` — new: localization system with STRINGS.fi/en, t(), getCurrentLang(), setLang(), applyLanguage(), auto-init on DOMContentLoaded
- `shared.js` — modified: added name_en/abbr_en/group_en/desc_en to NATS/AWARDS/SPECIALS/TEAMS, added catLang() helper
- `daily.html` — modified: added lang.js script tag, data-i18n/data-i18n-placeholder attributes on 22+ elements, language switch button in header
- `daily-game.js` — modified: all Finnish strings replaced with t() calls, buildCategoryPool() localized, getDailyDateLabel() locale-aware, langChanged event listener for live language switching
