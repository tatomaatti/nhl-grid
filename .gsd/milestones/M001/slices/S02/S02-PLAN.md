# S02: Pelaajatietokannan rebuild ja audit

**Goal:** players.js on rebuildittu tuoreesta raakadatasta, audit raportoi 0 menetettyjä pelaajia/palkintoja.
**Demo:** `node build-players-db.js` tuottaa tuoreen players.js:n ja audit-raportti on puhdas.

## Must-Haves

- `node build-players-db.js` ajautuu onnistuneesti
- Audit: 0 lost players, 0 lost awards
- Spot-check: Gretzky, Crosby, Ovechkin, Selänne, McDavid — kaikilla oikeat palkinnot
- players-full.js päivitetty (sisältää position, handedness)

## Verification

- `node build-players-db.js 2>&1 | grep -c "LOST"` = 0
- `node build-players-db.js 2>&1 | grep "✅ No awards lost"` löytyy
- Spot-check: `grep "Wayne Gretzky" players.js` näyttää Hart, ConnSmythe, StanleyCup, ArtRoss, TedLindsay

## Tasks

- [ ] **T01: Rebuild players.js ja tarkista audit** `est:20m`
  - Why: Nykyinen players.js on 2026-03-15 buildistä — awards ja cup rosters ovat sen jälkeen haettu cacheen
  - Files: `players.js`, `players-full.js`
  - Do: 1) Aja `node build-players-db.js` ja tarkista audit-raportti. 2) Aja `node build-players-db.js --include-extra` ja nimeä output players-full.js:ksi. 3) Jos auditissa on ongelmia, tutki ja korjaa raakadataa tai overrideja. 4) Tarkista spot-check: Gretzky, Crosby, Ovechkin, Selänne, McDavid, Timonen.
  - Verify: `node build-players-db.js 2>&1 | tail -30` — audit puhdas, spot-check ok
  - Done when: Tuore players.js on commitoitu, audit 0 menetettyjä

- [ ] **T02: Overrides-tarkistus ja täydennys** `est:20m`
  - Why: overrides.json saattaa tarvita lisäyksiä jos audit paljastaa puutteita
  - Files: `overrides.json`
  - Do: 1) Tarkista audit-raportin "unknown awards" ja "players without awards" -osiot. 2) Lisää tarvittavat overridet (esim. historiallisten pelaajien puuttuvat palkinnot). 3) Aja rebuild uudelleen ja varmista audit läpäisee.
  - Verify: `node build-players-db.js --audit-only 2>&1 | grep -c "⚠"` = mahdollisimman pieni
  - Done when: overrides.json on täydennetty, rebuild puhdas

## Files Likely Touched

- `players.js`
- `players-full.js`
- `overrides.json`
- `build-players-db.js` (mahdolliset korjaukset)
