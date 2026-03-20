---
id: S01
parent: M001
milestone: M001
provides:
  - Mobile-optimized daily.html (viewport, touch targets ≥44px, virtual keyboard handling)
  - Mobile-optimized index.html (same fixes + undersized steal/weight buttons fixed)
  - nhl-grid.html replaced with 14-line redirect to index.html
  - .gitignore with project-specific exclusions
  - .player-cache (6073 files) removed from git tracking
  - scripts/verify-s01.sh — 21-check slice verification script
requires:
  - slice: none
    provides: none
affects:
  - S04
key_files:
  - .gitignore
  - nhl-grid.html
  - daily.html
  - index.html
  - scripts/verify-s01.sh
key_decisions:
  - visualViewport resize + translateY shift for keyboard avoidance (not scrollIntoView) — predictable across iOS/Android
  - nhl-grid.html redirect uses meta refresh + JS fallback + noscript link (triple redundancy)
  - Touch target minimum 44px enforced via explicit CSS rules, not implicit padding
  - Global touch-action manipulation rule via compound selector for all interactive elements
patterns_established:
  - "[MobileUX]" console.log prefix for mobile diagnostics — filter in DevTools Console
  - translateY keyboard avoidance pattern with 50px threshold and proportional shift
  - Slice verification script pattern — PASS/FAIL per check, exit 1 on any failure
observability_surfaces:
  - "console.log('[MobileUX]') in visualViewport handler — keyboard height, open state, focused element"
  - "bash scripts/verify-s01.sh — 21 checks covering gitignore, redirect, viewport, touch targets, visualViewport"
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md
duration: 20m
verification_result: passed
completed_at: 2026-03-21
---

# S01: Mobiili-UX ja duplikaatin poisto

**Molemmat pelimuodot (daily.html, index.html) mobiilioptimoitu: viewport, 44px kosketusalueet, virtuaalinäppäimistön käsittely. Duplikaatti nhl-grid.html korvattu redirectillä. Repo siistitty (.gitignore, .player-cache pois seurannasta).**

## What Happened

Kolme tehtävää toteutettiin suunnitelman mukaisesti:

**T01 — Repo-siistiminen.** Lisättiin .gitignore:en projektikohtaiset poissulkemiset (.player-cache/, .gsd/runtime/, .bg-shell/ jne.), poistettiin 6073 .player-cache-tiedostoa git-seurannasta `git rm -r --cached`:lla, ja korvattiin 2322-rivinen nhl-grid.html-duplikaatti 14-rivisellä redirect-sivulla (meta refresh + JS + noscript). Luotiin scripts/verify-s01.sh joka tarkistaa kaikki slicen must-have-ehdot (21 tarkistusta).

**T02 — Mobiili-UX daily.html.** Lisättiin viewport-meta `interactive-widget=overlays-content`, body CSS `min-height: 100svh` (fallback 100vh) + `overscroll-behavior: none`, globaali `touch-action: manipulation` kaikille interaktiivisille elementeille, min 44px kosketusalueet (guess-item, guess-search, hint-mode-banner button, share-btn), ja `visualViewport` API -handler joka siirtää guess-panelia translateY:llä kun näppäimistö aukeaa. Lisätty `[MobileUX]`-diagnostiikkalokit.

**T03 — Mobiili-UX index.html.** Samat korjaukset kuin T02, plus ristinolla-kohtaiset korjaukset: steal-count-painikkeet 36→44px, weight-painikkeet 30→44px, ja lisäksi min-height 44px hint-btn:lle, surrender-painikkeille ja lobby-back-btn:lle (nämä olivat 26-34px). visualViewport-handler siirtää sekä search-wrap:ia että lobby-join-section:ia.

## Verification

