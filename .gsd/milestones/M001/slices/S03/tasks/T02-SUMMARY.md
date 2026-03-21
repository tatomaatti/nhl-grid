---
id: T02
parent: S03
milestone: M001
provides:
  - Joukkuenimet lyhenteinä (abbr-kenttä) kaikissa Daily Grid -näkymissä
  - PLAYABLE_AWARDS-filtteri formatPlayerHint()-funktiossa — ei-pelattavat palkinnot piilotettu
key_files:
  - daily.html
key_decisions:
  - abbr-kenttä lisätty TEAMS/NATS/AWARDS-objekteihin, SPECIALS käyttää name-kenttää sellaisenaan
  - PLAYABLE_AWARDS = new Set(Object.keys(AWARDS)) — 10 pelattavaa palkintoa, automaattisesti synkronissa AWARDS-objektin kanssa
patterns_established:
  - cat.abbr renderöinnissä, cat.name+cat.abbr haussa — kaksoishaku kattaa sekä lyhenteet että täydet nimet
observability_surfaces:
  - "grep -c PLAYABLE_AWARDS daily.html" (≥2), "grep -c cat\.abbr daily.html" (≥6)
  - Selaimessa: G.rowCats[0].abbr, G.colCats[0].abbr konsolista
  - formatPlayerHint(DB.find(p => p.n === 'Wayne Gretzky')) — tarkista filtteröinti
duration: 12m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T02: Joukkuenimet lyhenteinä ja ei-pelattavien palkintojen piilotus

**Lisätty abbr-kenttä TEAMS/NATS/AWARDS-objekteihin, korvattu cat.name → cat.abbr kaikissa renderöintipaikoissa, ja PLAYABLE_AWARDS-filtteri formatPlayerHint()-funktioon — joukkueet näkyvät lyhenteinä (EDM, COL, PHI) ja ei-pelattavat palkinnot (LadyByng, Masterton, Jennings ym.) piilotettu vihjeistä**

## What Happened

Kaksi UI-muutosta daily.html:iin:

1. **abbr-kenttä**: Lisätty TEAMS-objektiin (avain = lyhenne, esim. `abbr:"EDM"`), NATS-objektiin (`abbr:"Kanada"` = sama kuin name), AWARDS-objektiin (`abbr:"Hart Trophy"` lyhytnimenä). buildCategoryPool() propagoi `cat.abbr = info.abbr || info.name` kaikille kategoriatyypeille. SPECIALS-kategorioille `abbr = name` (ei lyhennetä).

2. **Renderöinnin päivitys**: Korvattu `cat.name` → `cat.abbr` 8 kohdassa: grid column headers (renderGrid), grid row headers, guess-panelin listaelementit (renderGuessList), status-viestit correct/wrong (makeGuess), ratkaisu-grid column/row headers (buildSolutionGrid). Guess-panelin hakuun lisätty `cat.abbr.toLowerCase().includes(query)` niin haku toimii sekä lyhenteellä ("COL") että nimellä ("Colorado").

3. **PLAYABLE_AWARDS-filtteri**: `const PLAYABLE_AWARDS = new Set(Object.keys(AWARDS))` — tasan 10 pelattavaa palkintoa (Hart, Vezina, Norris, StanleyCup, Calder, RocketRichard, ConnSmythe, ArtRoss, TedLindsay, Selke). formatPlayerHint() suodattaa `p.a.filter(k => PLAYABLE_AWARDS.has(k))` ennen renderöintiä. Jos pelaajalla on vain ei-pelattavia palkintoja, palkintoriviä ei näytetä ollenkaan.

## Verification

- **Selaimessa**: Grid header näyttää "PHI" (ei "Philadelphia Flyers") oikean arvauksen jälkeen ✅
- **Haku "Colorado"**: Löytää COL-kategorian (full name match) ✅
- **Haku "COL"**: Löytää COL-kategorian (abbreviation match) ✅
- **Wayne Gretzky hint**: Näyttää 5 pelattavaa palkintoa (ArtRoss, ConnSmythe, Hart, StanleyCup, TedLindsay), piilottaa LadyByng ja Lester Patrick Trophy ✅
- **Anders Lee hint (vain KingClancy)**: Palkintoriviä ei näytetä lainkaan ✅
- **Grid-generointi**: `node test-grid-gen.js 30` — 30/30 OK, 0 fallbackia, 0 epäonnistumisia ✅
- **players.js**: Muokkaamaton (`git diff --name-only` näyttää vain daily.html) ✅

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -c "PLAYABLE_AWARDS" daily.html` | 0 | ✅ pass (2 ≥ 2) | <1s |
| 2 | `grep -c "cat\.abbr" daily.html` | 0 | ✅ pass (8 ≥ 6) | <1s |
| 3 | `node test-grid-gen.js 30` | 0 | ✅ pass (30/30 OK) | 2.3s |
| 4 | `node test-grid-gen.js 30 2>&1 \| grep -c "FAIL"` | 1 (0 matches) | ✅ pass | 2.3s |
| 5 | Selain: joukkuekategoria "PHI" headerissa | — | ✅ pass | — |
| 6 | Selain: haku "Colorado" → COL | — | ✅ pass | — |
| 7 | Selain: haku "COL" → COL | — | ✅ pass | — |
| 8 | Selain: Gretzky hint piilottaa LadyByng | — | ✅ pass | — |

## Diagnostics

- `grep -c "PLAYABLE_AWARDS" daily.html` — varmista filtteri on paikoillaan (≥2)
- `grep -c "cat\.abbr" daily.html` — varmista kaikki renderöintipaikat käyttävät abbr:ta (≥6)
- Selaimessa: `G.rowCats[0].abbr` — tarkista abbr-kentän arvo
- Selaimessa: `formatPlayerHint(DB.find(p => p.n === 'Wayne Gretzky'))` — tarkista filtteröinti

## Deviations

None

## Known Issues

None

## Files Created/Modified

- `daily.html` — abbr-kentät TEAMS/NATS/AWARDS-objekteissa, PLAYABLE_AWARDS-vakio, cat.name→cat.abbr 8 renderöintipaikassa, formatPlayerHint-filtteri, haku cat.abbr:lla
- `.gsd/milestones/M001/slices/S03/tasks/T02-PLAN.md` — lisätty Observability Impact -osio (pre-flight fix)
