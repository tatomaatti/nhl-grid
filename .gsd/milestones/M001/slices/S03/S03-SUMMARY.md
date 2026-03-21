---
id: S03
parent: M001
milestone: M001
provides:
  - test-grid-gen.js — Node.js-testiskripti joka generoi ja validoi Daily Grid -puzzleja (30+ seedillä, 0 fallbackia)
  - Joukkuenimet lyhenteinä (abbr-kenttä) kaikissa Daily Grid -näkymissä
  - PLAYABLE_AWARDS-filtteri formatPlayerHint()-funktiossa — ei-pelattavat palkinnot piilotettu vihjeistä
requires:
  - slice: S02
    provides: players.js (5880 pelaajaa, auditoitu)
affects:
  - S04
key_files:
  - test-grid-gen.js
  - daily.html
key_decisions:
  - ESM-moduuli (import/export) test-grid-gen.js:ssä koska package.json "type": "module"
  - PLAYABLE_AWARDS = new Set(Object.keys(AWARDS)) — automaattisesti synkronissa AWARDS-objektin kanssa
  - cat.abbr renderöinnissä, cat.name+cat.abbr haussa — kaksoishaku kattaa sekä lyhenteet että täydet nimet
patterns_established:
  - Grid-generoinnin extraktointi daily.html:stä Node.js-testiskriptiin vm-sandboxilla
  - abbr-kenttä kategorioissa renderöintiin, name-kenttä haussa
observability_surfaces:
  - "node test-grid-gen.js N" — per-grid yhteenveto + kokonaistilastot
  - "node test-grid-gen.js 1 --verbose" — yksittäisen gridin täydellinen rakenne
  - FAIL-rivit stderriin seedillä ja syyllä, exit code 1 epäonnistuessa
  - Selaimessa: G.rowCats[0].abbr, formatPlayerHint(DB.find(p => p.n === 'Wayne Gretzky'))
drill_down_paths:
  - .gsd/milestones/M001/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S03/tasks/T02-SUMMARY.md
duration: 27m
verification_result: passed
completed_at: 2026-03-21
---

# S03: Daily Grid -generoinnin testaus ja hionta

**Grid-generaattori testattu 30+ seedillä (30/30 OK, 0 fallbackia), joukkuenimet lyhenteinä kaikissa näkymissä, ei-pelattavat palkinnot piilotettu vihjeistä PLAYABLE_AWARDS-filtterillä**

## What Happened

Kaksi tehtävää, molemmat suoraviivaisia:

**T01** loi `test-grid-gen.js`-testiskriptin, joka kopioi daily.html:n grid-generointilogiikan (PRNG, kategoriat, buildCategoryPool, backtrack-filler, validointi) ja ajaa sen Node.js:ssä vm-sandboxissa. Skripti generoi N gridiä peräkkäisillä sedeillä epoch-päivästä (2026-03-15) eteenpäin. Jokainen grid validoidaan: 9 uniikkia pelaajaa, kaikki intersektiot ≥ MIN_POOL (3), ei fallback-käyttöä. Tulos: 30/30 OK, kategoriajakauma team 65.6% / nat 18.3% / award 10.0% / special 6.1%, intersektiot min=3, avg=68.1, max=532.

**T02** lisäsi `abbr`-kentän TEAMS/NATS/AWARDS-objekteihin daily.html:ssä ja korvasi `cat.name` → `cat.abbr` kaikissa 8 renderöintipaikassa (grid-headerit, guess-paneli, status-viestit, ratkaisu-grid). Haku toimii sekä lyhenteellä ("COL") että nimellä ("Colorado"). Lisäksi `PLAYABLE_AWARDS = new Set(Object.keys(AWARDS))` filtteröi formatPlayerHint()-funktiossa ei-pelattavat palkinnot pois vihjeistä. Jos pelaajalla on vain ei-pelattavia palkintoja, palkintoriviä ei näytetä.

## Verification

