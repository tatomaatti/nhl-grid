# S03: Daily Grid -generoinnin testaus ja hionta — UAT

**Milestone:** M001
**Written:** 2026-03-21

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: Grid-generaattorin laatu todistettavissa skriptillä (artifact-driven). UI-muutokset (abbr, palkintofiltteri) vaativat selaintarkistuksen (live-runtime).

## Preconditions

- `players.js` on olemassa ja sisältää ~5880 pelaajaa
- `daily.html` ladattavissa selaimessa (file:// tai localhost)
- Node.js asennettu (v18+)

## Smoke Test

`node test-grid-gen.js 5` — 5 gridiä generoituu, exit code 0, kaikki OK.

## Test Cases

### 1. Grid-generaattorin 30 seedin validointi

1. Aja `node test-grid-gen.js 30`
2. Tarkista output: "Generated: 30/30 OK, 0 fallbacks, 0 failures"
3. **Expected:** Exit code 0, jokainen grid OK, 0 FAIL-rivejä

### 2. Grid-generaattorin verbose-diagnostiikka

1. Aja `node test-grid-gen.js 1 --verbose`
2. Tarkista: tulostuu täysi grid-rakenne (6 kategoriaa, 9 pelaajaa, intersektio-koot)
3. **Expected:** Exit code 0, verbose-output sisältää pelaajien nimet, kategoriatyypit ja intersektio-koot

### 3. FAIL-rivien puuttuminen

1. Aja `node test-grid-gen.js 30 2>&1 | grep -c "FAIL"`
2. **Expected:** Tulos on 0 (grep exit code 1 = ei osumia)

### 4. Joukkuenimet lyhenteinä grid-headereissa

1. Avaa daily.html selaimessa
2. Pelaa päivän grid: tee yksi arvaus joukkuekategoriaa vasten
3. Katso grid-headerien tekstiä (rivi- ja sarakeotsikot)
4. **Expected:** Joukkuenimet näkyvät lyhenteinä (esim. "PHI", "COL", "EDM") — ei "Philadelphia Flyers"

### 5. Joukkuenimet lyhenteinä guess-panelissa

1. Avaa daily.html, tee arvaus
2. Katso guess-panelin kategorialistausta (yläosan filtteri)
3. **Expected:** Joukkuenimet lyhenteinä, ei täysinä niminä

### 6. Joukkuenimet lyhenteinä status-viesteissä

1. Arvaa oikein joukkuekategoriassa → katso "Correct"-viestiä
2. Arvaa väärin joukkuekategoriassa → katso "Wrong"-viestiä
3. **Expected:** Molemmissa viesteissä joukkue näkyy lyhenteenä

### 7. Joukkuenimet lyhenteinä ratkaisu-gridissä

1. Pelaa grid loppuun (oikein tai vääriin arvauksiin)
2. Katso ratkaisu-gridin otsikkoja
3. **Expected:** Joukkuenimet lyhenteinä ratkaisu-gridissä

### 8. Haku toimii sekä lyhenteellä että nimellä

1. Avaa daily.html, klikkaa solua jossa joukkuekategoria on yksi riveistä/sarakkeista
2. Kirjoita hakukenttään "COL" → tarkista tulokset
3. Tyhjennä, kirjoita "Colorado" → tarkista tulokset
4. **Expected:** Molemmat haut löytävät Colorado-kategorian pelaajat

### 9. Gretzky-hintin palkintofiltteröinti

1. Avaa daily.html, arvaa "Wayne Gretzky" sellaisessa ruudussa johon hän sopii
2. Katso hintti-osio (pelaajan tiedot)
3. **Expected:** Näkyy: ArtRoss, ConnSmythe, Hart, StanleyCup, TedLindsay. EI näy: LadyByng, Lester Patrick Trophy.

### 10. Pelaaja jolla vain ei-pelattavia palkintoja

1. Etsi pelaaja jolla on vain ei-pelattava palkinto (esim. Anders Lee — vain KingClancy)
2. Arvaa hänet ja katso hintti
3. **Expected:** Palkintoriviä ei näytetä ollenkaan

### 11. players.js muokkaamattomuus

1. Aja `git diff --name-only` (tai vertaa players.js:n SHA S02:n jälkeen)
2. **Expected:** players.js ei ole muuttunut S03:ssa

## Edge Cases

### Pelaaja ilman palkintoja

1. Arvaa pelaaja jolla ei ole mitään palkintoja (esim. tavallinen roolipelaaja)
2. **Expected:** Palkintoriviä ei näytetä (sama käyttäytyminen kuin ennenkin)

### SPECIALS-kategoria

1. Jos päivän gridissä on SPECIALS-kategoria (esim. "Canadian-born goalies")
2. **Expected:** Näkyy täydellä nimellä (SPECIALS ei käytä lyhenteitä, ne ovat jo lyhyitä)

### 100 gridin laaja validointi

1. Aja `node test-grid-gen.js 100`
2. **Expected:** 100/100 OK, 0 fallbackia, 0 failures

## Failure Signals

- `node test-grid-gen.js 30` tulostaa FAIL-rivin tai exit code ≠ 0
- Grid-headereissa näkyy täysi joukkuenimi (esim. "Philadelphia Flyers")
- Pelaajan hintissä näkyy "LadyByng", "Masterton", "KingClancy", "Jennings" tai "MessierLeadership"
- Haku "Colorado" ei löydä mitään (abbr-haku rikkoo name-haun)
- JS-virhe konsolissa daily.html:ää ladatessa

## Not Proven By This UAT

- Ristinollan (index.html) kategorioiden renderöinti — ei muutettu S03:ssa
- Mobiili-layout joukkuelyhenteillä — vaatii oikean mobiililaitteen
- Grid-generoinnin laatu tulevilla sedeillä (>100 gridiä) — tilastollinen varmuus kasvaa testaamalla enemmän

## Notes for Tester

- Daily Grid vaihtuu päivittäin (seed perustuu päivämäärään). Testaa tämän päivän grid + `node test-grid-gen.js 30` kattaa 30 seuraavaa päivää.
- Palkintofiltteröinnin helpoin tarkistus selaimessa: avaa konsoli ja aja `formatPlayerHint(DB.find(p => p.n === 'Wayne Gretzky'))` — näyttää filtteröidyn tuloksen.
- Haku-testissä (case 8) varmista että kirjoitat hakukenttään, et grid-soluun.
