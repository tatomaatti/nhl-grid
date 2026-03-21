# S04: JS-erotus ja koodin siistiminen

**Goal:** JavaScript on eriytetty HTML-tiedostoista erillisiin .js-tiedostoihin. Jaettu kategoriadata on yhteisessä tiedostossa. HTML-tiedostot sisältävät vain CSS:n ja markupin.
**Demo:** daily.html ja index.html toimivat identtisesti selaimessa, mutta JS tulee `<script src>`-tageilla. Molemmat HTML-tiedostot ovat alle 1000 riviä.

## Must-Haves

- Jaettu kategoriadata (TEAMS, NATS, AWARDS, SPECIALS) → `shared.js`
- daily.html:n pelilogiikka → `daily-game.js`
- index.html:n pelilogiikka → `grid-game.js`
- ICE_CONFIG (STUN/TURN-tunnukset) siirretty `config.js`-tiedostoon
- HTML-tiedostot eivät sisällä inline-JS:ää (paitsi DB-puuttumisen tarkistus)
- Toiminnallisuus ei muutu — molemmat pelit toimivat identtisesti selaimessa
- `scripts/verify-s04.sh` läpäisee kaikki tarkistukset

## Proof Level

- This slice proves: integration
- Real runtime required: yes (selainlataus varmistaa script-tagien latausjärjestys ja globaalien saatavuus)
- Human/UAT required: no (skriptiverifiointi + selaintesti riittää)

## Verification

- `bash scripts/verify-s04.sh` — tarkistaa tiedostojen olemassaolo, rivimäärät, inline-JS:n puuttuminen, script src -tagit, ICE_CONFIG:n sijainti
- Selaintesti: daily.html ja index.html ladataan selaimessa, 0 JS-virheitä konsolissa, perustoiminnot toimivat (gridi renderöityy, pelaajahaku toimii)
- Diagnostiikka: `scripts/verify-s04.sh` raportoi PASS/FAIL per tarkistus, tulostaa rivimäärät, tarkistaa ettei JS-koodia vuoda HTML-tiedostoihin
- Failure-path: selainkonsolissa tarkistetaan 404-virheet (puuttuva script-tiedosto) ja ReferenceError-virheet (globaali muuttuja ei saatavilla latausjärjestysongelman vuoksi). verify-s04.sh tarkistaa script src -tagien järjestyksen.

## Observability / Diagnostics

- Runtime signals: `[MobileUX]`-konsolilokit säilyvät erotetuissa JS-tiedostoissa — filtteröi DevToolsissa
- Inspection surfaces: `bash scripts/verify-s04.sh` — kokonaiskuva tiedostorakenteesta ja JS-erotuksen tilasta
- Failure visibility: Script-latausvirheet näkyvät selainkonsolissa (404, ReferenceError). verify-s04.sh tarkistaa tiedostojen olemassaolon ja script src -tagit.
- Redaction constraints: config.js sisältää STUN/TURN-tunnukset — jo .gitignore-poissulkemisessa (ei, repo on yksityinen, ei vaadi redaktointia)

## Integration Closure

- Upstream surfaces consumed: S01:n tuottamat `daily.html` ja `index.html` (mobiili-UX-korjaukset, CSS), `players.js`
- New wiring introduced in this slice: `<script src>` -tagit HTML-tiedostoissa latavat players.js → shared.js → config.js → [daily-game.js | grid-game.js]. Latausjärjestys on kriittinen — jaetut globaalit pitää olla saatavilla ennen peli-spesifisiä skriptejä.
- What remains before the milestone is truly usable end-to-end: S05 (bugikorjaukset ja lokalisaatio)

## Tasks

- [x] **T01: Luo shared.js ja config.js — jaettu data ja konfiguraatio** `est:30m`
  - Why: TEAMS/NATS/AWARDS/SPECIALS ovat duplikoituina molemmissa HTML-tiedostoissa eri versioina. ICE_CONFIG on kovakoodattuna index.html:ssä. Nämä pitää olla yhdessä paikassa.
  - Files: `shared.js`, `config.js`
  - Do: 1) Luo shared.js joka sisältää TEAMS (33 joukkuetta, superset), NATS (11 kansallisuutta), AWARDS (10, sisältää group+desc+abbr), SPECIALS (3). Lisää PLAYABLE_AWARDS. 2) Luo config.js joka sisältää ICE_CONFIG:n (STUN/TURN). 3) Käytä globaaleja muuttujia (ei ES modules) — selain lataa `<script src>` -tagilla.
  - Verify: `node -e "eval(require('fs').readFileSync('shared.js','utf8'))"` ja `node -e "eval(require('fs').readFileSync('config.js','utf8'))"` eivät heitä virhettä
  - Done when: shared.js + config.js olemassa, ei syntaksivirheitä, sisältävät kaikki kategoriaoliot ja ICE_CONFIG:n

- [ ] **T02: Eristä daily-game.js ja päivitä daily.html** `est:40m`
  - Why: daily.html:n ~1140 riviä inline-JS:ää siirretään erilliseen tiedostoon
  - Files: `daily-game.js`, `daily.html`
  - Do: 1) Siirrä daily.html:n `<script>`-blokin sisältö daily-game.js:ään. Poista kategoriadefinitiot (tulevat shared.js:stä). 2) Korvaa daily.html:n inline-script `<script src>`-tageilla oikeassa järjestyksessä: players.js → shared.js → daily-game.js. 3) Lisää DB-puuttumisen tarkistus daily-game.js:n alkuun (kuten index.html:ssä on). 4) Varmista visualViewport-handler säilyy. 5) Testaa selaimessa.
  - Verify: `bash scripts/verify-s04.sh` PASS daily-osioissa + selaintesti (gridi renderöityy, pelaajahaku toimii, 0 JS-virheitä)
  - Done when: daily.html ei sisällä inline-JS:ää, daily-game.js toimii, peli pelattavissa

- [ ] **T03: Eristä grid-game.js, päivitä index.html ja luo verify-s04.sh** `est:45m`
  - Why: index.html:n ~1460 riviä inline-JS:ää siirretään erilliseen tiedostoon. Slicen verifiointiskripti viimeistelee.
  - Files: `grid-game.js`, `index.html`, `scripts/verify-s04.sh`
  - Do: 1) Siirrä index.html:n `<script>`-blokin sisältö grid-game.js:ään. Poista kategoriadefinitiot (tulevat shared.js:stä) ja ICE_CONFIG (tulee config.js:stä). 2) Korvaa inline-script `<script src>`-tageilla: players.js → shared.js → config.js → peerjs CDN → grid-game.js. 3) Poista DB-puuttumisen tarkistus inline-scriptistä (siirtyy grid-game.js:n alkuun). 4) Varmista visualViewport-handler ja URL auto-join säilyvät. 5) Luo scripts/verify-s04.sh joka tarkistaa: tiedostojen olemassaolo, HTML-rivimäärät < 1000, ei inline-JS:ää, script src -tagit oikeassa järjestyksessä, ICE_CONFIG config.js:ssä. 6) Testaa selaimessa.
  - Verify: `bash scripts/verify-s04.sh` — kaikki tarkistukset PASS
  - Done when: index.html ei sisällä inline-JS:ää, grid-game.js toimii, verify-s04.sh passaa

## Files Likely Touched

- `shared.js` (uusi)
- `config.js` (uusi)
- `daily-game.js` (uusi)
- `grid-game.js` (uusi)
- `daily.html` (muokataan — inline-JS poistetaan)
- `index.html` (muokataan — inline-JS poistetaan)
- `scripts/verify-s04.sh` (uusi)
