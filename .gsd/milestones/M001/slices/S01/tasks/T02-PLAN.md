---
estimated_steps: 5
estimated_files: 1
skills_used:
  - frontend-design
  - accessibility
  - core-web-vitals
---

# T02: Mobiili-UX-korjaukset daily.html

**Slice:** S01 — Mobiili-UX ja duplikaatin poisto
**Milestone:** M001

## Description

Daily Grid -pelin (daily.html) mobiili-UX on rikki: viewport meta ei sisällä `interactive-widget=overlays-content`, `min-height: 100vh` ei ota huomioon mobiiliselainten osoitepalkkia, virtuaalinäppäimistö voi peittää hakukentän, ja osa painikkeista on liian pieniä kosketettavaksi. Tämä taski korjaa kaikki mobiiliongelmat daily.html:ssä.

**Nykytilanne daily.html:ssä:**
- Rivi 5: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` — puuttuu `interactive-widget`
- Rivi 15: `min-height: 100vh` — pitäisi olla `100svh` fallbackilla
- Rivit 111, 150, 328: `user-select: none` on jo paikallisesti — hyvä
- Ei `touch-action: manipulation` missään
- Ei `overscroll-behavior: none` missään
- Ei `visualViewport` API -käyttöä

**Tarkistettavat interaktiiviset elementit (min 44×44px):**
- `.col-header` — min-height 64px ✓, mutta leveys riippuu gridistä
- `.row-header` — min-height 64px ✓
- `.player-cell.hintable` — min-height 56px ✓
- `.guess-item` — padding 7px 10px, font 13px → tarkista kokonaiskorkeus
- `.guess-search` — padding 8px 12px, font 14px → tarkista
- `.share-btn`, `.practice-btn` — tarkista padding/korkeus
- `.hint-mode-banner button` — padding 4px 12px → liian pieni, kasvata

## Steps

1. **Viewport meta** — Muuta rivi 5:
   ```
   <meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=overlays-content">
   ```
2. **CSS body-korjaukset** — Muuta body-sääntöä:
   - `min-height: 100svh` (lisää kommentti: `/* fallback: 100vh for older browsers */`)
   - Lisää: `overscroll-behavior: none;`
   - Lisää myös erillinen `@supports not (min-height: 100svh)` -fallback tai yksinkertaisemmin laita molemmat: `min-height: 100vh; min-height: 100svh;`
3. **Touch targets** — Käy läpi kaikki interaktiiviset elementit ja varmista min 44×44px:
   - `.guess-item`: lisää `min-height: 44px;`
   - `.guess-search`: lisää `min-height: 44px;` (nykyinen on lähellä padding 8px + font 14px ≈ 30px → liian pieni)
   - `.hint-mode-banner button`: muuta `padding: 4px 12px` → `padding: 10px 16px; min-height: 44px;`
   - `.share-btn`, `.practice-btn`: varmista min-height 44px
   - Lisää kaikkiin interaktiivisiin: `touch-action: manipulation;`
   - Lisää yleinen sääntö: `button, input, [onclick] { touch-action: manipulation; }`
4. **visualViewport API** — Lisää JS-koodi `<script>`-osion loppuun (ennen `</script>`-tagia):
   - Kuuntele `window.visualViewport.resize`-eventtiä
   - Laske näppäimistön korkeus: `window.innerHeight - visualViewport.height`
   - Jos guess-panel on auki ja näppäimistö näkyy, translateY guess-panel ylöspäin
   - Kun näppäimistö sulkeutuu, palauta alkuperäinen asema
   - Lisää `console.log('[MobileUX] keyboard height:', keyboardHeight)` diagnostiikkaa varten
   - Tarkista `window.visualViewport` olemassaolo ennen lisäystä (feature detection)
5. **`user-select: none` pelialueelle** — Lisää `.daily-grid-wrap` elementille `user-select: none;` jos ei jo ole, estää vahingossa tekstivalinnan pelatessa

## Must-Haves

- [ ] Viewport meta sisältää `interactive-widget=overlays-content`
- [ ] Body CSS: `min-height: 100svh` fallbackilla
- [ ] `overscroll-behavior: none` bodyssa
- [ ] `touch-action: manipulation` kaikille interaktiivisille
- [ ] Kaikki interaktiiviset elementit ≥ 44px korkeita
- [ ] visualViewport API siirtää guess-panelia näppäimistön auetessa (feature detection)
- [ ] `[MobileUX]` diagnostiikka-log visualViewport-handlerissa

## Verification

- `bash scripts/verify-s01.sh` — daily.html-tarkistukset passaavat
- Selaintestaus: avaa daily.html mobile-viewportilla, klikkaa hakukenttää, tarkista ettei layout hajoa

## Inputs

- `daily.html` — nykyinen Daily Grid -pelitiedosto (1724 riviä)
- `scripts/verify-s01.sh` — T01:ssä luotu tarkistusskripti (ei muokata, käytetään verifiointiin)

## Expected Output

- `daily.html` — päivitetty kaikilla mobiili-UX-korjauksilla
