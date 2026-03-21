---
id: T03
parent: S04
milestone: M001
provides:
  - grid-game.js (Ristinolla-pelilogiikka, eriytetty)
  - index.html (muokattu, inline-JS poistettu)
  - scripts/verify-s04.sh (slicen verifiointiskripti)
key_files:
  - grid-game.js
  - index.html
  - scripts/verify-s04.sh
key_decisions:
  - Script-tagien järjestys index.html:ssä: players.js → shared.js → config.js → peerjs CDN → grid-game.js — PeerJS ennen grid-game.js:ää koska Peer-luokkaa käytetään heti
patterns_established:
  - verify-s04.sh tarkistaa koko slicen tilan yhdellä ajolla: tiedostot, rivimäärät, inline-JS:n puuttuminen, script-tagien järjestys, jaettujen globaalien sijainti, syntaksivalidointi
  - Eriytetyn JS-tiedoston DB-tarkistus alussa (typeof DB === 'undefined') + DOM-virheilmoitus käyttäjälle — johdonmukainen malli daily-game.js:n kanssa
observability_surfaces:
  - "bash scripts/verify-s04.sh" — 27 tarkistusta koko slicen tilasta
  - "Error: players.js not loaded — DB is undefined" konsolissa jos latausjärjestys virheellinen
  - "[MobileUX]" konsolilokit grid-game.js:ssä (visualViewport handler)
duration: 15m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T03: Eristä grid-game.js, päivitä index.html ja luo verify-s04.sh

**Siirretty index.html:n inline-script (~1460 riviä) erilliseen grid-game.js-tiedostoon, poistettu kategoriadata ja ICE_CONFIG (tulevat shared.js/config.js:stä), ja luotu slicen verifiointiskripti scripts/verify-s04.sh**

## What Happened

Poimin index.html:n inline `<script>`-blokin (rivit 919-2376, 1456 riviä) ja erotin siitä:
- TEAMS/NATS/AWARDS-määrittelyt (rivit 937-987) → tulevat nyt shared.js:stä
- ICE_CONFIG (rivit 1896-1907) → tulee nyt config.js:stä
- DB-puuttumisen tarkistus (rivit 921-935) → siirretty grid-game.js:n alkuun, päivitetty viittaamaan `index.html` (ei `nhl-grid.html`)

Jäljelle jäänyt ~1394 riviä pelilogiikkaa (catInfo, catHeaderHTML, playerMatchesCat, grid generation, game state, cell interaction, search, submit, timer, win check, round/series management, hints, PeerJS networking, URL auto-join, visualViewport handler) siirrettiin grid-game.js:ään.

index.html:n inline-script korvattiin viidellä `<script src>` -tagilla oikeassa latausjärjestyksessä: players.js → shared.js → config.js → peerjs CDN → grid-game.js.

Lopuksi luotiin scripts/verify-s04.sh joka tarkistaa koko slicen tilan: 27 tarkistusta kattaen tiedostojen olemassaolon, rivimäärät, inline-JS:n puuttumisen, script-tagien järjestyksen, jaettujen muuttujien sijainnin, syntaksivalidoinnin ja duplikaattien puuttumisen.

## Verification

Kaikki tarkistukset läpäisty:

1. `bash scripts/verify-s04.sh` — 27/27 PASS, exit 0 ✅
2. `wc -l index.html` = 923 (< 950) ✅
3. `wc -l grid-game.js` = 1394 (> 1200) ✅
4. Selaintesti index.html: lobby näkyy, offline-peli käynnistyy, gridi renderöityy, pelaajahaku toimii (Gretzky-haku palauttaa tuloksia), 0 JS-virheitä konsolissa ✅
5. Selaintesti daily.html: gridi renderöityy, päivämäärä ja pelaajat näkyvät (regressiotesti) ✅
6. Node.js syntaksivalidointi: `new Function(...)` grid-game.js → OK ✅

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-s04.sh` (27 checks) | 0 | ✅ pass | 1s |
| 2 | `wc -l index.html` → 923 | 0 | ✅ pass | <1s |
| 3 | `wc -l grid-game.js` → 1394 | 0 | ✅ pass | <1s |
| 4 | `node -e "new Function(require('fs').readFileSync('grid-game.js','utf8'))"` | 0 | ✅ pass | <1s |
| 5 | Browser: index.html → start game → grid renders, search works | — | ✅ pass | 3s |
| 6 | Browser: `browser_assert` 6/6 checks (no_console_errors, no_failed_requests, text/selector visible) | — | ✅ pass | 1s |
| 7 | Browser: daily.html renders correctly (regression) | — | ✅ pass | 2s |

## Diagnostics

- **Slicen kokonaistila:** `bash scripts/verify-s04.sh` — 27 tarkistusta: tiedostot, rivimäärät, script src -tagit, inline-JS poissa, jaetut muuttujat oikeissa tiedostoissa, syntaksivalidointi, ei duplikaatteja
- **Syntaksivalidointi:** `node -e "try { new Function(require('fs').readFileSync('grid-game.js','utf8')); console.log('OK'); } catch(e) { console.log('FAIL:', e.message); }"`
- **Selaintesti:** Avaa index.html DevToolsilla — 0 virheitä konsolissa. Klikkaa "▶ PAIKALLINEN" → gridi renderöityy, pelaajahaku toimii
- **Latausjärjestys:** `grep "<script src" index.html` → players.js, shared.js, config.js, peerjs CDN, grid-game.js

## Deviations

- verify-s04.sh:n inline-script tarkistus muokattu käyttämään grep-putkea `grep -q '^<script>' | grep -q 'src='` -logiikalla `grep -c '^<script>$'`:n sijaan — Windows/bash `wc -l` tuottaa `\r\n` -rivinvaihtoja jotka rikkovat `[ "$VAR" -eq 0 ]` -vertailun
- verify-s04.sh:n script-tagien järjestyksen näyttö muokattu käyttämään `sed` `grep -oP`:n sijaan — `-P` (PCRE) ei tuettu Git Bash:n grepissä

## Known Issues

None.

## Files Created/Modified

- `grid-game.js` — Uusi: Ristinolla-pelilogiikka (1394 riviä), eriytetty index.html:stä
- `index.html` — Muokattu: inline-script poistettu, <script src> -tagit lisätty (2378 → 923 riviä)
- `scripts/verify-s04.sh` — Uusi: S04-slicen verifiointiskripti (27 tarkistusta)
- `.gsd/milestones/M001/slices/S04/tasks/T03-PLAN.md` — Lisätty Observability Impact -osio
