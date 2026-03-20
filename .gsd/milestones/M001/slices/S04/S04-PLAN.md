# S04: JS-erotus ja koodin siistiminen

**Goal:** JavaScript on eriytetty HTML-tiedostoista erillisiin .js-tiedostoihin. Jaettu koodi on yhteisessä moduulissa.
**Demo:** daily.html ja index.html toimivat identtisesti, mutta JS tulee `<script src>`-tageilla. Tiedostokoot ovat pienentyneet merkittävästi.

## Must-Haves

- daily.html: JS eriytetty → daily-game.js
- index.html: JS eriytetty → grid-game.js
- Jaettu koodi (TEAMS, NATS, AWARDS, pelaajahaku) → shared.js
- HTML-tiedostot ovat luettavia (~200-400 riviä CSS + markup, ei JS:ää)
- Toiminnallisuus ei muutu — molemmat pelit toimivat identtisesti

## Verification

- Avaa daily.html ja index.html selaimessa → molemmat toimivat
- `wc -l daily.html index.html` — molemmat < 500 riviä
- `ls -la daily-game.js grid-game.js shared.js` — tiedostot olemassa

## Tasks

- [ ] **T01: Jaetun koodin tunnistaminen** `est:20m`
  - Why: Ennen erottamista pitää tietää mikä on jaettua
  - Files: `daily.html`, `index.html`
  - Do: 1) Tunnista identtinen koodi molemmissa tiedostoissa: TEAMS, NATS, AWARDS -määrittelyt, pelaajahaku-/autocomplete-logiikka, seeded PRNG, category pool builder. 2) Dokumentoi jaetut funktiot ja niiden rajapinnat. 3) Tunnista pelin spesifinen koodi (Daily-logiikka vs Ristinolla-logiikka).
  - Verify: Listaus jaetuista funktioista ja pelin spesifisistä funktioista on tehty
  - Done when: Jaetun ja peli-spesifin koodin raja on selkeä

- [ ] **T02: shared.js — jaettu koodi** `est:30m`
  - Why: Duplikoitu koodi pitää olla yhdessä paikassa
  - Files: `shared.js` (uusi)
  - Do: 1) Luo shared.js joka sisältää: TEAMS, NATS, AWARDS, SPECIALS, team alias mapping, category pool builder, seeded PRNG (mulberry32, shuffleArray), pelaajahaku-/autocomplete-funktiot. 2) Käytä globaaleja muuttujia (ei ES modules) koska selain lataa `<script src>` -tagilla. 3) Varmista kaikki nimikonfliktiriskit on ratkaistu.
  - Verify: `node -e "eval(require('fs').readFileSync('shared.js','utf8'))"` ei heitä virhettä
  - Done when: shared.js sisältää jaetun koodin, ei syntaksivirheitä

- [ ] **T03: daily-game.js — Daily Grid -logiikka** `est:30m`
  - Why: daily.html:n JS eriytetään omaan tiedostoon
  - Files: `daily-game.js` (uusi), `daily.html`
  - Do: 1) Siirrä daily.html:n `<script>`-blokin Daily-spesifinen koodi daily-game.js:ään. 2) Korvaa daily.html:n script-blokki `<script src>`-tageilla: players.js, shared.js, daily-game.js. 3) Testaa selaimessa: kaikki toiminnot (pelin generointi, arvaus, vihjeet, share, harjoittelu, localStorage).
  - Verify: Avaa daily.html selaimessa → peli toimii identtisesti kuin ennen
  - Done when: daily.html ei sisällä inline-JS:ää (paitsi mahdollinen pieni bootstrap), peli toimii

- [ ] **T04: grid-game.js — Ristinolla-logiikka** `est:40m`
  - Why: index.html:n JS eriytetään omaan tiedostoon
  - Files: `grid-game.js` (uusi), `index.html`
  - Do: 1) Siirrä index.html:n `<script>`-blokin Ristinolla-spesifinen koodi grid-game.js:ään. 2) Korvaa index.html:n script-blokki `<script src>`-tageilla: players.js, shared.js, grid-game.js. 3) PeerJS/WebRTC-koodi pysyy grid-game.js:ssä (poistuu myöhemmin Firebase-siirtymässä). 4) Testaa selaimessa: asetukset, pelin luonti, offline-peli, online-peli (jos mahdollista).
  - Verify: Avaa index.html selaimessa → peli toimii identtisesti kuin ennen
  - Done when: index.html ei sisällä inline-JS:ää, peli toimii

## Files Likely Touched

- `daily.html`
- `index.html`
- `shared.js` (uusi)
- `daily-game.js` (uusi)
- `grid-game.js` (uusi)
