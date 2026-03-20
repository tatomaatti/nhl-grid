---
estimated_steps: 4
estimated_files: 3
skills_used:
  - best-practices
---

# T01: Repo-siistiminen: .gitignore, .player-cache ja nhl-grid.html redirect

**Slice:** S01 — Mobiili-UX ja duplikaatin poisto
**Milestone:** M001

## Description

Projektin repo sisältää 6073 .player-cache-tiedostoa git-seurannassa, .gitignore puuttuu projektikohtaiset poissulkemiset, ja nhl-grid.html on identtinen kopio index.html:stä. Tämä taski siistii repon: päivittää .gitignoreen projektikohtaiset rivit, poistaa .player-cache:n seurannasta, korvaa nhl-grid.html:n yksinkertaisella redirectillä (D002-päätöksen mukaisesti), ja luo verify-scriptin koko slicen tarkistuksia varten.

## Steps

1. **Päivitä .gitignore** — Lisää olemassa olevan .gitignore:n loppuun projektikohtaiset rivit:
   ```
   # ── NHL Hockey Grid ──
   .player-cache/
   players-raw.json
   .gsd/runtime/
   .gsd/activity/
   .gsd/worktrees/
   .gsd/gsd.db
   .gsd/gsd.db-shm
   .gsd/gsd.db-wal
   .gsd/auto.lock
   .bg-shell/
   ```
2. **Poista .player-cache git-seurannasta** — `git rm -r --cached .player-cache/`. Tämä ei poista tiedostoja levyltä, vain git-indeksistä.
3. **Korvaa nhl-grid.html redirect-sivulla** — Kirjoita nhl-grid.html uudestaan: lyhyt HTML-sivu joka ohjaa index.html:iin. Käytä sekä `<meta http-equiv="refresh" content="0;url=index.html">` että JS `window.location.replace('index.html')`. Lisää `<noscript>`-linkki varmuudeksi. Koko tiedosto max 20 riviä.
4. **Luo scripts/verify-s01.sh** — Bash-skripti joka tarkistaa kaikki S01:n must-have-ehdot. Jokainen tarkistus tulostaa PASS/FAIL + selityksen. Exitkoodi 0 vain jos kaikki passaa. Tarkistukset:
   - .gitignore sisältää `.player-cache/`
   - `git ls-files .player-cache/ | wc -l` = 0
   - nhl-grid.html sisältää `url=index.html` ja on ≤50 riviä
   - daily.html sisältää `interactive-widget`, `100svh`, `touch-action`, `overscroll-behavior`, `visualViewport` (nämä failaavat kunnes T02 tehdään — se on OK)
   - index.html sisältää samat (failaavat kunnes T03 — OK)
   - Kaikki fail-viestit kertovat mitä puuttuu ja mistä tiedostosta

## Must-Haves

- [ ] .gitignore sisältää `.player-cache/`, `.gsd/runtime/`, `.gsd/activity/`, `.bg-shell/`
- [ ] .player-cache ei ole git-seurannassa (0 tracked files)
- [ ] nhl-grid.html on ≤20 riviä, sisältää redirect index.html:iin
- [ ] scripts/verify-s01.sh olemassa, ajettava, tarkistaa kaikki slicen ehdot

## Verification

- `grep -q ".player-cache/" .gitignore && echo PASS || echo FAIL`
- `test $(git ls-files .player-cache/ | wc -l) -eq 0 && echo PASS || echo FAIL`
- `test $(wc -l < nhl-grid.html) -le 50 && grep -q "url=index.html" nhl-grid.html && echo PASS || echo FAIL`
- `bash scripts/verify-s01.sh` — .gitignore- ja redirect-tarkistukset passaavat (mobile-tarkistukset voivat vielä failata)

## Observability Impact

- **verify-s01.sh**: New inspection surface — `bash scripts/verify-s01.sh` reports PASS/FAIL per check with explanatory messages. Future agents run this to see slice health at a glance.
- **.gitignore**: No runtime signal change. Prevents accidental tracking of cache/runtime files.
- **nhl-grid.html redirect**: No diagnostic signals. If redirect fails, users see a static link as fallback.
- **Failure visibility**: verify-s01.sh exit code 1 + count of failures in summary line. Each FAIL message names the file and missing token.

## Inputs

- `.gitignore` — nykyinen GSD-baseline gitignore, puuttuu projektikohtaiset rivit
- `nhl-grid.html` — identtinen kopio index.html:stä (2322 riviä), korvataan redirectillä
- `index.html` — kanoninen ristinollatiedosto (ei muokata tässä taskissa, mutta redirect osoittaa siihen)

## Expected Output

- `.gitignore` — päivitetty projektikohtaisilla poissulkemisilla
- `nhl-grid.html` — korvattu lyhyellä redirect-sivulla
- `scripts/verify-s01.sh` — uusi tarkistusskripti koko slicelle
