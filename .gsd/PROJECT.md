# NHL Hockey Grid

NHL Hockey Grid on kaksiosainen selainpeli: **Daily Grid** (päivittäinen Wordle-tyylinen arvuuttelupeli, pääfocus) ja **Ristinolla** (kaverihaaste, 1v1 moninpeli).

## Nykyinen tila

**M001 valmis (2026-03-21).** Koodipohja on viimeistelty, mobiilioptimoitu, lokalisoitu ja auditoitu. Kaikki 10 vaatimusta (R001–R006, R010–R013) validoitu.

### Tiedostorakenne
- `daily.html` (652 riviä) + `daily-game.js` (1112 riviä) — Daily Grid
- `index.html` (931 riviä) + `grid-game.js` (1440 riviä) — Ristinolla
- `shared.js` (97 riviä) — Jaettu kategoriadata (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS, catLang())
- `lang.js` (522 riviä) — Lokalisaatio FI/EN (~120 avainta, data-i18n + t())
- `config.js` (20 riviä) — ICE_CONFIG (STUN/TURN)
- `players.js` (~5888 riviä) — Pelaajatietokanta (5880 pelaajaa, auditoitu)
- `nhl-grid.html` (14 riviä) — Redirect → index.html

### Ominaisuudet
- Mobiilioptimoitu (viewport, 44px touch targets, visualViewport keyboard handler)
- FI/EN lokalisaatio (oletuskieli selaimen kielen mukaan, kielenvaihtopainike)
- Grid-generointi validoitu (30+ seedillä, 0 fallbackia)
- Joukkuenimet lyhenteinä, ei-pelattavat palkinnot piilotettu
- Steal-bugi korjattu, online-yhteyden READY-handshake
- ETL-pipeline: fetch-raw.js → build-players-db.js → players.js

## Pino

- Vanilla HTML/CSS/JS (JS eriytetty erillisiin tiedostoihin)
- Jaettu kategoriadata shared.js:ssä
- Lokalisaatio lang.js:ssä (FI/EN)
- Staattinen players.js (~344 KB)
- PeerJS/WebRTC (moninpeli, väliaikainen)
- GitHub Pages (hosting)

## Seuraava askel

Seuraavat mahdolliset milestonejen aiheet (deferred-vaatimukset):
- R014: Firebase-moninpeli (korvaa PeerJS/WebRTC)
- R015: PWA (manifest.json + service worker)
- R016: Oma domain + Cloudflare Pages (yksityinen repo)
