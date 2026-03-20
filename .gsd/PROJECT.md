# NHL Hockey Grid

NHL Hockey Grid on kaksiosainen selainpeli: **Daily Grid** (päivittäinen Wordle-tyylinen arvuuttelupeli, pääfocus) ja **Ristinolla** (kaverihaaste, 1v1 moninpeli).

## Nykyinen tila

- Toimiva daily.html (~1725 riviä, single-file HTML)
- Toimiva nhl-grid.html / index.html (~2330 riviä, single-file HTML, identtiset kopiot)
- Pelaajatietokanta: ~5880 pelaajaa, ETL-pipeline valmis (fetch-raw.js → build-players-db.js → players.js)
- Awards- ja Cup-rosterit haettu ja cachettu
- PeerJS/WebRTC-moninpeli (väliaikainen, korvataan Firebasella)
- GitHub Pages hosting: https://tatomaatti.github.io/nhl-grid/
- Ei git-repoa (alustettu juuri)

## Pino

- Vanilla HTML/CSS/JS (single-file arkkitehtuuri)
- Staattinen players.js (~344 KB)
- PeerJS/WebRTC (moninpeli, väliaikainen)
- GitHub Pages (hosting)

## Seuraava askel

M001: Koodipohjan viimeistely — mobiilikorjaukset, duplikaatin poisto, koodin laadun parantaminen, pelaajatietokannan rebuildi.
