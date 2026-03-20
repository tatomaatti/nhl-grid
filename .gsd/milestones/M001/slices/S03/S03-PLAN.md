# S03: Daily Grid -generoinnin testaus ja hionta

**Goal:** Grid-generointi on testattu monella seedillä, joukkuenimet näytetään lyhenteinä, ei-pelattavat palkinnot piilotetaan UI:sta.
**Demo:** Testiskripti generoi 30+ gridiä ja raportoi laadun. Daily-gridissä joukkuenimet ovat lyhenteinä (COL, SJS). Vihjeet näyttävät vain pelissä olevia palkintoja.

## Must-Haves

- Testiskripti joka generoi N gridiä ja raportoi tilastot
- Jokainen generoitu grid on ratkaistavissa (9 uniikkia pelaajaa, kaikki intersektiot ≥ 3)
- Kategoriajakauma: ei liikaa samaa tyyppiä
- Joukkuenimet lyhenteinä (esim. "COL" ei "Colorado Avalanche") kategoriaotsikoissa ja guess-panelissa
- Ei-pelissä-olevat palkinnot (esim. MarkMessierLeadership, JackAdams, LadyByng, Masterton, Jennings, KingClancy) eivät näy UI:ssa vihjeissä tai muualla, mutta säilyvät databasessa
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

- [ ] **T02: Joukkuenimet lyhenteinä Daily Gridissä** `est:20m`
  - Why: Täydet joukkuenimet vievät liikaa tilaa, etenkin mobiilissa
  - Files: `daily.html`
  - Do: 1) Muuta grid-headerien ja guess-panelin renderöintiä käyttämään joukkuelyhennettä (esim. "COL") täyden nimen sijaan. 2) Tooltipiin tai pienempään tekstiin voi jäädä täysi nimi. 3) Joukkue-emojeissa ja ryhmänimissä sama muutos.
  - Verify: Avaa daily.html → joukkuekategoriat näkyvät lyhenteinä
  - Done when: Joukkuenimet ovat lyhenteinä kaikissa Daily Grid -näkymissä

- [ ] **T03: Ei-pelattavien palkintojen piilotus UI:sta** `est:20m`
  - Why: Palkinnot jotka eivät ole pelissä arvattavina kategorioina sekoittavat pelaajaa
  - Files: `daily.html`
  - Do: 1) Määritä PLAYABLE_AWARDS-lista joka vastaa AWARDS-objektin avaimia (Hart, Vezina, Norris, StanleyCup, Calder, RocketRichard, ConnSmythe, ArtRoss, TedLindsay, Selke). 2) Filtteröi formatPlayerHint()-funktiossa pois palkinnot jotka eivät ole PLAYABLE_AWARDS:ssa. 3) Varmista ettei piilotettujen palkintojen nimiä näy missään UI:ssa. 4) players.js:n data EI muutu — filtteri on vain UI-tasolla.
  - Verify: Tarkista pelaaja jolla on esim. LadyByng tai Masterton → palkinto ei näy vihjeessä
  - Done when: Vain pelattavat palkinnot näkyvät UI:ssa

- [ ] **T04: Generoinnin parannukset tulosten perusteella** `est:30m`
  - Why: Testiskriptin paljastamien ongelmien korjaus
  - Files: `daily.html`
  - Do: Analysoi T01:n tulokset. Mahdolliset korjaukset: 1) TYPE_LIMITS-säätö jos kategoriajakauma on epätasainen. 2) MIN_POOL-säätö jos intersektiot ovat liian pieniä. 3) Uusien special-kategorioiden lisääminen (esim. "Pelannut 10+ kautta", "Vaihdettu kesken kauden"). 4) Varmista fallback-generointi ei koskaan aktivoidu normaaleilla seedeillä.
  - Verify: `node test-grid-gen.js 100` — 0 fallbackia, tasainen jakauma
  - Done when: Grid-generointi on laadukas ja luotettava 100+ seedillä

## Files Likely Touched

- `test-grid-gen.js` (uusi)
- `daily.html` (generoinnin parannukset)
