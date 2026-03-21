# NHL Hockey Grid

NHL Hockey Grid on kaksiosainen selainpeli: **Daily Grid** (päivittäinen Wordle-tyylinen arvuuttelupeli, pääfocus) ja **Ristinolla** (kaverihaaste, 1v1 moninpeli).

## Nykyinen tila

- Toimiva daily.html (644 riviä HTML/CSS + erillinen daily-game.js 1065 riviä, mobiilioptimoitu)
- Toimiva index.html (923 riviä HTML/CSS + erillinen grid-game.js 1394 riviä, mobiilioptimoitu)
- Jaettu kategoriadata: shared.js (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS)
- Konfiguraatio: config.js (ICE_CONFIG — STUN/TURN)
- nhl-grid.html → redirect index.html:iin (14 riviä)
- Pelaajatietokanta: ~5880 pelaajaa, ETL-pipeline valmis (fetch-raw.js → build-players-db.js → players.js)
- Awards- ja Cup-rosterit haettu ja cachettu
- PeerJS/WebRTC-moninpeli (väliaikainen, korvataan Firebasella)
- GitHub Pages hosting: https://tatomaatti.github.io/nhl-grid/
- .gitignore kunnossa, .player-cache pois git-seurannasta
- Mobiili-UX: viewport meta, 44px touch targets, visualViewport keyboard handler, overscroll-behavior
- Joukkuenimet lyhenteinä, ei-pelattavat palkinnot piilotettu UI:sta

## Pino

- Vanilla HTML/CSS/JS (JS eriytetty erillisiin tiedostoihin)
- Jaettu kategoriadata shared.js:ssä
- Staattinen players.js (~344 KB)
- PeerJS/WebRTC (moninpeli, väliaikainen)
- GitHub Pages (hosting)

## Seuraava askel

M001 S01–S04 valmiit. Seuraava: S05 (bugikorjaukset — steal, online-yhteys — ja lokalisaatio FI/EN).
