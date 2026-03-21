---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T02: Eristä daily-game.js ja päivitä daily.html

**Slice:** S04 — JS-erotus ja koodin siistiminen
**Milestone:** M001

## Description

Siirrä daily.html:n inline `<script>`-blokin sisältö (rivit 641-1779, ~1140 riviä JS:ää) erilliseen `daily-game.js`-tiedostoon. Poista kategoriadefinitiot (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS) koska ne tulevat nyt `shared.js`:stä. Korvaa daily.html:n inline-script `<script src>`-tageilla oikeassa latausjärjestyksessä.

CSS pysyy daily.html:n sisällä (projektikonventio: "CSS pysyy HTML:n sisällä, JS eriytetään").

## Steps

1. **Lue daily.html kokonaan** ja tunnista inline-scriptin rajat: rivi 641 (`<script>`) — rivi 1779 (`</script>`).

2. **Luo `daily-game.js`** joka sisältää:
   - daily.html:n `<script>`-blokin sisällön ILMAN seuraavia (tulevat shared.js:stä):
     - `const TEAMS = { ... };` (rivit ~645-678)
     - `const NATS = { ... };` (rivit ~681-693)
     - `const AWARDS = { ... };` (rivit ~695-707)
     - `const SPECIALS = { ... };` (rivit ~709-716)
     - `const PLAYABLE_AWARDS = ...;` (rivi ~721)
   - Lisää tiedoston alkuun DB-puuttumisen tarkistus (samaan tapaan kuin index.html:ssä):
     ```js
     if (typeof DB === 'undefined') {
       throw new Error('players.js not loaded — DB is undefined');
     }
     ```
   - Kaikki muu koodi säilyy muuttumattomana: buildCategoryPool, intersectCats, mulberry32, getDailySeed, getDayNumber, getDailyDateLabel, shuffleArray, generateDailyGrid, game state (G), localStorage, renderGame, hints, share, practice, countdown, visualViewport-handler.

3. **Muokkaa daily.html**: poista inline `<script>...</script>` -blokki (rivit 641-1779) ja korvaa `<script src>` -tageilla:
   ```html
   <script src="players.js"></script>
   <script src="shared.js"></script>
   <script src="daily-game.js"></script>
   ```
   Huom: players.js:n `<script src>` on jo rivillä 7 — **älä duplikoi sitä**. Lisää shared.js ja daily-game.js heti `</style>`-tagin jälkeisen markup-osion loppuun, ennen `</body>`.

4. **Tarkista latausjärjestys**: players.js (DB) → shared.js (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS) → daily-game.js (käyttää näitä globaaleja). Kaikki ovat synkronisia `<script>` -tageja, joten latausjärjestys on taattu.

5. **Validoi**:
   - `node -e "eval(require('fs').readFileSync('daily-game.js','utf8'))"` — syntaksitarkistus (huom: DB/TEAMS/etc puuttuvat, joten runtime-virhe on ok, mutta SyntaxError ei ole)
   - `wc -l daily.html` — pitäisi olla ~645 riviä (CSS + markup + 3 script-tagia)
   - `grep -c "<script" daily.html` — pitäisi olla 3 (players.js, shared.js, daily-game.js)
   - Selaintesti: avaa daily.html, varmista gridi renderöityy, pelaajahaku toimii, 0 JS-virheitä konsolissa

## Must-Haves

- [ ] daily-game.js sisältää kaiken Daily Grid -pelilogiikan
- [ ] daily-game.js EI sisällä TEAMS/NATS/AWARDS/SPECIALS/PLAYABLE_AWARDS -määrittelyjä (tulevat shared.js:stä)
- [ ] daily.html ei sisällä inline `<script>...</script>` -blokkia (paitsi mahdollinen tyhjä tagi)
- [ ] daily.html:n `<script src>` -tagit ovat oikeassa järjestyksessä: players.js → shared.js → daily-game.js
- [ ] Peli toimii selaimessa identtisesti kuin ennen erotusta

## Verification

- `wc -l daily.html` < 700 (pitäisi olla ~645)
- `wc -l daily-game.js` > 900 (pitäisi olla ~1070)
- `grep -c "^<script src" daily.html` = 3
- `grep -q "TEAMS" daily-game.js && echo "FAIL: TEAMS in daily-game.js" || echo "PASS"` — TEAMS ei saa olla daily-game.js:ssä
- Selaintesti: daily.html latautuu, gridi näkyy, pelaajahaku toimii

## Inputs

- `daily.html` — lähde inline-JS:lle (rivit 641-1779)
- `shared.js` — T01:n tuottama jaettu data (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS)

## Expected Output

- `daily-game.js` — Daily Grid -pelilogiikka, eriytetty JS-tiedosto
- `daily.html` — muokattu, inline-JS poistettu, `<script src>` -tagit lisätty
