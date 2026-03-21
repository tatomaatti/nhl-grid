---
id: T03
parent: S05
milestone: M001
provides:
  - index.html ja grid-game.js täysin lokalisoitu FI/EN (data-i18n + t()-kutsut)
  - Kielenvaihtopainike ristinollan settings-näkymässä
  - catHeaderHTML() käyttää catLang():ia lokalisoiduille kategorianäytöille
  - scripts/verify-s05.sh — koko S05-slicen verifiointiskripti (28 tarkistusta)
key_files:
  - lang.js
  - index.html
  - grid-game.js
  - scripts/verify-s05.sh
key_decisions:
  - catHeaderHTML() päivitetty käyttämään catLang() lokalisoiduille kategorianäytöille — grid-otsikoiden abbreviations ja descriptions vaihtuvat kielen mukaan
  - langChanged event guard tarkistaa G.cells && offsetParent (ei style.display) — estää JS-virheen kun kieltä vaihdetaan settings-näkymässä ennen pelin alkua
  - Emoji false-positivet (❤️, ℹ︎, 🤝) poistettu Finnish string check -skriptistä grep-filttereillä
patterns_established:
  - grid-game.js käyttää t()-kutsuja kaikkiin käyttäjälle näkyviin merkkijonoihin (~50 kohtaa)
  - index.html data-i18n-attribuutit (~30 elementtiä) kattavat settings, lobby, disconnect, game, surrender, win, round-overlay -näkymät
  - langChanged listener grid-game.js:ssä päivittää grid-otsikot, pelaajanimet ja vuorotekstin lennossa
observability_surfaces:
  - "[Lang] Applied language to N elements" — confirms DOM update count when language switches on index.html (N=46 total with daily keys)
  - "[Lang] Missing key: <key>" — reveals untranslated ristinolla strings in console
  - "getCurrentLang()" in browser console — returns current language code
  - "t('any_grid_key')" in browser console — tests any ristinolla translation
duration: 25m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T03: Lokalisoi index.html + grid-game.js ja luo verifiointiskripti

**Lokalisoitu ristinollapelin kaikki UI-tekstit (index.html data-i18n + grid-game.js t()-kutsut ~50 kohdassa), lisätty kielenvaihtopainike ja luotu 28-kohtainen S05-verifiointiskripti**

## What Happened

Added ~80 translation keys to lang.js covering all ristinolla UI: settings (17 keys), lobby (13), game (13), steal/hints (10), errors (4), results (18), disconnect (2), DB error (3).

Updated index.html: added `<script src="lang.js">` between shared.js and config.js, added `data-i18n` attributes to ~30 static text elements across settings, lobby, disconnect, game, surrender modal, win screen, and round overlay. Added language switch button (🇬🇧/🇫🇮) in settings screen top-right corner using same styling as daily.html.

Updated grid-game.js: replaced all ~50 hardcoded Finnish strings with `t()` calls — covering `clearGameUI()`, `updatePlayerLabels()`, `updateSeriesBar()`, `refreshUI()`, `clickCell()`, `validateAndApplyMove()`, `handleWrongGuess()`, `endTurn()`, timer timeout, `showRoundOverlay()`, `showSeriesEnd()`, `generateAndShowHint()`, `updateHintBar()`, `createOnlineGame()`, `joinOnlineGame()`, `copyRoomCode()`, `handleHostMessage()`, and `handleGuestMessage()`. Updated `catHeaderHTML()` to use `catLang()` for localized category abbreviations and descriptions. Added `langChanged` event listener that re-renders grid headers and updates player labels during active games.

Fixed a JS error where switching language on the settings screen (before game start) caused `Cannot read properties of undefined (reading 'filter')` because `G.cells` was undefined. Changed the guard from `style.display !== 'none'` to `G.cells && offsetParent !== null`.

Created `scripts/verify-s05.sh` with 28 checks covering lang.js content, script tag order, data-i18n counts, bug fixes, Finnish string absence, JS syntax, shared.js localization fields, language switch buttons, and langChanged event listeners.

## Verification

- `bash scripts/verify-s05.sh` — all 28/28 checks passed, exit 0
- `node -c lang.js && node -c grid-game.js` — syntax checks passed
- Browser test: index.html loads with Finnish text, language switch button shows 🇬🇧 EN
- Browser test: clicking 🇬🇧 EN switches all text to English ("Find the right player...", "Turn time limit", "Game settings", "Cell stealing", "Steals per player", etc.)
- Browser test: switching back to Finnish restores all text
- Browser test: starting local game shows all English text ("Player 1", "Player 2", "Turn: Player 1", "⚡ P1 steals:", "Select a cell first...", "FIND PLAYER", "Surrender")
- Browser test: no console errors after language switching fix (checked in both settings and game screens)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-s05.sh` | 0 | ✅ pass | 2s |
| 2 | `node -c lang.js` | 0 | ✅ pass | <1s |
| 3 | `node -c grid-game.js` | 0 | ✅ pass | <1s |
| 4 | Browser: FI settings text assertions | 7/7 | ✅ pass | 2s |
| 5 | Browser: EN settings text assertions (after switch) | 7/7 | ✅ pass | 2s |
| 6 | Browser: EN game screen assertions | 7/7 | ✅ pass | 2s |
| 7 | Browser: no console errors | 0 errors | ✅ pass | <1s |

## Diagnostics

- Filter browser console with `[Lang]` to see all language init/switch events on index.html
- `getCurrentLang()` in browser console returns current language code
- `t('steal_status', '2')` tests ristinolla-specific translation with parameter substitution
- `document.querySelectorAll('[data-i18n]').length` on index.html shows count of localizable elements (~30)
- Missing translation keys logged as `[Lang] Missing key: <key>` in console
- `bash scripts/verify-s05.sh` validates all S05 slice requirements in one command

## Deviations

- Added `catLang()` integration to `catHeaderHTML()` for localized grid header abbreviations/descriptions — not explicitly in the plan but necessary for category names to localize
- Fixed langChanged guard to use `G.cells && offsetParent` instead of `style.display` — discovered during browser testing that `style.display` returns empty string for CSS-hidden elements, not 'none'
- verify-s05.sh Finnish string check needed emoji exclusion filters (❤️, ℹ︎, 🤝) — multi-byte emoji sequences create false positives matching `[äöÄÖ]` pattern

## Known Issues

- config.js returns 404 (expected — this file is a TODO for Firebase migration)
- Online game language switching not tested (requires two browsers — UAT in S05 finale)
- DB error screen (players.js missing) uses `_t` fallback since lang.js may not be loaded when DB check runs at module scope

## Files Created/Modified

- `lang.js` — modified: added ~80 ristinolla translation keys (settings, lobby, game, steal/hints, errors, results, disconnect, DB error) to both FI and EN dictionaries
- `index.html` — modified: added lang.js script tag (after shared.js, before config.js), data-i18n attributes on ~30 elements, data-i18n-placeholder on search input, language switch button in settings
- `grid-game.js` — modified: replaced ~50 hardcoded Finnish strings with t() calls, updated catHeaderHTML to use catLang(), added langChanged event listener for live language switching, fixed DB error screen to use t()
- `scripts/verify-s05.sh` — new: 28-check S05 verification script (lang.js content, script order, data-i18n, bug fixes, Finnish strings, JS syntax, shared.js fields, lang-switch buttons, langChanged listeners)
