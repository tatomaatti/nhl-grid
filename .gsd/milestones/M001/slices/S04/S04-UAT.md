# S04: JS-erotus ja koodin siistiminen — UAT

## Preconditions

- Tiedostot: `shared.js`, `config.js`, `daily-game.js`, `grid-game.js`, `daily.html`, `index.html`, `players.js` ovat kaikki samassa hakemistossa
- Selain: Chrome tai Firefox DevTools auki (Console-välilehti)
- Verifiointiskripti: `scripts/verify-s04.sh` olemassa

---

## Testi 1: Verifiointiskriptin läpäisy

**Tarkoitus:** Varmistaa tiedostorakenne, rivimäärät, script-tagit ja syntaksi yhdellä ajolla

1. Avaa terminaali projektin juuressa
2. Suorita `bash scripts/verify-s04.sh`
3. **Odotettu:** Kaikki 27 tarkistusta PASS, exit code 0
4. **Odotettu:** daily.html < 700 riviä, index.html < 950 riviä
5. **Odotettu:** Ei inline `<script>` -blokkeja kummassakaan HTML-tiedostossa

---

## Testi 2: Daily Grid toimii selaimessa

**Tarkoitus:** Varmistaa että daily.html:n pelilogiikka toimii eriytettynä

1. Avaa `daily.html` selaimessa (DevTools Console auki)
2. **Odotettu:** Gridi renderöityy (3×3 ruudukko näkyy)
3. **Odotettu:** Päivämäärä ja Grid #N näkyvät
4. **Odotettu:** 0 JS-virheitä konsolissa (ei 404, ei ReferenceError)
5. Klikkaa rivin tai sarakkeen otsikkoa
6. **Odotettu:** Arvauslista/pelaajahakupaneeli avautuu
7. Kirjoita hakukenttään "Gretzky"
8. **Odotettu:** Wayne Gretzky näkyy tuloksissa
9. Valitse pelaaja ja lähetä arvaus
10. **Odotettu:** Peli reagoi arvaukseen (oikein/väärin -palaute)

---

## Testi 3: Ristinolla toimii selaimessa (offline)

**Tarkoitus:** Varmistaa että index.html:n pelilogiikka toimii eriytettynä

1. Avaa `index.html` selaimessa (DevTools Console auki)
2. **Odotettu:** Lobby-näkymä näkyy (pelimuodon valinta)
3. **Odotettu:** 0 JS-virheitä konsolissa
4. Klikkaa "▶ PAIKALLINEN" (tai vastaava offline-pelinappi)
5. **Odotettu:** Gridi renderöityy (3×3 ruudukko kategorioineen)
6. Klikkaa ruutua
7. **Odotettu:** Pelaajahakupaneeli avautuu
8. Kirjoita "Ovechkin"
9. **Odotettu:** Alexander Ovechkin näkyy tuloksissa
10. Valitse pelaaja ja lähetä
11. **Odotettu:** Peli reagoi (hyväksyy/hylkää, vuoro vaihtuu)

---

## Testi 4: Joukkueet näkyvät lyhenteinä (regressio S03)

**Tarkoitus:** Varmistaa ettei JS-erotus rikkonut S03:n lyhenne-toimintoa

1. Avaa `daily.html` selaimessa
2. **Odotettu:** Joukkuekategoriat näkyvät lyhenteinä (esim. "COL", "EDM", "TOR") eikä täysinä niminä
3. **Odotettu:** Kansallisuudet näkyvät lyhenteinä (esim. "CAN", "FIN", "USA")

---

## Testi 5: Ei-pelattavat palkinnot piilotettu (regressio S03)

**Tarkoitus:** Varmistaa ettei JS-erotus rikkonut PLAYABLE_AWARDS-filtteröintiä

1. Avaa `daily.html` selaimessa
2. Arvaa pelaaja jolla on vain ei-pelattava palkinto (esim. Anders Lee — KingClancy)
3. **Odotettu:** Vihjeessä EI näy palkintoja (koska ainoa palkinto on ei-pelattava)
4. Arvaa Wayne Gretzky
5. **Odotettu:** Vihjeessä näkyy pelattavat palkinnot (Hart, ArtRoss jne.) mutta EI LadyByngiä

