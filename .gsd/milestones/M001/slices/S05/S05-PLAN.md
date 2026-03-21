# S05: Bugikorjaukset ja lokalisaatio (FI/EN)

**Goal:** Ristinollan tunnetut bugit (steal-laskuri, online-yhteys) korjattu, ja peli tukee suomea ja englantia kielenvalinnalla.
**Demo:** 1) Ristinollassa P2:n steal vähentää laskuria sekä offline- että online-tilassa. 2) Online-pelin ensimmäinen yhteys ei katkea. 3) Kielenvaihtopainike vaihtaa kaikki UI-tekstit suomen ja englannin välillä. 4) Oletuskieli seuraa selaimen kieltä.

## Must-Haves

- Pelaaja 2:n steal-laskuri vähenee käytettäessä (offline ja online)
- Online-pelin ensimmäinen yhteys muodostuu luotettavasti (READY-handshake)
- Lokalisaatiojärjestelmä (lang.js): `t(key)` -funktio + sanakirjat FI/EN
- Kaikki UI-tekstit käännettävissä (HTML-elementit data-i18n -attribuutilla, JS-merkkijonot t()-kutsulla)
- Kielenvaihtopainike molemmissa pelimuodoissa
- Oletuskieli: navigator.language → "fi" jos suomi, muuten "en"
- Kielivalinta tallennetaan localStorage:en
- Joukkuenimet pysyvät englanniksi (NHL-vakio), kansallisuudet lokalisoidaan

## Proof Level

- This slice proves: integration
- Real runtime required: yes (selaintesti molemmat pelimuodot)
- Human/UAT required: yes (online-yhteys vaatii kahden selaimen testauksen)

## Verification

- `bash scripts/verify-s05.sh` — tarkistaa: lang.js olemassaolo, t()-funktio, FI/EN-sanakirjat, data-i18n-attribuutit HTML:ssä, script-tagit, ei kovakoodattuja suomenkielisiä merkkijonoja JS-tiedostoissa, steal-korjaus, READY-handshake
- Selaintesti: daily.html latautuu FI- ja EN-kielillä, kielenvaihtopainike toimii
- Selaintesti: index.html latautuu, offline-peli toimii, steal-laskuri vähenee P2:lla
- Diagnostic check: `verify-s05.sh` tarkistaa myös virheilmoitusten olemassaolon (lang.js latausvirhe konsolissa)

## Observability / Diagnostics

- Runtime signals: `[Lang]`-prefixoidut konsolilokit kielenvaihto-eventeissä, `[PeerJS]`-prefixoidut lokit yhteysneuvottelussa
- Inspection surfaces: `localStorage.getItem('nhl-grid-lang')` palauttaa nykyisen kielen, `getCurrentLang()` -funktio globaalina
- Failure visibility: lang.js latausvirhe näkyy konsolissa "Error: lang.js not loaded", puuttuva käännösavain loggataan `[Lang] Missing key: <key>` -varoituksena
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `shared.js` (TEAMS, NATS, AWARDS, SPECIALS), `daily-game.js`, `grid-game.js`, `daily.html`, `index.html`
- New wiring introduced in this slice: `lang.js` ladataan shared.js:n jälkeen (ennen game-tiedostoja), `data-i18n`-attribuutit HTML-elementeissä, `t()`-kutsut JS:ssä, `applyLanguage()`-funktio päivittää DOM:n
- What remains before the milestone is truly usable end-to-end: nothing — tämä on M001:n viimeinen slice

## Tasks

- [ ] **T01: Korjaa steal-bugi ja online-yhteyden timing-ongelma** `est:45m`
  - Why: R010 (steals ei vähene P2:lla) ja R011 (ensimmäinen online-yhteys katkeaa) ovat kriittisiä bugikorjauksia jotka pitää tehdä ennen lokalisaatiota, koska lokalisaatio muokkaa samoja tiedostoja
  - Files: `grid-game.js`
  - Do: 1) Steal-bugi: online-modessa host ei tiedä guest:n steal-tilasta — lisää `G.stealMode`-päättely hostille `handleGuestMessage`'ssa ennen `validateAndApplyMove`-kutsua: `G.stealMode = (G.cells[data.cell].owner !== 0 && G.cells[data.cell].owner !== 2)`. 2) Online-yhteys: korvaa 500ms setTimeout READY-handshakella — guest lähettää `{type:'READY'}` kun data channel avautuu, host odottaa READY:ä ennen `startOnlineRound()`-kutsua. Lisää 15s timeout varapolulle.
  - Verify: `node -c grid-game.js` (syntaksi), `bash scripts/verify-s05.sh` (steal-korjaus kohta), selaintesti
  - Done when: grid-game.js parsitaan ilman virheitä, READY-handshake löytyy koodista, stealMode asetetaan host-puolella guest-moveissa

