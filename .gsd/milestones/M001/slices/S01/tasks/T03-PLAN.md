---
estimated_steps: 5
estimated_files: 1
skills_used:
  - frontend-design
  - accessibility
  - core-web-vitals
---

# T03: Mobiili-UX-korjaukset index.html

**Slice:** S01 — Mobiili-UX ja duplikaatin poisto
**Milestone:** M001

## Description

Ristinollapelin (index.html) mobiili-UX tarvitsee samat peruskorjaukset kuin daily.html, plus erityiskorjauksia: settings-näkymän painikkeet ovat liian pieniä (steal-count-btns 36×36px, weight-btns 30×30px), lobby-näkymän elementit tarvitsevat tarkistuksen, ja pelaajahakukenttä (.search-input) tarvitsee visualViewport-käsittelyn.

**Nykytilanne index.html:ssä:**
- Rivi 5: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` — puuttuu `interactive-widget`
- Rivi 14: `min-height: 100vh` — pitäisi olla `100svh` fallbackilla
- Rivi 547, 585: `user-select: none` paikallisesti — hyvä
- Ei `touch-action: manipulation`, ei `overscroll-behavior: none`
- Ei `visualViewport` API -käyttöä
- `.steal-count-btns button`: `width: 36px; height: 36px;` → liian pieni (rivi 114)
- `.weight-btns button`: `width: 30px; height: 30px;` → liian pieni (rivi 139)
- `.cell`: `min-height: 88px; aspect-ratio: 1;` → OK ✓
- `.search-input`: `padding: 13px 16px; font-size: 15px;` → tarkista kokonaiskorkeus
- `.start-btn`: `padding: 16px; font-size: 16px;` → OK ✓

## Steps

1. **Viewport meta** — Muuta rivi 5:
   ```
   <meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=overlays-content">
   ```
2. **CSS body-korjaukset** — Muuta body-sääntöä:
   - `min-height: 100vh; min-height: 100svh;` (progressiivinen, vanha ensin)
   - Lisää: `overscroll-behavior: none;`
3. **Touch targets — liian pienet elementit** — Korjaa spesifisesti:
   - `.steal-count-btns button`: `width: 36px; height: 36px;` → `width: 44px; height: 44px;`
   - `.weight-btns button`: `width: 30px; height: 30px;` → `width: 44px; height: 44px;`
   - `.search-input`: lisää `min-height: 44px;` (nykyinen padding tekee ~41px → varmistetaan)
   - `.lobby-join-input`: tarkista ja lisää `min-height: 44px;` tarvittaessa
   - `.surrender-actions button`: tarkista ja korjaa tarvittaessa
   - `.btn-rematch`, `.btn-menu`: tarkista ja korjaa tarvittaessa
   - Suggestion items (`.suggestions` sisällä): lisää `min-height: 44px;`
   - Lisää yleinen sääntö: `button, input, [onclick] { touch-action: manipulation; }`
4. **visualViewport API** — Lisää JS-koodi script-osion loppuun:
   - Kuuntele `window.visualViewport.resize`
   - Kun `.search-wrap` on näkyvissä ja näppäimistö auki, siirrä hakualuetta näkyville
   - Feature detection: `if (window.visualViewport) { ... }`
   - `console.log('[MobileUX] keyboard height:', keyboardHeight)`
   - Huomioi: index.html:ssä on sekä pelinäkymän haku (.search-wrap) että lobbyn liittymiskenttä (#join-code-input) — molemmat tarvitsevat käsittelyn
5. **Ajonaikainen tarkistus** — Aja `bash scripts/verify-s01.sh` ja varmista KAIKKI tarkistukset passaavat (myös T01:n ja T02:n tarkistukset)

## Must-Haves

- [ ] Viewport meta sisältää `interactive-widget=overlays-content`
- [ ] Body CSS: `min-height: 100svh` fallbackilla
- [ ] `overscroll-behavior: none` bodyssa
- [ ] `touch-action: manipulation` kaikille interaktiivisille
- [ ] `.steal-count-btns button` ≥ 44×44px
- [ ] `.weight-btns button` ≥ 44×44px
- [ ] Kaikki interaktiiviset elementit ≥ 44px korkeita
- [ ] visualViewport API siirtää search-wrapperia näppäimistön auetessa
- [ ] `[MobileUX]` diagnostiikka-log visualViewport-handlerissa
- [ ] `bash scripts/verify-s01.sh` passaa kokonaan (mukaan lukien T01+T02 tarkistukset)

## Verification

- `bash scripts/verify-s01.sh` — KAIKKI tarkistukset passaavat (exitkoodi 0)
- Selaintestaus: avaa index.html mobile-viewportilla, tarkista settings-painikkeet, haku, lobby

## Inputs

- `index.html` — nykyinen ristinollatiedosto (2322 riviä)
- `scripts/verify-s01.sh` — T01:ssä luotu tarkistusskripti
- `daily.html` — T02:ssa päivitetty (ei muokata, mutta verify-script tarkistaa)

## Expected Output

- `index.html` — päivitetty kaikilla mobiili-UX-korjauksilla

## Observability Impact

- **New signal**: `console.log('[MobileUX]', ...)` visualViewport resize handler in index.html — logs keyboard height and active input context (search-input vs join-code-input)
- **Inspection**: DevTools Console filter `[MobileUX]` shows keyboard open/close events with pixel values
- **Failure visibility**: `bash scripts/verify-s01.sh` reports PASS/FAIL per check with expected vs actual; all index.html checks must pass after this task
- **Future agent**: grep `[MobileUX]` in index.html to find the viewport handler; check `scripts/verify-s01.sh` for the full set of automated checks
