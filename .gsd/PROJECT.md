# NHL Hockey Grid

NHL Hockey Grid on kaksiosainen selainpeli: **Daily Grid** (päivittäinen Wordle-tyylinen arvuuttelupeli, pääfocus) ja **Ristinolla** (kaverihaaste, 1v1 moninpeli).

## Nykyinen tila

- Toimiva daily.html (~1750 riviä, single-file HTML, mobiilioptimoitu)
- Toimiva index.html (~2370 riviä, single-file HTML, mobiilioptimoitu)
- nhl-grid.html → redirect index.html:iin (14 riviä)
- Pelaajatietokanta: ~5880 pelaajaa, ETL-pipeline valmis (fetch-raw.js → build-players-db.js → players.js)
- Awards- ja Cup-rosterit haettu ja cachettu
- PeerJS/WebRTC-moninpeli (väliaikainen, korvataan Firebasella)
- GitHub Pages hosting: https://tatomaatti.github.io/nhl-grid/
- .gitignore kunnossa, .player-cache pois git-seurannasta
- Mobiili-UX: viewport meta, 44px touch targets, visualViewport keyboard handler, overscroll-behavior

## Pino

- Vanilla HTML/CSS/JS (single-file arkkitehtuuri)
- Staattinen players.js (~344 KB)
- PeerJS/WebRTC (moninpeli, väliaikainen)
- GitHub Pages (hosting)

## Seuraava askel

M001 S01 valmis. Seuraavat: S02 (pelaajatietokannan rebuild), S03 (grid-generoinnin testaus), S04 (JS-erotus), S05 (bugit + lokalisaatio).
