# S03: Daily Grid -generoinnin testaus ja hionta

**Goal:** Grid-generointi on testattu 30+ seedillä ja todettu laadukkaaksi. Daily-gridissä joukkuenimet näytetään lyhenteinä ja ei-pelattavat palkinnot on piilotettu UI:sta.
**Demo:** `node test-grid-gen.js 30` raportoi 30/30 onnistunutta gridiä, 0 fallbackia. Daily.html:n kategoriaotsikoissa joukkuenimet ovat lyhenteinä (COL, SJS). Vihjeet näyttävät vain pelissä olevia palkintoja (Hart, Vezina jne. — ei LadyByng, Masterton yms.).

## Must-Haves

- Node.js-testiskripti `test-grid-gen.js` joka generoi N gridiä peräkkäisillä sedeillä ja raportoi laadun
- Jokainen generoitu grid on ratkaistavissa (9 uniikkia pelaajaa, kaikki intersektiot ≥ MIN_POOL)
- 0 fallback-käyttöä 30+ gridillä
- Kategoriatyyppien jakauma raportoitu (team/nat/award/special)
- Joukkuenimet lyhenteinä (esim. "COL") kaikissa Daily Grid -näkymissä: grid-headerit, guess-paneli, status-viestit, ratkaisu-grid
- Ei-pelissä-olevat palkinnot (Jennings, Masterton, KingClancy, LadyByng, MessierLeadership ym.) piilotettu vihjeistä — filtteri on UI-tasolla, players.js ei muutu
- PLAYABLE_AWARDS-lista vastaa AWARDS-objektin avaimia (10 palkintoa: Hart, Vezina, Norris, StanleyCup, Calder, RocketRichard, ConnSmythe, ArtRoss, TedLindsay, Selke)

## Proof Level

- This slice proves: contract (grid-generoinnin laatu) + integration (UI-muutosten toimivuus)
- Real runtime required: yes (selainverifiointi)
- Human/UAT required: no

## Verification

- `node test-grid-gen.js 30` — kaikki 30 gridiä generoituvat, 0 fallback-käyttöä, raportti tulostuu
- `node test-grid-gen.js 30 2>&1 | grep -c "FAIL"` palauttaa 0
- daily.html selaimessa: joukkuekategoriat näkyvät lyhenteinä (esim. "COL" ei "Colorado Avalanche")
- daily.html selaimessa: pelaajan vihje näyttää vain pelattavia palkintoja
- Diagnostiikka: `node test-grid-gen.js 1 --verbose` tulostaa yksittäisen gridin yksityiskohtaisen rakenteen (pelaajat, kategoriat, intersektio-koot) — diagnosointi kun generointi epäonnistuu
- Failure-path: epäonnistunut grid tulostaa FAIL-rivin (seed, syy, yritystenmäärä) stderriin; exit code 1 kun yksikään grid epäonnistuu

## Observability / Diagnostics

- Runtime signals: test-grid-gen.js tulostaa per-grid yhteenvedon (seed, kategoriatyypit, min-intersektio, fallback-status) ja lopuksi kokonaistilastot
- Inspection surfaces: `node test-grid-gen.js 1 --verbose` yksittäisen gridin täydellinen rakenne, `node test-grid-gen.js 100` laaja tilastollinen validointi
- Failure visibility: epäonnistunut grid tulostaa seed-arvon, virhesyyn (liian pieni intersektio, fallback, ei ratkaisua) ja yritystenmäärän
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `players.js` (S02:n tuottama, 5880 pelaajaa), daily.html grid-generointi (TEAMS, NATS, AWARDS, SPECIALS, generateDailyGrid, buildCategoryPool)
- New wiring introduced in this slice: test-grid-gen.js extrahoi generoinnin daily.html:stä Node.js-kontekstiin; PLAYABLE_AWARDS-filtteri formatPlayerHint()-funktioon
- What remains before the milestone is truly usable end-to-end: S04 (JS-erotus), S05 (bugikorjaukset + lokalisaatio)