- [ ] **T02: Luo lokalisaatiojärjestelmä (lang.js) ja lokalisoi daily.html + daily-game.js** `est:1h30m`
  - Why: R006 (FI/EN-tuki) vaatii keskitetyn käännösjärjestelmän. Daily-peli on yksinkertaisempi (vähemmän merkkijonoja), joten se on hyvä ensimmäinen kohde jolla validoidaan lokalisaatioarkkitehtuuri.
  - Files: `lang.js`, `daily.html`, `daily-game.js`, `shared.js`
  - Do: 1) Luo lang.js: STRINGS-objekti fi/en-sanakirjoineen, `t(key, ...args)`-funktio template-parametreilla, `getCurrentLang()`, `setLang(code)`, `applyLanguage()` joka päivittää kaikki `[data-i18n]`-elementit. Kielenvaihto-event `langChanged` jonka game-tiedostot voivat kuunnella. 2) Lisää shared.js:ään kansallisuuksien englanninkieliset nimet (name_en-kenttä tai lang.js:n kautta). 3) Päivitä daily.html: lisää `data-i18n`-attribuutit staattisiin teksteihin, lisää lang.js script-tagi, lisää kielenvaihtopainike headeriin. 4) Päivitä daily-game.js: korvaa kovakoodatut suomenkieliset merkkijonot `t()`-kutsuilla.
  - Verify: `node -c lang.js && node -c daily-game.js` (syntaksi), selaintesti daily.html kahdella kielellä
  - Done when: lang.js ladataan, daily.html näyttää kaikki tekstit oikein FI:nä ja EN:nä, kielenvaihtopainike toimii, kieli tallentuu localStorageen

- [ ] **T03: Lokalisoi index.html + grid-game.js ja luo verifiointiskripti** `est:1h30m`
  - Why: R006 vaatii lokalisaation myös ristinollapeliin. Tämä on suurempi kokonaisuus (~50 JS-merkkijonoa + ~40 HTML-tekstiä). Verifiointiskripti todentaa koko slicen valmiuden.
  - Files: `index.html`, `grid-game.js`, `scripts/verify-s05.sh`
  - Do: 1) Päivitä index.html: lisää `data-i18n`-attribuutit kaikkiin staattisiin teksteihin (settings, lobby, disconnect, game, surrender, win, round-overlay -näkymät), lisää lang.js script-tagi shared.js:n jälkeen, lisää kielenvaihtopainike settings-näkymään. 2) Päivitä grid-game.js: korvaa kaikki kovakoodatut suomenkieliset merkkijonot `t()`-kutsuilla (~50 kohtaa). Kuuntele `langChanged`-eventtiä `refreshUI()`-kutsulla. 3) Luo scripts/verify-s05.sh: tarkista lang.js:n olemassaolo ja sisältö, data-i18n-attribuutit molemmissa HTML:ssä, script-tagit, steal-korjauksen läsnäolo, READY-handshake, ettei kovakoodattuja suomenkielisiä merkkijonoja ole JS-tiedostoissa (pois lukien kommentit).
  - Verify: `bash scripts/verify-s05.sh` palauttaa exit 0, `node -c grid-game.js` (syntaksi), selaintesti index.html kahdella kielellä
  - Done when: verify-s05.sh läpäisee kaikki tarkistukset, index.html näyttää kaikki tekstit FI:nä ja EN:nä, kielenvaihtopainike toimii, steal-korjaus vahvistettu, READY-handshake vahvistettu

## Files Likely Touched

- `grid-game.js`
- `daily-game.js`
- `shared.js`
- `lang.js`
- `daily.html`
- `index.html`
- `scripts/verify-s05.sh`