`bash scripts/verify-s01.sh` — kaikki 21 tarkistusta läpäisty (exit 0):
- .gitignore: 4 tarkistusta ✓
- .player-cache tracking: 1 tarkistus ✓
- nhl-grid.html redirect: 2 tarkistusta ✓
- daily.html mobile UX: 6 tarkistusta ✓
- index.html mobile UX: 6 tarkistusta ✓
- Touch targets ≥44px: 2 tarkistusta ✓

Selain-emulointitestaus tehty (iPhone 15 / 390×844, 393×659) — computed stylet vahvistettu. Lopullinen fyysisen laitteen testaus vaaditaan UAT:ssa.

## Requirements Advanced

- R001 — Mobiili-UX-korjaukset toimitettu: viewport, touch targets, visualViewport. Koodipohja on valmis, mutta fyysisen laitteen testaus vaaditaan UAT:ssa.
- R002 — Duplikaatti poistettu: nhl-grid.html on 14-rivinen redirect.

## Requirements Validated

- R001 — `bash scripts/verify-s01.sh` passaa kaikki 21 tarkistusta. Selain-emuloinnissa testattu.
- R002 — nhl-grid.html on 14 riviä, sisältää redirectin, `diff` tuottaa eroja.

## New Requirements Surfaced

- none

## Deviations

T03 lisäsi touch target -korjauksia suunnitelman ulkopuolelta: `.hint-btn` (26→44px), `.surrender-actions button` (~34→44px), ja `.lobby-back-btn` (~30→44px). Nämä olivat must-have-vaatimuksen "kaikki interaktiiviset elementit ≥ 44px" piirissä mutta eivät olleet eksplisiittisesti listattuina suunnitelmassa.

## Known Limitations

- Mobiilikorjaukset on testattu vain selain-DevTools-emuloinnissa. iOS Safari ja Android Chrome -fyysisillä laitteilla saattaa olla eroja — erityisesti visualViewport-käyttäytyminen vaihtelee.
- `user-select: none` lisätty vain daily.html:n `.daily-grid-wrap`:iin, ei index.html:n vastaavaan — ei välttämättä tarvita ristinollassa.

## Follow-ups

- none

## Files Created/Modified

- `.gitignore` — Projektikohtaiset poissulkemiset (.player-cache/, .gsd/*, .bg-shell/)
- `nhl-grid.html` — Korvattu 2322-rivinen duplikaatti 14-rivisellä redirectillä
- `daily.html` — Mobiili-UX: viewport, 100svh, overscroll, touch-action, 44px targets, visualViewport handler
- `index.html` — Mobiili-UX: samat + steal/weight/hint/surrender/lobby-back button -korjaukset
- `scripts/verify-s01.sh` — 21-tarkistuksen slicen verifiointiskripti

## Forward Intelligence

### What the next slice should know
- daily.html ja index.html ovat nyt ~1750 ja ~2370 riviä. S04 (JS-erotus) voi aloittaa suoraan — HTML-rakenne on stabiili.
- nhl-grid.html on redirect, joten S04:n ei tarvitse koskea siihen.
- scripts/-kansio on olemassa — jatko-slicet voivat lisätä omia verify-skriptejään samaan paikkaan.

### What's fragile
- visualViewport-handler molemmissa tiedostoissa on identtinen logiikka mutta copy-paste — S04:n JS-erotuksessa tämä on prime kandidaatti jaetuksi moduuliksi.
- Touch target -korjaukset ovat suoria CSS-sääntöjä. Jos S04 muuttaa luokkanimiä tai rakennetta, ne pitää tarkistaa uudelleen.

### Authoritative diagnostics
- `bash scripts/verify-s01.sh` — kattaa kaikki S01:n must-havet, luotettava regressiotesti.
- Selain DevTools Console → `[MobileUX]` — näyttää keyboard height ja panel shift reaaliaikaisesti.

### What assumptions changed
- Oletettiin että vain steal-count-btns (36px) ja weight-btns (30px) tarvitsevat korjausta index.html:ssä — todellisuudessa myös hint-btn, surrender-buttons ja lobby-back-btn olivat liian pieniä.
