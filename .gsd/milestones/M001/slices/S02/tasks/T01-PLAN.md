---
estimated_steps: 5
estimated_files: 5
skills_used: []
---

# T01: Korjaa assembly, rebuild players-raw.json ja players.js

**Slice:** S02 — Pelaajatietokannan rebuild ja audit
**Milestone:** M001

## Description

Awards-cachen landing-sivuilla (`.player-cache/_awards/{id}.json`) on `position` ja `shootsCatches`-kentät, mutta `fetch-raw.js`:n `assembleRawData()`-funktio ei poimi niitä Phase 3 -kohdassa. Se lukee vain `awards`-kentän. Tämä korjaus lisää position/shoots-kenttien poiminnan, reassembloi players-raw.json ja rebuildaa players.js + players-full.js.

**Konteksti:**
- Projekti on `C:\Users\tatu_\OneDrive\Työpöytä\Aivot\Hockeygrid`
- Tiedostot ovat ES modules (`"type": "module"` package.json:ssa)
- Awards-cache: `.player-cache/_awards/{playerId}.json` — sisältää kentät: `awards`, `birthDate`, `position`, `shootsCatches`, `inHHOF`, `inTop100`, `fetchedAt`
- 5880 pelaajaa, kaikki cachettu
- `fetch-raw.js --assemble-only` assembloi cacheista ilman API-kutsuja
- `build-players-db.js` rakentaa players.js raakadatasta + overrides.json
- `build-players-db.js --include-extra` sisällyttää `p` (position) ja `h` (handedness) outputiin
- `build-players-db.js --audit-only` näyttää vain auditin kirjoittamatta tiedostoa
- Append-only periaate: tietoa ei koskaan poisteta, vain lisätään

## Steps

1. **Lue ja tutki `fetch-raw.js` rivit ~515-540** (Phase 3 awards assembly). Nykyinen koodi lukee `cached.awards` mutta ei `cached.position` tai `cached.shootsCatches`. Lisää position/shoots-kenttien poiminta:
   ```javascript
   // Awards-cachesta voi poimia myös bio-enrichment dataa
   if (cached.position && !rec.position) rec.position = cached.position;
   if (cached.shootsCatches && !rec.shoots) rec.shoots = cached.shootsCatches;
   if (cached.birthDate && !rec.birthDate) rec.birthDate = cached.birthDate;
   ```
   Lisää rivit heti `awardsCount++`-rivin jälkeen, Phase 3 for-loopin sisään.

2. **Aja `node fetch-raw.js --assemble-only`** ja tarkista output:
   - 5880 pelaajaa
   - Position-data löytyy: `node -e "const d=JSON.parse(require('fs').readFileSync('players-raw.json','utf8')); const wp=Object.values(d.players).filter(p=>p.position); console.log('With position:', wp.length)"`
   - Tulos pitäisi olla > 5000 (joillakin historiallisilla pelaajilla ei ehkä ole dataa)

3. **Aja `node build-players-db.js`** ja tarkista audit:
   - Ei LOST-varoituksia
   - `✅ No awards lost!` löytyy
   - Spot-check: Gretzky, Crosby, Ovechkin, Selänne, McDavid — oikeat palkinnot
   - Jos audit paljastaa ongelmia → päivitä `overrides.json` ja aja uudelleen

4. **Aja `node build-players-db.js --include-extra`** ja tarkista output:
   - Output on `players.js`-tiedosto jossa `p`- ja `h`-kentät
   - Kopioi/nimeä se `players-full.js`:ksi: nimeä ensin takaisin normaali players.js ja sitten extra players-full.js:ksi
   - HUOM: `--include-extra` kirjoittaa players.js:iin suoraan. Prosessi: 1) aja normaali build (= players.js), 2) aja --include-extra build, 3) kopioi players.js → players-full.js, 4) aja normaali build uudelleen (= puhdas players.js ilman extra-kenttiä)

5. **Tarkista lopputulos:**
   - `players.js`: 5880 pelaajaa, EI `p`/`h`-kenttiä
   - `players-full.js`: 5880 pelaajaa, kyllä `p`/`h`-kenttiä (> 5000 riveillä)
   - `players-raw.json`: position-data mukana

## Must-Haves

- [ ] `assembleRawData()` poimii position/shootsCatches awards-cachesta
- [ ] `players-raw.json` sisältää position-datan (> 5000 pelaajalla)
- [ ] `players.js` rebuilditty, audit: 0 lost players, 0 lost awards
- [ ] `players-full.js` rebuilditty --include-extra -flagilla, sisältää `p`/`h`-kentät
- [ ] Spot-check: Gretzky, Crosby, Ovechkin, Selänne, McDavid — oikeat palkinnot

## Verification

- `node fetch-raw.js --assemble-only 2>&1 | tail -5` — näyttää 5880 pelaajaa
- `node build-players-db.js --audit-only 2>&1 | grep -c "LOST"` palautttaa 0
- `node build-players-db.js --audit-only 2>&1 | grep "No awards lost"` löytyy
- `node -e "const d=JSON.parse(require('fs').readFileSync('players-raw.json','utf8')); const wp=Object.values(d.players).filter(p=>p.position); console.log(wp.length)"` — tulos > 5000
- `grep -c '"p":' players-full.js` — tulos > 5000

## Observability Impact

- Signals added/changed: `fetch-raw.js` assembly tulostaa nyt position/shoots-tilastot
- How a future agent inspects this: `node build-players-db.js --audit-only` näyttää täydellisen auditin
- Failure state exposed: audit tulostaa `⚠ PLAYERS LOST` / `⚠ AWARDS LOST` rivit joiden grep-haku kertoo ongelmista

## Inputs

- `fetch-raw.js` — assembly-funktio jota korjataan (rivit ~515-540, Phase 3 awards loop)
- `players-raw.json` — nykyinen raakadata (assembloidaan uudelleen)
- `players.js` — nykyinen pelaajatietokanta (vertailukohta auditille)
- `overrides.json` — manuaaliset korjaukset (mahdollisesti päivitetään)
- `.player-cache/_awards/` — 5880 pelaajan landing-sivudata (luetaan assemblyssa)

## Expected Output

- `fetch-raw.js` — korjattu assembly-funktio (position/shoots poiminta)
- `players-raw.json` — reassembloitu, sisältää position/shoots-data
- `players.js` — rebuilditty, auditoitu, 5880 pelaajaa
- `players-full.js` — rebuilditty --include-extra, sisältää p/h-kentät
- `overrides.json` — mahdollisesti päivitetty (jos auditissa löytyy puutteita)
