# S05 UAT — Bugikorjaukset ja lokalisaatio (FI/EN)

## Esiehdot

- daily.html ja index.html tarjoillaan paikallisesti tai GitHub Pagesissa
- Selain: Chrome tai Firefox (desktop), mieluiten myös iOS Safari / Android Chrome
- Online-testit: kaksi erillistä selainta/ikkunaa samalla koneella
- LocalStorage tyhjä tai `nhl-grid-lang` poistettu ennen testien aloitusta

---

## Testi 1: Oletuskieli — suomi

**Tarkoitus:** Varmista että peli tunnistaa selaimen kielen ja asettaa suomen oletuskieleksi suomenkielisessä selaimessa.

1. Aseta selain suomeksi (tai käytä selainta jonka `navigator.language` alkaa "fi")
2. Poista `localStorage.getItem('nhl-grid-lang')` (DevTools → Application → Local Storage → poista)
3. Avaa `daily.html`
4. **Odotettu:** Kaikki tekstit ovat suomeksi ("kategoriaa arvattu", "Rivi 1", "Sarake 1"), päivämäärä muodossa "21. maaliskuuta 2026"
5. Kielenvaihtopainike näyttää "🇬🇧 EN"
6. Konsolissa `[Lang] Initialized: fi`

## Testi 2: Oletuskieli — englanti

1. Aseta selain englanniksi tai poista localStorage ja käytä en-selainta
2. Avaa `daily.html`
3. **Odotettu:** Tekstit englanniksi ("categories guessed", "Row 1", "Column 1"), päivämäärä "March 21, 2026"
4. Kielenvaihtopainike näyttää "🇫🇮 FI"

## Testi 3: Kielenvaihto — Daily Grid

1. Avaa `daily.html` (oletus suomi)
2. Klikkaa "🇬🇧 EN" -painiketta
3. **Odotettu:** Kaikki staattiset tekstit vaihtuvat englanniksi välittömästi
4. Arvauspaneelin otsikot ("Mikä yhdistää" → "What connects"), kategoriaryhmät ("JOUKKUE" → "TEAM", "KANSALLISUUS" → "NATIONALITY"), kansallisuusnimet ("Kanada" → "Canada", "Suomi" → "Finland")
5. Painike muuttuu "🇫🇮 FI":ksi
6. Klikkaa "🇫🇮 FI" — kaikki palautuu suomeksi
7. Lataa sivu uudelleen — kieli pysyy viimeksi valittuna (localStorage)

## Testi 4: Kielenvaihto — Ristinolla (settings)

1. Avaa `index.html` (settings-näkymä)
2. **Odotettu:** Kaikki asetustekstit oikealla kielellä ("Peliasetukset" / "Game settings", "Vuoron aikaraja" / "Turn time limit" jne.)
3. Klikkaa kielenvaihtopainiketta
4. **Odotettu:** Kaikki settings-näkymän tekstit vaihtuvat
5. Painikkeet, labelit, selitykset — kaikki lokalisoitu
6. Konsolissa ei JS-virheitä

## Testi 5: Kielenvaihto kesken pelin — Ristinolla

1. Avaa `index.html`, aloita paikallinen peli (2 pelaajaa)
2. Pelaa 1-2 siirtoa
3. Mene settings-näkymään ja vaihda kieltä
4. Palaa peliin
5. **Odotettu:** Pelaajanimet ("Pelaaja 1" → "Player 1"), vuoroteksti ("Vuoro: Pelaaja 1" → "Turn: Player 1"), steal-teksti päivittyvät
6. Grid-otsikot (kategoriat) vaihtuvat lokalisoituihin versioihin
7. Peli jatkuu normaalisti — mikään tila ei katoa

## Testi 6: Steal-bugin korjaus — offline

1. Avaa `index.html`, aseta "Solun varastaminen": Kyllä / Yes
2. Aseta steals: 2 kummallekin pelaajalle
3. Aloita peli
4. Pelaaja 1: valitse solu, arvaa oikein → solu P1:lle
5. Pelaaja 2: valitse **sama solu** (steal), arvaa oikein
6. **Odotettu:** P2:n steal-laskuri laskee 2 → 1
7. Toista steal → P2:n laskuri 1 → 0
8. Yritä kolmatta stealia → **Odotettu:** "Ei varastuksia jäljellä" / "No steals left"

