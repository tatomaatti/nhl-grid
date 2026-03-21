---
id: T02
parent: S04
milestone: M001
provides:
  - daily-game.js (Daily Grid -pelilogiikka, eriytetty)
  - daily.html (muokattu, inline-JS poistettu)
key_files:
  - daily-game.js
  - daily.html
key_decisions:
  - Script-tagien sijainti: players.js <head>:ssa (rivi 7), shared.js ja daily-game.js ennen </body> — selkeä latausjärjestys
patterns_established:
  - DB-puuttumisen tarkistus eriytetyn JS-tiedoston alussa (typeof DB === 'undefined' → throw)
  - Kategoriadata tulee shared.js:stä globaaleina, pelilogiikka ei toista niitä
observability_surfaces:
  - "Error: players.js not loaded — DB is undefined" konsolissa jos latausjärjestys virheellinen
  - "[MobileUX]" konsolilokit daily-game.js:ssä (visualViewport handler)
  - wc -l daily.html < 700 ja wc -l daily-game.js > 900 rakennetarkistukset
duration: 10m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T02: Eristä daily-game.js ja päivitä daily.html

**Siirretty daily.html:n inline-script (~1140 riviä) erilliseen daily-game.js-tiedostoon ja poistettu kategoriadata (tulee nyt shared.js:stä)**

## What Happened

Poimin daily.html:n inline `<script>`-blokin (rivit 641-1779) ja erotin siitä kategoriamäärittelyt (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS — rivit 642-722), jotka tulevat nyt T01:ssä luodusta shared.js:stä. Loput ~1056 riviä pelilogiikkaa (buildCategoryPool, PRNG, grid generation, game state, UI rendering, hints, share, practice, countdown, visualViewport handler) siirrettiin daily-game.js-tiedostoon.

daily-game.js:n alkuun lisättiin DB-olemassaolotarkistus (`if (typeof DB === 'undefined')`) joka antaa selkeän virheilmoituksen jos players.js ei lataudu ensin.

daily.html:n inline `<script>...</script>` -blokki korvattiin kahdella `<script src>` -tagilla (`shared.js` ja `daily-game.js`) ennen `</body>`. Latausjärjestys: players.js (head) → shared.js → daily-game.js.

## Verification

Kaikki 5 rakennetarkistusta ja selaintesti läpäisty:

1. `wc -l daily.html` = 644 (< 700) ✅
2. `wc -l daily-game.js` = 1065 (> 900) ✅
3. `grep -c "^<script src" daily.html` = 3 ✅
4. Ei `const TEAMS` -määrittelyä daily-game.js:ssä ✅
5. Ei inline `<script>` -blokkia daily.html:ssä ✅
6. Selaintesti: gridi renderöityy, pelaajanimet näkyvät, arvauslista aukeaa, 0 JS-virheitä konsolissa ✅

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `wc -l daily.html` → 644 | 0 | ✅ pass | <1s |
| 2 | `wc -l daily-game.js` → 1065 | 0 | ✅ pass | <1s |
| 3 | `grep -c "^<script src" daily.html` → 3 | 0 | ✅ pass | <1s |
| 4 | `grep -q "^const TEAMS" daily-game.js` → not found | 1 | ✅ pass | <1s |
| 5 | `grep -n "^<script>" daily.html` → not found | 1 | ✅ pass | <1s |
| 6 | `node -e "new Function(..."` syntax check | 0 | ✅ pass | <1s |
| 7 | Browser: grid renders, 0 JS errors, guess panel works | — | ✅ pass | 3s |

## Diagnostics

- **Syntaksivalidointi:** `node -e "try { new Function(require('fs').readFileSync('daily-game.js','utf8')); console.log('OK'); } catch(e) { console.log('FAIL:', e.message); }"`
- **Selaintesti:** Avaa daily.html DevToolsilla — 0 virheitä konsolissa. Klikkaa rivi/sarake-headeriä → arvauslista avautuu kategorioiden kanssa.
- **Latausjärjestys:** `grep "<script src" daily.html` → players.js, shared.js, daily-game.js (tässä järjestyksessä)

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `daily-game.js` — Uusi: Daily Grid -pelilogiikka (1065 riviä), eriytetty daily.html:stä
- `daily.html` — Muokattu: inline-script poistettu, <script src> -tagit lisätty (644 → 644 riviä)
- `.gsd/milestones/M001/slices/S04/tasks/T02-PLAN.md` — Lisätty Observability Impact -osio