| # | Tarkistus | Tulos |
|---|-----------|-------|
| 1 | `node test-grid-gen.js 30` — 30/30 OK, 0 fallbackia | ✅ pass |
| 2 | `node test-grid-gen.js 30 2>&1 \| grep -c "FAIL"` — 0 matches | ✅ pass |
| 3 | `grep -c "PLAYABLE_AWARDS" daily.html` = 2 (≥2) | ✅ pass |
| 4 | `grep -c "cat\.abbr" daily.html` = 8 (≥6) | ✅ pass |
| 5 | Selain: joukkuekategoriat lyhenteinä (PHI, COL, EDM) | ✅ pass |
| 6 | Selain: haku "Colorado" → COL, haku "COL" → COL | ✅ pass |
| 7 | Selain: Gretzky hint piilottaa LadyByng, näyttää 5 pelattavaa | ✅ pass |
| 8 | Selain: Anders Lee (vain KingClancy) — ei palkintoriviä | ✅ pass |
| 9 | players.js muokkaamaton | ✅ pass |

## New Requirements Surfaced

- none

## Deviations

- T01: ESM-muotoilu (import/export) CJS:n sijaan koska package.json `"type": "module"` — toiminnallisesti identtinen, ei vaikuta tuloksiin.

## Known Limitations

- test-grid-gen.js kopioi generoinnin logiikan daily.html:stä — ei importoi sitä. Jos daily.html:n generointia muutetaan, testiskripti pitää päivittää manuaalisesti. S04:n JS-erotuksessa nämä yhdistetään yhteiseksi moduuliksi.
- abbr-muutokset koskevat vain daily.html:ää. Ristinollassa (index.html) kategoriat näytetään edelleen täydellä nimellä — tämä on tarkoituksellista koska ristinollassa on enemmän tilaa.

## Follow-ups

- S04 (JS-erotus): grid-generointilogiikan extraktointi yhteiseksi moduuliksi tekee test-grid-gen.js:n ylläpidon helpommaksi — ei tarvitse kopioida funktiota.

## Files Created/Modified

- `test-grid-gen.js` — uusi testiskripti, generoi ja validoi N Daily Grid -puzzlea peräkkäisillä sedeillä
- `daily.html` — abbr-kentät TEAMS/NATS/AWARDS-objekteissa, PLAYABLE_AWARDS-vakio, cat.name→cat.abbr 8 renderöintipaikassa, formatPlayerHint-filtteri, haku cat.abbr:lla

## Forward Intelligence

### What the next slice should know
- daily.html sisältää nyt `abbr`-kentän TEAMS/NATS/AWARDS-objekteissa. S04:n JS-erotuksessa nämä siirtyvät sellaisenaan — kenttien nimet ja semantiikka on vakaa.
- test-grid-gen.js kopioi generoinnin logiikan literaalisti. Kun S04 erottaa JS:n, testiskripti voi importoida moduulin suoraan sen sijaan — merkittävä ylläpitoparannus.
- PLAYABLE_AWARDS on sidottu `Object.keys(AWARDS)`:iin, joten uuden pelattavan palkinnon lisääminen AWARDS-objektiin aktivoi sen automaattisesti filtterissä.

### What's fragile
- test-grid-gen.js:n generoinnin kopio — jos daily.html:n generointia muutetaan, testi ei huomaa eroa. S04:ssä tämä korjautuu kun logiikka on yhteisessä moduulissa.
- players.js:n lataus vm-sandboxissa vaatii `const DB` → `var DB` -korvauksen — rikkoutuu jos muuttuja nimetään uudelleen.

### Authoritative diagnostics
- `node test-grid-gen.js 1 --verbose` — luotettavin tapa nähdä yksittäisen gridin täydellinen rakenne (kategoriat, pelaajat, intersektio-koot)
- `node test-grid-gen.js 100` — laaja tilastollinen validointi generoinnin muutosten jälkeen
- Selaimessa: `formatPlayerHint(DB.find(p => p.n === 'Wayne Gretzky'))` — nopea palkintofiltteröinnin tarkistus

### What assumptions changed
- Alkuperäinen oletus oli että testi vaatisi CJS-muodon — ESM osoittautui vaatimukseksi package.json "type": "module" vuoksi. Pieni asia, mutta huomionarvoinen tulevissa Node.js-skripteissä.
