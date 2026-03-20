# S01: Mobiili-UX ja duplikaatin poisto — UAT

**Milestone:** M001
**Written:** 2026-03-21

## UAT Type

- UAT mode: mixed (artifact-driven + human-experience)
- Why this mode is sufficient: Koodipohjamuutokset voidaan verifioidaan verify-skriptillä, mutta mobiili-UX vaatii fyysisen laitteen testausta (iOS Safari + Android Chrome)

## Preconditions

- daily.html ja index.html ovat saatavilla (joko GitHub Pages tai lokaali http-server)
- Testauslaitteet: iPhone (Safari) ja Android-puhelin (Chrome) — tai DevTools mobile emulation
- Selain-konsoli auki diagnostiikkaa varten

## Smoke Test

1. Avaa `daily.html` puhelimella
2. Napauta ruudukon solua → arvausnäkymä aukeaa
3. Napauta hakukenttää → virtuaalinäppäimistö aukeaa **eikä riko layoutia**
4. Napauta arvausehdotusta → valinta rekisteröityy

Jos nämä neljä askelta toimivat, slice on toiminnallisesti kunnossa.

## Test Cases

### 1. Daily Grid — viewport ja overscroll

1. Avaa `daily.html` mobiiliselaimessa
2. Tarkista ettei sivua voi zoomata kaksoisnapautuksella (touch-action: manipulation)
3. Vedä sivua alaspäin ruudun yläreunasta → **Expected:** Ei pull-to-refresh-efektiä (overscroll-behavior: none)
4. Käännä puhelin vaakatasoon ja takaisin → **Expected:** Layout skaalautuu oikein, ei ylivuotoa

### 2. Daily Grid — virtuaalinäppäimistö

1. Avaa `daily.html`, napauta solua avataksesi arvausnäkymän
2. Napauta hakukenttää → näppäimistö aukeaa
3. **Expected:** Arvausnäkymä (guess-panel) siirtyy ylöspäin niin että hakukenttä pysyy näkyvissä näppäimistön yläpuolella
4. Sulje näppäimistö (napauta muualle) → **Expected:** Panel palaa normaaliin asentoon
5. Avaa konsoli → **Expected:** `[MobileUX]`-rivit näyttävät keyboard height -arvon

### 3. Daily Grid — kosketusalueet

1. Avaa `daily.html`, napauta solua
2. Yritä napauttaa arvausehdotusta (guess-item) → **Expected:** Osuu helposti, ei tarvitse tarkkaa kohdistusta
3. Napauta hakukenttää → **Expected:** Osuu helposti
4. Napauta "Vihjetila"-painiketta (hint-mode-banner) → **Expected:** Osuu helposti
5. Napauta jakopainiketta (share-btn) pelin jälkeen → **Expected:** Osuu helposti

### 4. Ristinolla (index.html) — viewport ja overscroll

1. Avaa `index.html` mobiiliselaimessa
2. Tarkista ettei sivua voi zoomata kaksoisnapautuksella
3. Vedä sivua alaspäin → **Expected:** Ei pull-to-refresh-efektiä
4. **Expected:** Koko lobby-näkymä mahtuu ruudulle ilman horisontaalista scrollia

### 5. Ristinolla — asetuspainikkeet (steal & weight)

1. Avaa `index.html`, siirry asetuksiin
2. Napauta steal-count-painikkeita (0, 1, 2, 3) → **Expected:** Painikkeet ovat riittävän suuria (44×44px), helppo osua
3. Napauta weight-painikkeita (kevyt, normaali, raskas) → **Expected:** Sama — selkeästi napautettavia

### 6. Ristinolla — virtuaalinäppäimistö pelissä

1. Aloita peli, napauta solua → hakukentän pitäisi ilmestyä
2. Napauta hakukenttää → näppäimistö aukeaa
3. **Expected:** Hakukentän alue (search-wrap) siirtyy ylöspäin, kenttä pysyy näkyvissä
4. Sulje näppäimistö → **Expected:** Palautuu normaaliin asentoon

### 7. Ristinolla — lobby-näkymän näppäimistö

1. Avaa `index.html`, valitse Online → Liity peliin
2. Napauta "Syötä koodi" -kenttää → näppäimistö aukeaa
3. **Expected:** Syöttökenttä (lobby-join-input) pysyy näkyvissä näppäimistön yläpuolella

### 8. nhl-grid.html redirect

1. Avaa `nhl-grid.html` selaimessa
2. **Expected:** Ohjaa automaattisesti `index.html`:iin 1 sekunnissa
3. Jos JS on pois päältä: **Expected:** Näkyy linkki "Siirry pelisivulle"

## Edge Cases

### iOS Safari address bar collapse
1. Avaa `daily.html` iOS Safarissa
2. Scrollaa alas niin että osoitepalkki kutistuu
3. Napauta solua → arvausnäkymä aukeaa
4. **Expected:** Layout ei hyppää — 100svh käsittelee osoitepalkin muutoksen

### Android Chrome back-gesture
1. Avaa `index.html` Android Chromessa
2. Aloita peli, avaa hakukentän
3. Pyyhkäise vasemmalta (back-gesture)
4. **Expected:** Overscroll-behavior estää sivuefektejä pelialueella

### Hyvin pieni näyttö (iPhone SE)
1. Avaa `daily.html` ja `index.html` iPhone SE -kokoisella näytöllä (375×667)
2. **Expected:** Kaikki painikkeet ovat edelleen napautettavia, layout ei ylivuoda

## Failure Signals

- Virtuaalinäppäimistö työntää sisältöä näkymättömiin (layout push) = viewport meta tai visualViewport handler ei toimi
- Painike ei reagoi napautukseen = touch target liian pieni (<44px)
- Sivu zoomaa kaksoisnapautuksella = touch-action: manipulation ei vaikuta
- Pull-to-refresh aktivoituu = overscroll-behavior: none ei toimi
- nhl-grid.html ei ohjaa = redirect rikki
- Konsoli ei näytä `[MobileUX]`-rivejä = visualViewport handler ei latautunut

## Not Proven By This UAT

- Pelaajatietokannan oikeellisuus (R003 — S02:n vastuulla)
- Grid-generoinnin laatu (R004 — S03:n vastuulla)
- JS-erotuksen toimivuus (R005 — S04:n vastuulla)
- Lokalisaatio (R006 — S05:n vastuulla)
- Steal-bugin korjaus ja online-yhteysongelma (R010, R011 — S05:n vastuulla)

## Notes for Tester

- `[MobileUX]`-lokit konsolissa auttavat diagnosoimaan jos näppäimistön käsittely ei toimi — kerro keyboard height -arvo bugiraportissa.
- iOS Safari ja Android Chrome käsittelevät virtuaalinäppäimistöä eri tavalla — testaa molemmat.
- DevTools mobile emulation EI vastaa täysin oikeaa laitetta visualViewportin osalta — fyysinen laite on ainoa lopullinen todiste.
- steal-count ja weight -painikkeiden koko on helppo vahvistaa visuaalisesti — niiden pitäisi olla selkeästi isompia kuin ennen.
