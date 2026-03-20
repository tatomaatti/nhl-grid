# S02: Pelaajatietokannan rebuild ja audit

**Goal:** players.js on rebuildittu tuoreesta raakadatasta (position/shoots-data mukaan lukien), audit raportoi 0 menetettyjä pelaajia/palkintoja, ja players-full.js sisältää position/handedness-kentät.
**Demo:** `node build-players-db.js` tuottaa tuoreen players.js:n, audit-raportti on puhdas, ja `node build-players-db.js --include-extra` tuottaa players-full.js:n jossa `p`- ja `h`-kentät.

## Must-Haves

- `fetch-raw.js --assemble-only` poimii position/shootsCatches-kentät awards-cachen landing-sivuilta
- `players-raw.json` on reassembloitu täydellisenä (5880 pelaajaa, position/shoots mukana)
- `node build-players-db.js` ajautuu onnistuneesti, audit: 0 lost players, 0 lost awards
- `node build-players-db.js --include-extra` tuottaa players-full.js jossa position (`p`) ja handedness (`h`)
- Spot-check läpäisee: Gretzky, Crosby, Ovechkin, Selänne, McDavid — oikeat palkinnot ja joukkueet
- Pelit (daily.html, index.html) lataavat rebuildityn players.js:n ongelmitta

## Proof Level

- This slice proves: contract (ETL pipeline tuottaa oikean datan) + integration (pelit käyttävät dataa)
- Real runtime required: yes (Node.js build + selaintesti)
- Human/UAT required: no

## Verification

- `node fetch-raw.js --assemble-only 2>&1 | grep "players"` — tuottaa 5880 pelaajaa
- `node build-players-db.js 2>&1 | grep -c "LOST"` = 0
- `node build-players-db.js 2>&1 | grep "No awards lost"` — löytyy
- `node -e "const d=JSON.parse(require('fs').readFileSync('players-raw.json','utf8')); const wp=Object.values(d.players).filter(p=>p.position); console.log(wp.length)"` — tulos > 5000 (lähes kaikilla pelaajilla position)
- `node -e "const vm=require('vm');const s=require('fs').readFileSync('players.js','utf8').replace(/^const DB/m,'var DB');const c={};vm.runInNewContext(s,c);console.log(c.DB.length)"` — tulos = 5880
- `grep -c '"p":' players-full.js` — tulos > 5000 (position-kentät players-full.js:ssä)
- Selaintesti: daily.html ja index.html lataavat DB:n ilman console-virheitä

## Observability / Diagnostics

- Runtime signals: build-players-db.js tulostaa audit-raportin (player count, award counts, spot-check, LOST-varoitukset)
- Inspection surfaces: `node build-players-db.js --audit-only` — näyttää auditin kirjoittamatta tiedostoa; `node -e` one-linerit players-raw.json/players.js -introspektioon
- Failure visibility: audit tulostaa `⚠ PLAYERS LOST (N)` ja `⚠ AWARDS LOST (N)` riveille, jotka grep löytää; spot-check listaa avainpelaajien datan
- Redaction constraints: none (ei salaisuuksia datapipelinessa)

## Integration Closure

- Upstream surfaces consumed: `.player-cache/` (biot, summaries, awards, cup-rosterit), `overrides.json`
- New wiring introduced in this slice: `fetch-raw.js` assembly-funktion laajennus (position/shoots awards-cachesta)
- What remains before the milestone is truly usable end-to-end: S03 (grid-generoinnin testaus), S04 (JS-erotus), S05 (bugikorjaukset + lokalisaatio)

## Tasks

- [ ] **T01: Korjaa assembly, rebuild players-raw.json ja players.js** `est:45m`
  - Why: Awards-cachen landing-sivuilla on position/shootsCatches-data mutta `assembleRawData()` ei poimi niitä. Tämä korjaus + reassembly + rebuild tuottaa täydellisen pelaajatietokannan.
  - Files: `fetch-raw.js`, `players-raw.json`, `players.js`, `players-full.js`, `overrides.json`
  - Do: 1) Lisää `assembleRawData()`-funktioon Phase 3 -kohtaan position/shootsCatches-kenttien poiminta awards-cachesta. 2) Aja `node fetch-raw.js --assemble-only` reassembloidaksesi players-raw.json. 3) Aja `node build-players-db.js` ja tarkista audit. 4) Aja `node build-players-db.js --include-extra` ja kopioi output players-full.js:ksi. 5) Jos audit paljastaa ongelmia, päivitä overrides.json ja aja rebuild uudelleen. 6) Spot-check avainpelaajat.
  - Verify: `node build-players-db.js --audit-only 2>&1 | grep -c "LOST"` = 0, ja `node -e "..."` tarkistaa position-datan olemassaolon
  - Done when: players.js ja players-full.js on rebuilditty, audit puhdas, position-data mukana

- [ ] **T02: Integraatiotesti — pelit lataavat rebuildityn DB:n** `est:20m`
  - Why: Rebuild voi rikkoa players.js:n formaatin tavalla joka ei näy auditissa mutta estää pelien toiminnan (esim. syntaksivirhe, muuttunut kenttänimi). Tämä varmistaa end-to-end-toimivuuden.
  - Files: `daily.html`, `index.html`, `players.js`
  - Do: 1) Avaa daily.html selaimessa ja varmista DB latautuu (ei console-virheitä). 2) Testaa haku-toiminto: kirjoita "Gretzky" ja varmista löytyy. 3) Avaa index.html ja varmista DB latautuu. 4) Testaa pelaajahaku ristinollassa. 5) Tarkista ettei selain raportoi JS-virheitä.
  - Verify: Selaintesti: daily.html ja index.html lataavat ilman JS-virheitä, pelaajahaku toimii
  - Done when: Molemmat pelimuodot lataavat rebuildityn players.js:n ja pelaajahaku palauttaa tuloksia

## Files Likely Touched

- `fetch-raw.js` (assembly-funktion laajennus)
- `players-raw.json` (reassembloitu)
- `players.js` (rebuilditty)
- `players-full.js` (rebuilditty --include-extra -flagilla)
- `overrides.json` (mahdolliset täydennykset)
