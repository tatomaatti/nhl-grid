---
id: T02
parent: S02
milestone: M001
provides:
  - End-to-end browser verification that rebuilt players.js works in both game modes
key_files:
  - daily.html
  - index.html
  - players.js
key_decisions: []
patterns_established:
  - Cell class in ristinolla is `.cell` (not `.grid-cell`), selectable by id `cell-0` through `cell-8`
  - Search input `#search-input` is disabled until a cell is selected
observability_surfaces:
  - "Browser console: 0 JS errors confirms players.js loads correctly"
  - "browser_evaluate('DB.length') returns 5880 on both pages"
  - "Daily grid renders player names in cells (Gretzky, Jagr, Lemieux visible in grid #7)"
duration: 10m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T02: Integraatiotesti — pelit lataavat rebuildityn DB:n

**Molemmat pelimuodot (daily.html, index.html) lataavat rebuildityn players.js:n ongelmitta, DB.length === 5880, pelaajahaku toimii**

## What Happened

Käynnistin paikallisen HTTP-palvelimen (`npx http-server . -p 8080`) ja testasin molemmat pelimuodot selaimessa:

1. **daily.html** (Grid #7, 21.3.2026): Sivu latautui ilman JS-virheitä. DB.length === 5880. Ruudukko renderöityi oikein pelaajanimineen (Wayne Gretzky, Mario Lemieux, Jaromir Jagr jne.). Pelaajahaku toimii — `DB.find(p => p.n === 'Wayne Gretzky')` palauttaa oikean datan (4 joukkuetta, 7 palkintoa).

2. **index.html** (ristinolla): Sivu latautui ilman JS-virheitä. DB.length === 5880. Käynnistin paikallisen pelin (∞ aikaraja), valitsin solun (cell-0), ja hakukenttä näytti "Sidney Crosby" kun kirjoitin "Crosby". Pelaajahaku palauttaa oikeat tulokset.

Kaikki slice-tason verifikaatiotarkistukset ajettu ja läpi.

## Verification

- Browser: daily.html latautuu, 0 console errors, DB.length === 5880
- Browser: index.html latautuu, 0 console errors, DB.length === 5880
- Browser: "Gretzky" hakutulos daily.html:ssä — Wayne Gretzky löytyy (teams: EDM, LAK, NYR, STL; awards: 7)
- Browser: "Crosby" hakutulos index.html:ssä — Sidney Crosby näkyy dropdown-listassa
- Slice V1: assembly tuottaa 5880 pelaajaa
- Slice V2: `grep -c "LOST"` = 0 (ei menetettyjä pelaajia/palkintoja)
- Slice V3: "No awards lost!" löytyy
- Slice V4: 5749 pelaajalla position-data (> 5000)
- Slice V5: players.js DB.length = 5880
- Slice V6: players-full.js p-kenttiä = 5750 (> 5000)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `browser_navigate daily.html + browser_assert no_console_errors` | 0 | ✅ pass | 3s |
| 2 | `browser_evaluate DB.length` (daily.html) | 0 | ✅ pass (5880) | <1s |
| 3 | `browser_assert text_visible "Gretzky"` (daily.html) | 0 | ✅ pass | <1s |
| 4 | `browser_navigate index.html + browser_assert no_console_errors` | 0 | ✅ pass | 2s |
| 5 | `browser_evaluate DB.length` (index.html) | 0 | ✅ pass (5880) | <1s |
| 6 | `browser_type "Crosby" + browser_assert text_visible "Sidney Crosby"` | 0 | ✅ pass | 2s |
| 7 | `node fetch-raw.js --assemble-only \| grep "players"` | 0 | ✅ pass (5880) | 2s |
| 8 | `node build-players-db.js \| grep -c "LOST"` | 1 | ✅ pass (0 = no LOST lines) | 2s |
| 9 | `node build-players-db.js \| grep "No awards lost"` | 0 | ✅ pass | 2s |
| 10 | `node -e "...filter(p=>p.position)..."` | 0 | ✅ pass (5749 > 5000) | <1s |
| 11 | `node -e "...vm.runInNewContext...DB.length"` | 0 | ✅ pass (5880) | <1s |
| 12 | `grep -c ' p:"' players-full.js` | 0 | ✅ pass (5750 > 5000) | <1s |

## Diagnostics

- `npx http-server . -p 8080 -c-1` — paikallinen palvelin selaintestausta varten
- Selainkonsolissa `typeof DB !== 'undefined' && DB.length` — nopea tarkistus DB:n latauksesta
- `DB.find(p => p.n === 'Wayne Gretzky')` — yksittäisen pelaajan tarkistus selainkonsolista
- Daily grid näyttää grid-numeron (#7) ja päivämäärän — varmistaa seed-pohjaisen generoinnin toimivuuden

## Deviations

- Daily.html:n pelaajahaku testattiin `browser_evaluate` -komennolla suoran UI-interaktion sijaan, koska daily-modessa pelaaja hakee kategorioita (ei pelaajia) — hakukenttä on "Hae kategoriaa..." eikä pelaajahaku. DB:n toimivuus vahvistettiin suoralla `DB.find()` -kutsulla.
- Ensimmäisellä sivulatauksella ilmeni yksittäinen 404-virhe (todennäköisesti favicon), mutta se ei toistunut reloadissa eikä ole pelikoodista peräisin.

## Known Issues

None — molemmat pelimuodot toimivat rebuildityllä players.js:llä ongelmitta.

## Files Created/Modified

- `.gsd/milestones/M001/slices/S02/tasks/T02-PLAN.md` — Lisätty puuttunut Observability Impact -osio
