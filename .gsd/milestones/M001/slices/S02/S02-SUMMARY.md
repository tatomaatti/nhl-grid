---
id: S02
parent: M001
milestone: M001
provides:
  - Rebuilt players.js (5880 players, audit clean — 0 lost players, 0 lost awards)
  - Rebuilt players-full.js with position (p) and handedness (h) fields (5750/5747 records)
  - Reassembled players-raw.json with bio enrichment (position, shootsCatches, birthDate)
  - Extended assembleRawData() Phase 3 to extract bio fields from awards cache
requires:
  - slice: none
    provides: none
affects:
  - S03
key_files:
  - fetch-raw.js
  - players-raw.json
  - players.js
  - players-full.js
key_decisions:
  - Bio enrichment extracted for ALL cached players regardless of awards status (D003)
patterns_established:
  - Assembly phase logs enrichment counts for observability (position, shoots, birthDate)
  - Audit-only mode available via --audit-only flag (no file writes)
  - players-full.js is the extended build with p/h fields; players.js is the production build without them
observability_surfaces:
  - "node build-players-db.js --audit-only — full audit without writing files"
  - "Assembly prints: Bio enrichment from landing pages: N position, N shoots, N birthDate"
  - "Audit prints ⚠ PLAYERS LOST / ⚠ AWARDS LOST on data regression"
drill_down_paths:
  - .gsd/milestones/M001/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T02-SUMMARY.md
duration: 25m
verification_result: passed
completed_at: 2026-03-21
---

# S02: Pelaajatietokannan rebuild ja audit

**players.js rebuilditty tuoreesta raakadatasta (5880 pelaajaa), audit puhdas (0 menetettyjä pelaajia/palkintoja), players-full.js sisältää position/handedness-kentät, molemmat pelimuodot lataavat DB:n ongelmitta**

## What Happened

Awards-cachen landing-sivuilla (`.player-cache/_awards/{id}.json`) oli `position`, `shootsCatches` ja `birthDate` -kentät, mutta `assembleRawData()`-funktio poimi vain `awards`-arrayn. T01 korjasi Phase 3 -loopin niin, että bio-enrichment (position, shoots, birthDate) poimitaan kaikille cachetuille pelaajille append-only-periaatteella — ei vain niille joilla on palkintoja. Tämä kasvatti position-datan kattavuuden 822:sta 5749:ään pelaajaan.

Reassembly tuotti 5880 pelaajaa players-raw.json:iin. Build tuotti players.js:n (tuotanto, ilman p/h-kenttiä) ja players-full.js:n (laajennettu, 5750 position / 5747 handedness). Audit raportoi 0 menetettyjä pelaajia ja 0 menetettyjä palkintoja. Spot-check: Gretzky (7 palkintoa, 4 joukkuetta), Crosby (7), Ovechkin (8), Selänne (4), McDavid (5) — kaikki oikein.

T02 vahvisti integraation: daily.html ja index.html lataavat rebuildityn players.js:n selaimessa ilman JS-virheitä, DB.length === 5880 molemmissa, pelaajahaku toimii.

## Verification

| # | Check | Result |
|---|-------|--------|
| V1 | `node fetch-raw.js --assemble-only` — 5880 pelaajaa | ✅ pass |
| V2 | `node build-players-db.js \| grep -c "LOST"` = 0 | ✅ pass |
| V3 | `node build-players-db.js \| grep "No awards lost"` | ✅ pass |
| V4 | players-raw.json position count > 5000 | ✅ pass (5749) |
| V5 | players.js DB.length = 5880 | ✅ pass |
| V6 | players-full.js p-kenttiä > 5000 | ✅ pass (5750) |
| V7 | daily.html latautuu, 0 console errors, DB.length = 5880 | ✅ pass |
| V8 | index.html latautuu, 0 console errors, DB.length = 5880 | ✅ pass |
| V9 | Pelaajahaku daily.html: Gretzky löytyy | ✅ pass |
| V10 | Pelaajahaku index.html: Crosby löytyy | ✅ pass |

## New Requirements Surfaced

- none

## Deviations

- Slice plan verification V6 used `grep -c '"p":' players-full.js` but the actual format uses unquoted JS keys (`p:"C"`). Correct grep is `grep -c ' p:"' players-full.js`. Functionally equivalent check, not a plan failure.

## Known Limitations

- 131 pelaajaa (5880 - 5749) ilman position-dataa. Nämä ovat todennäköisesti historiallisia pelaajia joiden NHL API landing-sivu ei palauttanut position-kenttää.
- players-full.js:ää ei käytetä pelissä — se on varattu tulevaa käyttöä varten (esim. position-kategoriat gridissä).

## Follow-ups

- none

## Files Created/Modified

- `fetch-raw.js` — Phase 3 assembly laajennettu: position/shootsCatches/birthDate poiminta + enrichment-tilastot konsoliin
- `players-raw.json` — reassembloitu tuoreesta cachesta, 5880 pelaajaa, 5749 position-kenttää
- `players.js` — rebuilditty normaalilla buildilla, 5880 pelaajaa, audit puhdas
- `players-full.js` — rebuilditty --include-extra -flagilla, 5880 pelaajaa, 5750 p-kenttää, 5747 h-kenttää

## Forward Intelligence

### What the next slice should know
- players.js on tuore ja luotettava — S03 voi luottaa siihen grid-generoinnin testauksessa ilman lisävalidointia.
- DB:ssä on 5880 pelaajaa, joista 1100:lla on palkintoja. Peliin kuuluvat palkinnot (K008): Hart, Vezina, Norris, StanleyCup, Calder, RocketRichard, ConnSmythe, ArtRoss, TedLindsay, Selke.
- players.js:n formaatti: `{n:"Name", t:["TEAM1","TEAM2"], c:"NAT", a:["Award1"]}`. Ei p/h-kenttiä tuotannossa.

### What's fragile
- `grep -c '"p":' players-full.js` ei täsmää tuotantoformaattiin (unquoted keys). Käytä `grep -c ' p:"' players-full.js` tai tarkista vm.runInNewContext:lla.
- Awards-cache on staattinen snapshot — uudet palkinnot vaativat `fetch-raw.js --awards-only` -ajon ennen rebuildiä.

### Authoritative diagnostics
- `node build-players-db.js --audit-only` — täydellinen audit ilman tiedoston kirjoitusta, sisältää player/award counts, spot-check, LOST-varoitukset
- Assembly enrichment-rivi: `Bio enrichment from landing pages: N position, N shoots, N birthDate`

### What assumptions changed
- Oletettiin position-datan olevan vain 822 pelaajalla (awards-pelaajat). Todellisuudessa 5749 pelaajalla on position-data landing-sivulla — riitti irrottaa bio enrichment awards-ehdosta.