## Testi 7: Steal-bugin korjaus — online

1. Avaa `index.html` kahdessa selainikkunassa
2. Ikkunassa A: Luo online-peli, kopioi koodi
3. Ikkunassa B: Liity peliin koodilla
4. Aseta steals molemmille, aloita peli
5. Pelaaja 2 (guest, ikkunassa B): tee steal
6. **Odotettu:** P2:n steal-laskuri vähenee **molemmissa ikkunoissa**
7. Toista kunnes stealit loppuvat — laskuri nollassa, varastaminen estetty

## Testi 8: Online-yhteyden READY-handshake

1. Avaa `index.html` kahdessa selainikkunassa
2. Ikkunassa A: Luo online-peli
3. Ikkunassa B: Liity peliin
4. **Odotettu:** Peli alkaa ensimmäisellä kerralla ilman katkoksia
5. Konsolissa A: `[PeerJS] Host: guest READY received`
6. Konsolissa B: `[PeerJS] Sending READY to host` (tai vastaava)
7. **Ei** `[PeerJS] Host: guest READY not received in 15s` -viestiä normaalioloissa
8. Pelaa yksi täysi kierros — yhteys pysyy vakaana

## Testi 9: Kielenvaihto — Daily Grid guess-paneeli

1. Avaa `daily.html` suomeksi
2. Klikkaa solua → arvauspaneeli avautuu
3. **Odotettu:** "Mikä yhdistää:", kategoriaryhmät suomeksi (JOUKKUE, KANSALLISUUS, PALKINTO, ERIKOINEN)
4. Hae "Kanada" → löytyy
5. Vaihda kieli englanniksi
6. **Odotettu:** "What connects:", "TEAM", "NATIONALITY", "AWARD", "SPECIAL"
7. Hae "Canada" → löytyy
8. Hae "Kanada" → **ei** löydy (haku toimii nykyisellä kielellä)

## Testi 10: LocalStorage-persistenssi yli sivujen

1. Avaa `daily.html`, vaihda kieli englanniksi
2. Avaa `index.html` samassa selaimessa
3. **Odotettu:** index.html näyttää englanninkieliset tekstit (sama localStorage-avain)
4. Vaihda kieli suomeksi index.html:ssä
5. Palaa daily.html:iin, lataa uudelleen
6. **Odotettu:** daily.html näyttää suomenkieliset tekstit

## Testi 11: Joukkuenimet pysyvät englanniksi

1. Avaa `daily.html` suomeksi
2. Tarkista grid-otsikot joissa joukkue-kategoria
3. **Odotettu:** Joukkueiden lyhenteet englanniksi (EDM, TOR, MTL) — eivät lokalisoidu
4. Vaihda englanniksi → joukkuenimet identtiset

## Testi 12: Konsolidiagnostiikka

1. Avaa `daily.html`, avaa DevTools Console
2. **Odotettu:** `[Lang] Initialized: fi|en` näkyy
3. Vaihda kieltä → `[Lang] Language set: en|fi` ja `[Lang] Applied language to N elements`
4. Suorita konsolissa: `getCurrentLang()` → palauttaa "fi" tai "en"
5. Suorita konsolissa: `t('daily_title')` → palauttaa lokalisoidun otsikon
6. Suorita konsolissa: `t('nonexistent_key')` → palauttaa "nonexistent_key" ja konsolissa `[Lang] Missing key: nonexistent_key`

---

## Reunatapaukset

- **Tyhjä localStorage + ei-fi/ei-en selain** (esim. ruotsi): odotettu fallback englantiin
- **lang.js 404** (tiedosto puuttuu): game-tiedostojen `_t()` fallback näyttää avaimen sellaisenaan, konsolissa virheilmoitus
- **Hidas yhteys online-pelissä**: 15s READY-fallback laukeaa → peli alkaa, konsolissa `[PeerJS] Host: guest READY not received in 15s`
- **Kielenvaihto settings-näkymässä ennen peliä**: ei JS-virheitä (guard: `G.cells && offsetParent`)
