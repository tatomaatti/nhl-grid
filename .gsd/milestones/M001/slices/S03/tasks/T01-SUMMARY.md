---
id: T01
parent: S03
milestone: M001
provides:
  - test-grid-gen.js — Node.js-testiskripti joka generoi ja validoi Daily Grid -puzzleja peräkkäisillä sedeillä
key_files:
  - test-grid-gen.js
key_decisions:
  - ESM-moduuli (import/export) koska package.json sisältää "type": "module"
  - players.js ladataan vm.runInContext()-sandboxissa, const DB → var DB -korvaus
  - Seed-iterointi epoch-päivästä (2026-03-15) eteenpäin, identtinen getDailySeed-logiikka
patterns_established:
  - Grid-generoinnin extraktointi daily.html:stä Node.js-testiskriptiin vm-sandboxilla
observability_surfaces:
  - "node test-grid-gen.js N" tulostaa per-grid yhteenvedon ja kokonaistilastot
  - "node test-grid-gen.js 1 --verbose" tulostaa yksittäisen gridin täydellisen rakenteen
  - FAIL-rivit stderriin seedillä ja syyllä, exit code 1 epäonnistuessa
duration: 15m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T01: Grid-generaattorin testiskripti

**Luo test-grid-gen.js joka extrahoi daily.html:n generoinnin ja validoi 30+ gridiä: 30/30 OK, 0 fallbackia, 0 epäonnistumisia**

## What Happened

Loin `test-grid-gen.js`-skriptin joka kopioi daily.html:n grid-generointilogiikan (TEAMS, NATS, AWARDS, SPECIALS, buildCategoryPool, intersectCats, mulberry32, shuffleArray, fameScore, sortByFame, fillGridBacktrack, findMatchingCats, validatePuzzle, countValidAssignments, generateDailyGrid, generateFallbackGrid) identtisinä. Skripti lataa players.js:n vm-sandboxissa (const DB → var DB -korvaus) ja generoi N gridiä peräkkäisillä sedeillä epoch-päivästä (2026-03-15) eteenpäin.

Ainoa muutos alkuperäiseen suunnitelmaan: tiedosto käyttää ESM-importteja (import { readFileSync } from 'fs') koska package.json sisältää `"type": "module"`. CommonJS `require()` ei toiminut.

Jokainen grid validoidaan: 9 uniikkia pelaajaa, kaikki 9 intersektiota ≥ MIN_POOL (3), ei fallback-käyttöä. Tulokset: 30/30 OK, 0 fallbackia, kategoriajakauma (team 65.6%, nat 18.3%, award 10.0%, special 6.1%), intersektio-koot min=3, avg=68.1, max=532.

## Verification

- `node test-grid-gen.js 30` — exit code 0, "Generated: 30/30 OK, 0 fallbacks, 0 failures"
- `node test-grid-gen.js 30 2>&1 | grep -c "FAIL"` — palauttaa 0
- `node test-grid-gen.js 1 --verbose` — tulostaa Grid #1 täydellisen rakenteen: 6 kategoriaa, 9 pelaajaa, 9 intersektio-kokoa, validoinnin rowOptions/colOptions
- 5880 pelaajaa ladattu onnistuneesti

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node test-grid-gen.js 30` | 0 | ✅ pass | 7.0s |
| 2 | `node test-grid-gen.js 30 2>&1 \| grep -c "FAIL"` | 1 (grep: 0 matches) | ✅ pass | 7.0s |
| 3 | `node test-grid-gen.js 1 --verbose` | 0 | ✅ pass | 7.0s |

## Diagnostics

- `node test-grid-gen.js 1 --verbose` — yksittäisen gridin täydellinen rakenne diagnoosiin
- `node test-grid-gen.js 100` — laaja tilastollinen validointi
- Epäonnistuneen gridin FAIL-rivi sisältää seedin ja syyn (parsittavissa grep "FAIL" -komennolla)
- Exit code 1 jos yksikään grid epäonnistuu

## Deviations

- ESM-muotoilu (import/export) CJS:n (require) sijaan koska package.json `"type": "module"` — toiminnallisesti identtinen

## Known Issues

None

## Files Created/Modified

- `test-grid-gen.js` — uusi testiskripti, extrahoi daily.html:n generoinnin ja validoi N gridiä
- `.gsd/milestones/M001/slices/S03/S03-PLAN.md` — lisätty failure-path diagnostiikka verifiointiin
- `.gsd/milestones/M001/slices/S03/tasks/T01-PLAN.md` — lisätty Observability Impact -osio
