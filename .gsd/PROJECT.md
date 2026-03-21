# NHL Hockey Grid

NHL Hockey Grid on kaksiosainen selainpeli: **Daily Grid** (päivittäinen Wordle-tyylinen arvuuttelupeli, pääfocus) ja **Ristinolla** (kaverihaaste, 1v1 moninpeli).

## Nykyinen tila

**M001 valmis (kaikki 5 sliceä).** Koodipohja on viimeistelty, mobiilioptimoitu, lokalisoitu ja auditoitu.

- Toimiva daily.html (644 riviä HTML/CSS + erillinen daily-game.js, mobiilioptimoitu)
- Toimiva index.html (923 riviä HTML/CSS + erillinen grid-game.js, mobiilioptimoitu)
- Jaettu kategoriadata: shared.js (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS + catLang())
- Lokalisaatio: lang.js (FI/EN, ~120 avainta, data-i18n + t()-kutsut, kielenvaihtopainike)
- Konfiguraatio: config.js (ICE_CONFIG — STUN/TURN)
- nhl-grid.html → redirect index.html:iin (14 riviä)
- Pelaajatietokanta: ~5880 pelaajaa, ETL-pipeline valmis (fetch-raw.js → build-players-db.js → players.js)
- Awards- ja Cup-rosterit haettu ja cachettu
- PeerJS/WebRTC-moninpeli (väliaikainen, korvataan Firebasella) + READY-handshake
- Steal-bugi korjattu (host päättelee stealMode solun omistajuudesta online-pelissä)
- GitHub Pages hosting: https://tatomaatti.github.io/nhl-grid/
- .gitignore kunnossa, .player-cache pois git-seurannasta
- Mobiili-UX: viewport meta, 44px touch targets, visualViewport keyboard handler, overscroll-behavior
- Joukkuenimet lyhenteinä, ei-pelattavat palkinnot piilotettu UI:sta

## Pino

- Vanilla HTML/CSS/JS (JS eriytetty erillisiin tiedostoihin)
- Jaettu kategoriadata shared.js:ssä
- Lokalisaatio lang.js:ssä (FI/EN)
- Staattinen players.js (~344 KB)
- PeerJS/WebRTC (moninpeli, väliaikainen)
- GitHub Pages (hosting)

## Seuraava askel

M001 valmis. Seuraavat mahdolliset milestonejen aiheet: Firebase-moninpeli (R014), PWA (R015), oma domain + Cloudflare Pages (R016).