---

## Testi 6: Mobiili-UX säilynyt (regressio S01)

**Tarkoitus:** Varmistaa ettei JS-erotus rikkonut visualViewport-handleria

1. Avaa `daily.html` mobiilissa tai Chrome DevToolsin laite-emulaatiossa (esim. iPhone 15)
2. Klikkaa hakukenttää (virtuaalinäppäimistö avautuu)
3. **Odotettu:** Näkymä siirtyy ylös näppäimistön tieltä (translateY)
4. Sulje näppäimistö
5. **Odotettu:** Näkymä palautuu alkuperäiseen asentoon
6. Toista sama `index.html`:llä

---

## Testi 7: Script-tiedoston puuttumisen diagnostiikka

**Tarkoitus:** Varmistaa virheilmoituksen selkeys kun tiedosto puuttuu

1. Nimeä `shared.js` väliaikaisesti uudelleen: `mv shared.js shared.js.bak`
2. Avaa `daily.html` selaimessa (DevTools Console auki)
3. **Odotettu:** Konsolissa 404-virhe shared.js:lle JA ReferenceError: TEAMS is not defined
4. Palauta: `mv shared.js.bak shared.js`
5. Nimeä `players.js` väliaikaisesti: `mv players.js players.js.bak`
6. Avaa `daily.html` selaimessa
7. **Odotettu:** Konsolissa 404-virhe players.js:lle JA "Error: players.js not loaded — DB is undefined" tai vastaava
8. **Odotettu:** Sivu näyttää käyttäjäystävällisen virheilmoituksen (ei tyhjää sivua)
9. Palauta: `mv players.js.bak players.js`

---

## Testi 8: Jaettujen muuttujien saatavuus

**Tarkoitus:** Varmistaa ettei duplikaatteja ole ja globaalit toimivat

1. Avaa `daily.html` selaimessa
2. Kirjoita DevTools Consoleen: `typeof TEAMS`, `typeof NATS`, `typeof AWARDS`, `typeof SPECIALS`, `typeof PLAYABLE_AWARDS`
3. **Odotettu:** Kaikki palauttavat "object" (PLAYABLE_AWARDS "object" koska Set)
4. Kirjoita: `Object.keys(TEAMS).length`
5. **Odotettu:** 33
6. Kirjoita: `PLAYABLE_AWARDS.size`
7. **Odotettu:** 10
8. Avaa `index.html` selaimessa
9. Toista kohdat 2-7
10. **Odotettu:** Samat tulokset
11. Kirjoita: `typeof ICE_CONFIG`
12. **Odotettu:** "object" (config.js ladataan vain index.html:ssä)

---

## Edge Cases

### E1: daily.html ei lataa config.js:ää
1. Avaa `daily.html` selaimessa
2. DevTools Console: `typeof ICE_CONFIG`
3. **Odotettu:** "undefined" (config.js ei ole daily.html:n script-tageissa — ei tarvita)

### E2: index.html ei lataa daily-game.js:ää
1. Avaa `index.html` selaimessa
2. **Odotettu:** 0 JS-virheitä — grid-game.js on itsenäinen, ei viittaa daily-game.js:n funktioihin

### E3: Selaimen välimuistin tyhjennys
1. Hard refresh (Ctrl+Shift+R) molemmilla sivuilla
2. **Odotettu:** Kaikki script-tiedostot latautuvat uudelleen (Network-välilehti: 200, ei 304)
3. **Odotettu:** Peli toimii normaalisti

---

## Hyväksyntäkriteerit

- [ ] Testit 1-8 läpäisty
- [ ] Edge cases E1-E3 tarkistettu
- [ ] Molemmissa peleissä 0 JS-virheitä konsolissa
- [ ] Rivimäärät: daily.html < 700, index.html < 950
