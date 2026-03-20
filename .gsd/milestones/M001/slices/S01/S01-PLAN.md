# S01: Mobiili-UX ja duplikaatin poisto

**Goal:** Molemmat pelimuodot toimivat mobiilissa, duplikaattitiedosto on korvattu redirectillä, .gitignore on kunnossa.
**Demo:** Avaa daily.html ja index.html mobiiliselaimessa — virtuaalinäppäimistö ei riko layoutia, kosketusalueet ovat riittävän suuria, nhl-grid.html ohjaa index.html:iin.

## Must-Haves

- Viewport meta: `interactive-widget=overlays-content`
- CSS: `100svh`, `touch-action: manipulation`, `overscroll-behavior: none`, `user-select: none`
- Min touch target: 44×44px kaikille interaktiivisille elementeille
- `visualViewport` API -korjaus iOS Safari -näppäimistölle
- nhl-grid.html → redirect index.html:iin
- .gitignore: `.player-cache/`, `node_modules/`, `.gsd/runtime/`, `.gsd/activity/`

## Verification

- Avaa daily.html ja index.html selaimessa, viewport ei muutu virtuaalinäppäimistöllä
- `diff nhl-grid.html index.html` ei tuota tulosta (nhl-grid.html on redirect, ei kopio)
- `.gitignore` sisältää `.player-cache/`
- Kaikki interaktiiviset elementit ≥ 44×44px

## Tasks

- [ ] **T01: .gitignore ja repo-siistiminen** `est:15m`
  - Why: .player-cache (6000+ tiedostoa) ei kuulu versionhallintaan
  - Files: `.gitignore`
  - Do: Luo .gitignore joka sulkee pois `.player-cache/`, `node_modules/`, `.gsd/runtime/`, `.gsd/activity/`. Poista .player-cache git-seurannasta (`git rm -r --cached`).
  - Verify: `git status` ei näytä .player-cache -tiedostoja; `cat .gitignore` sisältää oikeat rivit
  - Done when: .gitignore on commitoitu, .player-cache ei ole seurannassa

- [ ] **T02: nhl-grid.html → redirect** `est:10m`
  - Why: index.html ja nhl-grid.html ovat identtisiä — duplikaatti pitää poistaa
  - Files: `nhl-grid.html`
  - Do: Korvaa nhl-grid.html yksinkertaisella HTML-redirectillä index.html:iin (`<meta http-equiv="refresh" content="0;url=index.html">`). Lisää myös JS-redirect varmuudeksi.
  - Verify: Avaa nhl-grid.html selaimessa → ohjaa index.html:iin
  - Done when: nhl-grid.html on lyhyt redirect-sivu, ei duplikaatti

- [ ] **T03: Mobiili-UX-korjaukset daily.html** `est:30m`
  - Why: Virtuaalinäppäimistö rikkoo layoutin mobiilissa
  - Files: `daily.html`
  - Do: 1) Lisää viewport meta: `interactive-widget=overlays-content`. 2) CSS: `min-height: 100svh`, `overscroll-behavior: none`, `touch-action: manipulation` painikkeille, `user-select: none` pelialueelle. 3) Min-koko 44×44px kaikille klikattaville. 4) `visualViewport` API: siirrä hakukenttä kun näppäimistö aukeaa (iOS Safari). 5) Estä zoom kaksoisnapautuksella.
  - Verify: Avaa daily.html selaimessa mobile-viewportilla → tarkista viewport, touch targets, keyboard behavior
  - Done when: daily.html on mobiiliystävällinen, ei viewport-bugia

- [ ] **T04: Mobiili-UX-korjaukset index.html** `est:30m`
  - Why: Sama mobiiliongelma kuin daily.html — ristinollapeli tarvitsee samat korjaukset
  - Files: `index.html`
  - Do: Samat korjaukset kuin T03, mutta index.html:n rakenteelle. Erityishuomio: peliasetukset-näkymä, hakukenttä pelaajahaussa, ristinollaruudukko.
  - Verify: Avaa index.html selaimessa mobile-viewportilla → tarkista viewport, touch targets, keyboard behavior
  - Done when: index.html on mobiiliystävällinen, ei viewport-bugia

## Files Likely Touched

- `.gitignore`
- `nhl-grid.html`
- `daily.html`
- `index.html`
