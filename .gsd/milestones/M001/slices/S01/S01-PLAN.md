# S01: Mobiili-UX ja duplikaatin poisto

**Goal:** Molemmat pelimuodot toimivat mobiilissa, duplikaattitiedosto on korvattu redirectillä, .gitignore on kunnossa.
**Demo:** Avaa daily.html ja index.html mobiiliselaimessa — virtuaalinäppäimistö ei riko layoutia, kosketusalueet ovat riittävän suuria, nhl-grid.html ohjaa index.html:iin.

## Must-Haves

- Viewport meta: `interactive-widget=overlays-content` molemmissa pelitiedostoissa
- CSS: `min-height: 100svh` (fallback `100vh`), `touch-action: manipulation` interaktiivisille, `overscroll-behavior: none` bodylle
- Min touch target: 44×44px kaikille interaktiivisille elementeille (huom: index.html steal-count-btns 36×36 → 44×44, weight-btns 30×30 → 44×44)
- `visualViewport` API: siirtää hakukenttää/guess-panelia kun iOS Safari -näppäimistö aukeaa
- nhl-grid.html → yksinkertainen redirect index.html:iin (meta refresh + JS fallback)
- .gitignore: `.player-cache/`, `node_modules/`, `.gsd/runtime/`, `.gsd/activity/`, `.gsd/worktrees/`, `.gsd/gsd.db*`, `.gsd/auto.lock`
- .player-cache poistettu git-seurannasta

## Proof Level

- This slice proves: integration (HTML-tiedostot toimivat selaimessa mobiili-viewportilla)
- Real runtime required: yes (selaintestaus)
- Human/UAT required: yes (iOS Safari + Android Chrome lopullinen vahvistus)

## Verification

- `bash scripts/verify-s01.sh` — tarkistaa:
  - .gitignore sisältää vaaditut rivit
  - .player-cache ei ole git-seurannassa (`git ls-files .player-cache/ | wc -l` = 0)
  - nhl-grid.html sisältää redirect-metatagit, ei ole >50 riviä
  - daily.html sisältää `interactive-widget=overlays-content`, `100svh`, `touch-action`, `overscroll-behavior`, `visualViewport`
  - index.html sisältää samat mobile-korjaukset
  - Kaikki interaktiiviset elementit ≥ 44px (grep-tarkistus CSS-arvoille)
- Failure-path check: `scripts/verify-s01.sh` raportoi selkeästi mikä tarkistus epäonnistui ja millä rivillä

## Observability / Diagnostics

- Runtime signals: `console.log('[MobileUX]', ...)` visualViewport-handlerissa — auttaa diagnosoimaan iOS/Android-eroja
- Inspection surfaces: Selain DevTools → Console-filtteri `[MobileUX]`; verify-s01.sh tarkistusraportti
- Failure visibility: verify-s01.sh tulostaa PASS/FAIL per tarkistus, epäonnistuneille näyttää odotetun vs todellisen arvon
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `players.js` (ladataan `<script src>`), nykyiset HTML-tiedostot
- New wiring introduced in this slice: nhl-grid.html redirect → index.html, visualViewport event listener molemmissa pelitiedostoissa
- What remains before the milestone is truly usable end-to-end: S02 (players.js rebuild), S03 (grid quality), S04 (JS-erotus), S05 (bugit + lokalisaatio)

## Tasks

- [x] **T01: Repo-siistiminen: .gitignore, .player-cache ja nhl-grid.html redirect** `est:20m`
  - Why: .player-cache (6073 tiedostoa) on git-seurannassa turhaan, nhl-grid.html on identtinen duplikaatti index.html:stä (D002), .gitignore puuttuu projektikohtaiset poissulkemiset
  - Files: `.gitignore`, `nhl-grid.html`, `scripts/verify-s01.sh`
  - Do: 1) Lisää .gitignore:en projektikohtaiset rivit. 2) `git rm -r --cached .player-cache/` poistaa seurannan. 3) Korvaa nhl-grid.html redirect-sivulla (meta refresh + JS). 4) Luo scripts/verify-s01.sh joka tarkistaa kaikki slicen must-have-ehdot.
  - Verify: `bash scripts/verify-s01.sh` — .gitignore ja redirect -tarkistukset läpäisevät
  - Done when: .gitignore commitoitu, .player-cache pois seurannasta, nhl-grid.html on redirect, verify-script olemassa

- [x] **T02: Mobiili-UX-korjaukset daily.html** `est:30m`
  - Why: R001 — virtuaalinäppäimistö rikkoo layoutin mobiilissa, kosketusalueet liian pieniä
  - Files: `daily.html`
  - Do: 1) Viewport meta: `interactive-widget=overlays-content`. 2) CSS body: `min-height: 100svh` (fallback 100vh), `overscroll-behavior: none`. 3) `touch-action: manipulation` kaikille painikkeille ja interaktiivisille. 4) Min 44×44px kaikille klikattaville (tarkista: share-btn, practice-btn, hint-mode button, guess-item, col-header, row-header). 5) `visualViewport` API: siirrä guess-panelia kun näppäimistö aukeaa iOS Safarissa — käytä `visualViewport.resize`-eventtejä, laske näppäimistön korkeus, translateY guess-panel ylöspäin. 6) Estä zoom kaksoisnapautuksella (`touch-action: manipulation`). 7) Lisää `[MobileUX]`-prefixillä console.log visualViewport-handleriin diagnostiikkaa varten.
  - Verify: `bash scripts/verify-s01.sh` — daily.html-tarkistukset läpäisevät
  - Done when: daily.html sisältää kaikki mobile-korjaukset, verify-script passaa

- [ ] **T03: Mobiili-UX-korjaukset index.html** `est:30m`
  - Why: R001 — ristinollapeli tarvitsee samat mobiilikorjaukset, lisäksi settings-näkymän painikkeet ovat liian pieniä (steal-count-btns 36→44px, weight-btns 30→44px)
  - Files: `index.html`
  - Do: 1) Viewport meta: `interactive-widget=overlays-content`. 2) CSS body: `min-height: 100svh` (fallback 100vh), `overscroll-behavior: none`. 3) `touch-action: manipulation` kaikille painikkeille ja interaktiivisille. 4) Min 44×44px kaikille klikattaville — erityishuomio: `.steal-count-btns button` 36→44px, `.weight-btns button` 30→44px, `.surrender-actions button`, `.btn-rematch`, `.btn-menu`. 5) `visualViewport` API: siirrä .search-wrap kun näppäimistö aukeaa. 6) Estä zoom kaksoisnapautuksella. 7) Lisää `[MobileUX]` console.log visualViewport-handleriin. 8) Tarkista lobby-näkymän elementit (join-code-input, lobby-painikkeet).
  - Verify: `bash scripts/verify-s01.sh` — index.html-tarkistukset läpäisevät
  - Done when: index.html sisältää kaikki mobile-korjaukset, koko verify-script passaa

## Files Likely Touched

- `.gitignore`
- `nhl-grid.html`
- `daily.html`
- `index.html`
- `scripts/verify-s01.sh`
