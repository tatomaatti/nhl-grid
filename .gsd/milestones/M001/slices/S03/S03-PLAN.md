# S03: Daily Grid -generoinnin testaus ja hionta

**Goal:** Grid-generointi on testattu monella seedillä, kategoriajakauma on monipuolinen, edge caset on käsitelty.
**Demo:** Testiskripti generoi 30+ gridiä ja raportoi laadun: kategoriatyyppien jakauma, intersektioiden koko, ratkaisujen määrä.

## Must-Haves

- Testiskripti joka generoi N gridiä ja raportoi tilastot
- Jokainen generoitu grid on ratkaistavissa (9 uniikkia pelaajaa, kaikki intersektiot ≥ 3)
- Kategoriajakauma: ei liikaa samaa tyyppiä (esim. ei 4× joukkue 6:sta)
- Fallback-grid ei koskaan tule käyttöön (normaaligenerointi riittää)

## Verification

- `node test-grid-gen.js 30` — kaikki 30 gridiä generoituvat, 0 fallback-käyttöä
- Tilastoraportti näyttää tasaisen kategoriamixin

## Tasks

- [ ] **T01: Grid-generaattorin testiskripti** `est:30m`
  - Why: Generoinnin laatu pitää todentaa systemaattisesti, ei käsin
  - Files: `test-grid-gen.js` (uusi)
  - Do: 1) Luo Node.js-skripti joka importtaa tai uudelleentoteuttaa grid-generoinnin. 2) Generoi N gridiä (parametri, oletus 30) peräkkäisillä sedeillä. 3) Raportoi: onnistumisprosentti, fallback-käyttö, kategoriatyyppien jakauma, keskimääräinen intersektio-koko, minimi-intersektio. 4) Tulosta varoitus jos mikään grid on heikkolaatuinen.
  - Verify: `node test-grid-gen.js 30` tulostaa yhteenvedon, 0 epäonnistumista
  - Done when: Testiskripti toimii ja raportoi laadun

- [ ] **T02: Generoinnin parannukset tulosten perusteella** `est:30m`
  - Why: Testiskriptin paljastamien ongelmien korjaus
  - Files: `daily.html`
  - Do: Analysoi T01:n tulokset. Mahdolliset korjaukset: 1) TYPE_LIMITS-säätö jos kategoriajakauma on epätasainen. 2) MIN_POOL-säätö jos intersektiot ovat liian pieniä. 3) Uusien special-kategorioiden lisääminen (esim. "Pelannut 10+ kautta", "Vaihdettu kesken kauden"). 4) Varmista fallback-generointi ei koskaan aktivoidu normaaleilla seedeillä.
  - Verify: `node test-grid-gen.js 100` — 0 fallbackia, tasainen jakauma
  - Done when: Grid-generointi on laadukas ja luotettava 100+ seedillä

## Files Likely Touched

- `test-grid-gen.js` (uusi)
- `daily.html` (generoinnin parannukset)