## Tasks

- [x] **T01: Grid-generaattorin testiskripti** `est:45m`
  - Why: R004 — generoinnin laatu pitää todentaa systemaattisesti. Testiskripti on ainoa tapa varmistaa, että 30+ gridiä on ratkaistavissa ja laadukkaita.
  - Files: `test-grid-gen.js` (uusi), `daily.html` (lähde generointi-logiikalle), `players.js` (pelaajadata)
  - Do: 1) Extrahoi daily.html:n generointi-funktiot (PRNG, kategoriat, generateDailyGrid, buildCategoryPool jne.) Node.js-ajettavaksi. 2) Lataa players.js vm-kontekstissa. 3) Generoi N gridiä peräkkäisillä sedeillä (alkuseed = getDailySeed(epoch) + offset). 4) Raportoi: onnistumis-%, fallback-käyttö, kategoriatyyppien jakauma, min/avg/max intersektio-koot, pelaajien fame-jakauma. 5) --verbose-flagilla tulosta yksittäisen gridin täysi rakenne. 6) Exit code 1 jos yksikään grid epäonnistuu.
  - Verify: `node test-grid-gen.js 30` — tulostaa raportin, exit code 0, 0 FAIL-rivejä
  - Done when: Testiskripti generoi 30+ gridiä onnistuneesti ja raportoi tilastot. --verbose toimii yksittäiselle gridille.

- [ ] **T02: Joukkuenimet lyhenteinä ja ei-pelattavien palkintojen piilotus** `est:30m`
  - Why: R012 — joukkuenimet vievät liikaa tilaa mobiilissa. R013 — ei-pelattavat palkinnot sekoittavat pelaajaa.
  - Files: `daily.html`
  - Do: 1) Lisää TEAMS-objektiin `abbr`-kenttä jokaiselle joukkueelle (3-kirjaiminen lyhenne = objektin avain, esim. EDM, TOR, BOS). 2) Lisää `abbr`-kenttä NATS-objektiin (paikallinen nimi = nykyinen name). 3) Lisää `abbr`-kenttä AWARDS-objektiin (lyhytnimi, esim. "Hart Trophy"). 4) Kategorioiden buildCategoryPool(): käytä `abbr`-kenttää `name`-kentän rinnalla — aseta `cat.abbr = info.abbr || info.name`. 5) Korvaa `cat.name` käyttö `cat.abbr`:lla kaikissa renderöintipaikoissa: grid-headerit (renderGrid, 2 paikkaa), guess-panelin listaelementit (renderGuessList), status-viestit (makeGuess, 2 paikkaa), ratkaisu-grid (buildSolutionGrid, 2 paikkaa). 6) Guess-panelin haku (renderGuessList filter) pitää hakea SEKÄ `cat.name`:sta ETTÄ `cat.abbr`:sta — pelaaja voi hakea "COL" tai "Colorado". 7) Määritä PLAYABLE_AWARDS-setti: `new Set(Object.keys(AWARDS))`. 8) Muokkaa formatPlayerHint(): filtteröi `p.a.filter(k => PLAYABLE_AWARDS.has(k))` ennen renderöintiä. 9) Jos filtteröidyn listan pituus on 0, älä näytä palkinto-riviä ollenkaan. 10) Tarkista ettei mikään muu paikka daily.html:ssä näytä raakaa `p.a`-dataa ilman filtteröintiä.
  - Verify: Avaa daily.html selaimessa → joukkuekategoriat näkyvät lyhenteinä, haku "Colorado" löytää COL:n, pelaajalla jolla on LadyByng → palkinto ei näy vihjeessä
  - Done when: Kaikki joukkuenimet ovat lyhenteinä kaikissa näkymissä. Vain pelattavat palkinnot näkyvät vihjeissä. Haku toimii sekä lyhenteellä että täydellä nimellä.

## Files Likely Touched

- `test-grid-gen.js` (uusi)
- `daily.html`
- `players.js` (luetaan, EI muokata)
