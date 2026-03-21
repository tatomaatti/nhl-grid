---
estimated_steps: 5
estimated_files: 1
skills_used: []
---

# T02: Joukkuenimet lyhenteinä ja ei-pelattavien palkintojen piilotus

**Slice:** S03 — Daily Grid -generoinnin testaus ja hionta
**Milestone:** M001

## Description

Kaksi UI-muutosta daily.html:iin: (1) joukkuenimet näytetään lyhenteinä (R012) ja (2) ei-pelattavat palkinnot piilotetaan vihjeistä (R013). Molemmat ovat puhtaita UI-kerroksen muutoksia — grid-generoinnin logiikka ja players.js eivät muutu.

## Steps

1. **Lisää `abbr`-kenttä TEAMS-objektiin**: Jokaiselle joukkueelle `abbr`-kenttä = objektin avain (3-kirjaiminen lyhenne). Esim. `EDM:{name:"Edmonton Oilers", icon:"🟠", group:"Joukkue", abbr:"EDM"}`. Tee sama NATS-objektille (abbr = nykyinen name, esim. `abbr:"Kanada"`) ja AWARDS-objektille (abbr = lyhytnimi, esim. `abbr:"Hart Trophy"`). Nämä objektit ovat daily.html:ssä rivien 645–720 välillä.

2. **Päivitä buildCategoryPool()**: Kun kategorioita lisätään pooliin, aseta `cat.abbr = info.abbr || info.name` jokaiselle kategorialle (team, nat, award, special). Näin `cat.abbr` on käytettävissä renderöinnissä. Erityisesti special-kategorioille aseta abbr = name (ei lyhennetä). Tämä funktio on daily.html:ssä rivien 722–776 välillä.

3. **Korvaa `cat.name` → `cat.abbr` renderöintipaikoissa**: 
   - **Grid-headerit** (renderGrid-funktio): Rivi ~1275 `${cat.name}` → `${cat.abbr}` (column header), rivi ~1295 sama (row header)
   - **Guess-panelin listaelementit** (renderGuessList): Rivi ~1444 `<span>${cat.name}</span>` → `<span>${cat.abbr}</span>`
   - **Status-viestit** (makeGuess): Rivi ~1491 `cat.name` → `cat.abbr` (correct), rivi ~1524 `cat.name` → `cat.abbr` (wrong)
   - **Ratkaisu-grid** (buildSolutionGrid): Rivit ~1615 ja ~1624 `${cat.name}` → `${cat.abbr}`
   - **Guess-panelin haku** (renderGuessList filter): Rivi ~1417: lisää `|| cat.abbr.toLowerCase().includes(query)` hakuehtoon niin pelaaja voi hakea sekä lyhenteellä ("COL") että nimellä ("Colorado")

4. **Määritä PLAYABLE_AWARDS ja filtteröi hint-näytössä**: 
   - Lisää daily.html:n `// CATEGORY DEFINITIONS` -osion jälkeen: `const PLAYABLE_AWARDS = new Set(Object.keys(AWARDS));` — tämä kattaa tasan ne 10 palkintoa jotka ovat AWARDS-objektissa (Hart, Vezina, Norris, StanleyCup, Calder, RocketRichard, ConnSmythe, ArtRoss, TedLindsay, Selke).
   - Muokkaa `formatPlayerHint(p)` -funktiota (rivi ~1239): filtteröi `p.a.filter(k => PLAYABLE_AWARDS.has(k))` ennen map-kutsua. Jos filtteröity lista on tyhjä, älä renderöi palkinto-riviä ollenkaan.
   - Tarkista ettei mikään muu paikka daily.html:ssä näytä raakaa `p.a`-dataa ilman filtteröintiä.

5. **Verifiointi selaimessa**: Avaa daily.html selaimessa (tai `file://`-protokollalla). Tarkista:
   - Joukkuekategoriat näkyvät lyhenteinä (esim. "COL" eikä "Colorado Avalanche")
   - Haku "Colorado" löytää COL-kategorian
   - Haku "COL" löytää COL-kategorian  
   - Pelaajan vihje ei näytä ei-pelattavia palkintoja (esim. LadyByng, Masterton)
   - Ratkaisu-gridissä joukkuenimet ovat lyhenteinä

## Must-Haves

- [ ] Joukkuenimet lyhenteinä kaikissa näkymissä (grid-headerit, guess-panel, status, ratkaisu)
- [ ] PLAYABLE_AWARDS = AWARDS-objektin avaimet (10 kpl)
- [ ] formatPlayerHint filtteröi ei-pelattavat palkinnot
- [ ] Haku toimii sekä lyhenteellä (COL) että nimellä (Colorado)
- [ ] players.js EI muutu
- [ ] Generointi-logiikka EI muutu

## Verification

- Selaimessa: joukkuekategoria näkyy lyhenteinä (esim. "EDM" eikä "Edmonton Oilers")
- Selaimessa: guess-panelin haku "Colorado" ja "COL" molemmat löytävät saman kategorian
- `grep -c "PLAYABLE_AWARDS" daily.html` palauttaa >= 2 (määrittely + käyttö)
- `grep -c "cat\.abbr" daily.html` palauttaa >= 6 (kaikki renderöintipaikat)

## Inputs

- `daily.html` — nykyinen pelikoodi (1768 riviä)
- `test-grid-gen.js` — T01:n tuottama testiskripti (vahvistaa ettei generointi rikkoudu muutosten jälkeen)

## Expected Output

- `daily.html` — päivitetty: abbr-kentät, PLAYABLE_AWARDS-filtteri, renderöinnin muutokset
