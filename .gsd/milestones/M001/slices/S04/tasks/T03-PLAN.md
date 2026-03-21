---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T03: Eristä grid-game.js, päivitä index.html ja luo verify-s04.sh

**Slice:** S04 — JS-erotus ja koodin siistiminen
**Milestone:** M001

## Description

Siirrä index.html:n inline `<script>`-blokin sisältö (rivit 919-2376, ~1460 riviä JS:ää) erilliseen `grid-game.js`-tiedostoon. Poista kategoriadefinitiot (tulevat shared.js:stä) ja ICE_CONFIG (tulee config.js:stä). Korvaa inline-script `<script src>`-tageilla. Luo slicen verifiointiskripti `scripts/verify-s04.sh`.

CSS pysyy index.html:n sisällä (projektikonventio).

## Steps

1. **Lue index.html kokonaan** ja tunnista inline-scriptin rajat: rivi 919 (`<script>`) — rivi 2376 (`</script>`).

2. **Luo `grid-game.js`** joka sisältää:
   - index.html:n `<script>`-blokin sisällön ILMAN seuraavia:
     - DB-puuttumisen tarkistus (rivit ~921-935) — siirretään grid-game.js:n alkuun, mutta päivitetään viittaamaan `index.html` (ei `nhl-grid.html`)
     - `const TEAMS = { ... };` (rivit ~939-965)
     - `const NATS = { ... };` (rivit ~966-975)
     - `const AWARDS = { ... };` (rivit ~976-988)
     - `const ICE_CONFIG = { ... };` (rivit ~1897-1908) — tulee config.js:stä
   - DB-puuttumisen tarkistus SÄILYY grid-game.js:n alussa mutta siirretty koodi:
     ```js
     if (typeof DB === 'undefined') {
       document.addEventListener('DOMContentLoaded', function() {
         document.body.innerHTML = '...error message...';
       });
       throw new Error('players.js not loaded — DB is undefined');
     }
     ```
   - `catInfo(key)` -funktio käyttää TEAMS/NATS/AWARDS globaaleja — toimii koska shared.js ladataan ensin
   - Kaikki muu koodi säilyy muuttumattomana: CFG, game logic, PeerJS networking (NET), timer, hints, online messaging, visualViewport-handler, URL auto-join

3. **Muokkaa index.html**: poista inline `<script>...</script>` -blokki (rivit ~917-2376) ja korvaa `<script src>` -tageilla:
   ```html
   <script src="players.js"></script>
   <script src="shared.js"></script>
   <script src="config.js"></script>
   <script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
   <script src="grid-game.js"></script>
   ```
   Sijoita tagit ennen `</body>`. PeerJS CDN -tag tulee ennen grid-game.js:ää koska `grid-game.js` käyttää `Peer`-luokkaa.

4. **Luo `scripts/verify-s04.sh`** — slicen verifiointiskripti, saman mallin mukaan kuin verify-s01.sh:
   - Tarkistukset:
     - shared.js, config.js, daily-game.js, grid-game.js olemassa
     - daily.html rivimäärä < 700
     - index.html rivimäärä < 950
     - daily.html sisältää `<script src="shared.js">` ja `<script src="daily-game.js">`
     - index.html sisältää `<script src="shared.js">`, `<script src="config.js">`, `<script src="grid-game.js">`
     - daily.html EI sisällä `const TEAMS` (inline-JS poissa)
     - index.html EI sisällä `const TEAMS` (inline-JS poissa)
     - index.html EI sisällä `iceServers` (siirretty config.js:ään)
     - shared.js sisältää `const TEAMS`, `const NATS`, `const AWARDS`, `const SPECIALS`
     - config.js sisältää `ICE_CONFIG`
   - PASS/FAIL per tarkistus, exit 1 jos mikään failaa

5. **Validoi koko slice**: `bash scripts/verify-s04.sh` — kaikki tarkistukset PASS. Selaintesti: index.html latautuu, lobby näkyy, asetukset toimivat, 0 JS-virheitä.

## Must-Haves

- [ ] grid-game.js sisältää kaiken Ristinolla-pelilogiikan + PeerJS/WebRTC-koodin
- [ ] grid-game.js EI sisällä TEAMS/NATS/AWARDS-määrittelyjä eikä ICE_CONFIG:ia
- [ ] index.html ei sisällä inline `<script>...</script>` -blokkia
- [ ] index.html:n `<script src>` -tagit: players.js → shared.js → config.js → peerjs CDN → grid-game.js
- [ ] scripts/verify-s04.sh olemassa ja ajettavissa, kaikki tarkistukset PASS
- [ ] Peli toimii selaimessa identtisesti kuin ennen erotusta

## Verification

- `bash scripts/verify-s04.sh` — kaikki tarkistukset PASS, exit code 0
- `wc -l index.html` < 950
- `wc -l grid-game.js` > 1200
- Selaintesti: index.html latautuu, lobby näkyy, offline-peli käynnistyy

## Inputs

- `index.html` — lähde inline-JS:lle (rivit 919-2376)
- `shared.js` — T01:n tuottama jaettu data
- `config.js` — T01:n tuottama ICE_CONFIG
- `daily.html` — T02:n muokkaama (verify-s04.sh tarkistaa myös tämän)
- `daily-game.js` — T02:n tuottama (verify-s04.sh tarkistaa myös tämän)

## Expected Output

- `grid-game.js` — Ristinolla-pelilogiikka, eriytetty JS-tiedosto
- `index.html` — muokattu, inline-JS poistettu, `<script src>` -tagit lisätty
- `scripts/verify-s04.sh` — slicen verifiointiskripti
