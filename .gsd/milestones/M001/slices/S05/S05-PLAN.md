# S05: Bugikorjaukset ja lokalisaatio (FI/EN)

**Goal:** Tunnetut bugit korjattu, peli tukee suomea ja englantia. Oletuskieli selaimen kielen mukaan (navigator.language), fallback englanti.
**Demo:** Peli aukeaa englanniksi (jos selain ei ole suomi). Kielivalinta löytyy UI:sta. Pelaaja 2:n steals toimii oikein. Online-pelin ensimmäinen yhteys ei katkea.

## Must-Haves

- Lokalisaatiojärjestelmä (i18n) joka kattaa kaikki UI-tekstit molemmissa pelimuodoissa
- Oletuskieli: `navigator.language` → "fi" jos alkaa "fi", muuten "en"
- Kielivalinta UI:ssa (kielenvaihto ilman sivunpäivitystä)
- Kielivalinta tallennetaan localStorage:en
- Pelaaja 2:n steal-bugi korjattu ristinollassa
- Online-pelin ensimmäisen yhteyden katkeaminen korjattu/parannettu

## Verification

- Avaa peli englanniksi → kaikki tekstit englanniksi
- Vaihda kieli suomeksi → kaikki tekstit suomeksi
- Ristinolla offline: pelaaja 2 käyttää stealin → steals-laskuri vähenee
- Online-peli: ensimmäinen yhteys ei katkea (tai graceful reconnect)

## Tasks

- [ ] **T01: Lokalisaatiojärjestelmä (i18n)** `est:45m`
  - Why: Pelin kansainvälistäminen vaatii käännösjärjestelmää
  - Files: `shared.js` tai `i18n.js` (uusi), `daily-game.js`, `grid-game.js`
  - Do: 1) Luo i18n-moduuli: `LANG`-objekti joka sisältää kaikki UI-tekstit suomeksi ja englanniksi. 2) `t(key)`-funktio joka palauttaa oikean kielen tekstin. 3) Kielenvalinta: `navigator.language.startsWith('fi') ? 'fi' : 'en'`, localStorage override. 4) Kaikki kovakoodatut suomenkieliset tekstit korvataan `t()`-kutsuilla. 5) Kielivalintanappi UI:ssa (esim. 🇫🇮/🇬🇧 toggle).
  - Verify: Vaihda selain englanninkieliseksi → peli näkyy englanniksi
  - Done when: Kaikki UI-tekstit tulevat i18n-järjestelmästä, kielivalinta toimii

- [ ] **T02: Englanninkieliset käännökset** `est:30m`
  - Why: T01 luo rakenteen, tämä taski täyttää englanninkieliset käännökset
  - Files: `i18n.js` tai vastaava
  - Do: 1) Käy läpi kaikki UI-tekstit: daily.html, index.html. 2) Kirjoita luontevat englanninkieliset käännökset. 3) Tarkista että kategoriat (TEAMS, NATS, AWARDS) näkyvät oikein molemmilla kielillä — joukkuenimet ja palkinnot ovat englanniksi, kansallisuudet lokalisoitu (Suomi/Finland).
  - Verify: Kaikki näkymät englanniksi → ei suomenkielisiä jäämiä
  - Done when: Täysi englanninkielinen käännös, ei puuttuvia avaimia

- [ ] **T03: Pelaaja 2:n steal-bugi** `est:20m`
  - Why: Pelaaja 2:n steals eivät kulu — pelibalanssi rikki
  - Files: `grid-game.js` (tai `index.html` ennen JS-erotusta)
  - Do: 1) Etsi steal-logiikka koodista. 2) Tunnista miksi pelaaja 2:n steals ei vähene (todennäköisesti väärä indeksi tai viittaus). 3) Korjaa bugi. 4) Testaa: molemmat pelaajat käyttävät stealin → laskuri vähenee molemmilla.
  - Verify: Pelaa offline-ristinolla, pelaaja 2 käyttää stealin → steals-laskuri vähenee
  - Done when: Steals toimii identtisesti molemmille pelaajille

- [ ] **T04: Online-pelin ensimmäisen yhteyden korjaus** `est:30m`
  - Why: Ensimmäinen online-peli katkeaa lähes aina — huono ensivaikutelma
  - Files: `grid-game.js` (tai `index.html` ennen JS-erotusta)
  - Do: 1) Analysoi PeerJS-yhteyden alustuslogiikka. 2) Todennäköinen ongelma: PeerJS-yhteys ei ole valmis kun pelin data lähetetään, tai event listener rekisteröidään liian myöhään. 3) Lisää yhteyden tilan tarkistus ennen datan lähetystä. 4) Lisää reconnect/retry-logiikka. 5) Huom: tämä on väliaikainen korjaus — PeerJS korvataan Firebasella myöhemmin.
  - Verify: Avaa online-peli kahdessa selainikkunassa → ensimmäinen peli ei katkea
  - Done when: Online-peli toimii ensimmäisellä kerralla luotettavasti

## Files Likely Touched

- `i18n.js` (uusi) tai `shared.js`
- `daily.html` / `daily-game.js`
- `index.html` / `grid-game.js`
