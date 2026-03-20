---
id: T01
parent: S02
milestone: M001
provides:
  - position/shootsCatches/birthDate extraction in assembleRawData Phase 3
  - reassembled players-raw.json with bio enrichment
  - rebuilt players.js (5880 players, audit clean)
  - players-full.js with p/h fields (5750 position, 5747 handedness)
key_files:
  - fetch-raw.js
  - players-raw.json
  - players.js
  - players-full.js
key_decisions:
  - Bio enrichment extracted for ALL cached players regardless of awards (moved rec access outside awards-check block)
patterns_established:
  - Assembly phase logs enrichment counts (position, shoots, birthDate) for observability
observability_surfaces:
  - "fetch-raw.js assembly prints: Bio enrichment from landing pages: N position, N shoots, N birthDate"
  - "node build-players-db.js --audit-only shows full audit without writing files"
duration: 15m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T01: Korjaa assembly, rebuild players-raw.json ja players.js

**Lisätty position/shootsCatches/birthDate-kenttien poiminta awards-cachesta assemblyyn, reassembloitu players-raw.json (5749 pelaajalla position), rebuilditty players.js + players-full.js auditoidusti**

## What Happened

Awards-cachen landing-sivuilla (`.player-cache/_awards/{id}.json`) oli `position`, `shootsCatches` ja `birthDate` -kentät, mutta `assembleRawData()`-funktio poimi vain `awards`-arrayn. Korjasin Phase 3 -looppia niin, että `rec`-viittaus otetaan kaikille cachetuille pelaajille (ei vain niille joilla on palkintoja), ja bio-enrichment (position, shoots, birthDate) poimitaan append-only-periaatteella: vain jos kenttä on tyhjä eikä dataa ole aiemmin asetettu.

Enrichment-tulokset: 5749 position, 5746 shoots, 5699 birthDate. Assembly ja build ajoivat kolme kertaa puhtaasti (normaali build, --include-extra build, uudelleen normaali build). Audit raportoi 0 menetettyjä pelaajia ja 0 menetettyjä palkintoja kaikilla ajokerroilla.

## Verification

1. `node fetch-raw.js --assemble-only` — 5880 pelaajaa, 5749 position enriched
2. `node build-players-db.js` — audit clean, "No awards lost!", 5880 pelaajaa
3. `node build-players-db.js --include-extra` → kopio players-full.js → normaali rebuild
4. Spot-check: Gretzky (7 palkintoa, 4 joukkuetta), Crosby (7), Ovechkin (8), Selänne (4), McDavid (5) — kaikki oikein
5. Position count raw: 5749, players-full.js p-kentät: 5750, players.js EI sisällä p/h-kenttiä (vain kommentti)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node fetch-raw.js --assemble-only 2>&1 \| grep "players"` | 0 | ✅ pass (5880 players) | 9s |
| 2 | `node build-players-db.js 2>&1 \| grep -c "LOST"` | 1 | ✅ pass (0 matches = no LOST lines; grep exits 1 on 0 matches) | 3s |
| 3 | `node build-players-db.js 2>&1 \| grep "No awards lost"` | 0 | ✅ pass | 3s |
| 4 | `node -e "...filter(p=>p.position)...console.log(wp.length)"` | 0 | ✅ pass (5749 > 5000) | <1s |
| 5 | `node -e "...vm.runInNewContext...console.log(c.DB.length)"` | 0 | ✅ pass (5880) | <1s |
| 6 | `grep -c ' p:"' players-full.js` | 0 | ✅ pass (5750 > 5000) | <1s |

## Diagnostics

- `node build-players-db.js --audit-only` — täydellinen audit ilman tiedoston kirjoitusta
- `node -e "const d=JSON.parse(require('fs').readFileSync('players-raw.json','utf8'));const c=d.players['8471675'];console.log(c.position, c.shoots)"` — yksittäisen pelaajan position/shoots
- Assembly tulostaa nyt enrichment-tilastot: `Bio enrichment from landing pages: N position, N shoots, N birthDate`
- Audit tulostaa `⚠ PLAYERS LOST` / `⚠ AWARDS LOST` jos dataa häviää

## Deviations

- Slice verification käyttää `grep -c '"p":' players-full.js` mutta tuotanto-muoto on `p:"C"` (unquoted JS keys, ei JSON). Oikea grep: `grep -c ' p:"' players-full.js`. Slice V6 check tarvitsee päivityksen T02:ssa tai se tulkitaan oikein kontekstissa.
- Bio enrichment irrotettiin awards-ehdosta: `rec` poimitaan kaikille cachetuille pelaajille, ei vain niille joilla on palkintoja. Tämä kasvattaa position-datan kattavuutta merkittävästi (5749 vs. 822 jos vain awards-pelaajat).

## Known Issues

- 131 pelaajaa ilman position-dataa (5880 - 5749). Nämä ovat todennäköisesti vanhoja historiallisia pelaajia joiden landing-sivu ei palauttanut position-kenttää NHL API:sta.
- Slice verification grep `'"p":'` ei täsmää tuotantoformaattiin — T02:n selaintestin pitäisi kattaa end-to-end.

## Files Created/Modified

- `fetch-raw.js` — Phase 3 assembly laajennettu: position/shootsCatches/birthDate poiminta + enrichment-tilastot konsoliin
- `players-raw.json` — reassembloitu tuoreesta cachesta, 5880 pelaajaa, 5749 position-kenttää
- `players.js` — rebuilditty normaalilla buildilla, 5880 pelaajaa, audit puhdas
- `players-full.js` — rebuilditty --include-extra -flagilla, 5880 pelaajaa, 5750 p-kenttää, 5747 h-kenttää
