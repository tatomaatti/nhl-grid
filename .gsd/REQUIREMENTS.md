# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R006 — Peli tukee suomea ja englantia. Oletuskieli seuraa selaimen/järjestelmän kieltä (navigator.language), fallback englanti. Pelaaja voi vaihtaa kielen manuaalisesti.
- Class: primary-user-loop
- Status: active
- Description: Peli tukee suomea ja englantia. Oletuskieli seuraa selaimen/järjestelmän kieltä (navigator.language), fallback englanti. Pelaaja voi vaihtaa kielen manuaalisesti.
- Why it matters: Pelin potentiaalinen yleisö on kansainvälinen — suomenkielinen UI rajaa käyttäjäkuntaa
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Englanti vakiona ellei järjestelmä ole suomi

### R010 — Ristinollapelissä pelaaja 2:n "steals" eivät vähene käytettäessä — bugi
- Class: core-capability
- Status: active
- Description: Ristinollapelissä pelaaja 2:n "steals" eivät vähene käytettäessä — bugi
- Why it matters: Pelibalanssiongelma — pelaaja 2 saa rajattomasti varastuksia
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Bugikorjaus

### R011 — Online-ristinollassa ensimmäinen peli katkeaa lähes aina, mutta sivunpäivityksen jälkeen toimii
- Class: core-capability
- Status: active
- Description: Online-ristinollassa ensimmäinen peli katkeaa lähes aina, mutta sivunpäivityksen jälkeen toimii
- Why it matters: Ensivaikutelma online-pelistä on rikki
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Todennäköisesti PeerJS-yhteyden alustuksen timing-ongelma

## Validated

### R001 — Peli on pelattava mobiilissa ilman viewport-ongelmia, näppäimistöbugia tai liian pieniä kosketusalueita
- Class: primary-user-loop
- Status: validated
- Description: Peli on pelattava mobiilissa ilman viewport-ongelmia, näppäimistöbugia tai liian pieniä kosketusalueita
- Why it matters: Suurin osa käyttäjistä pelaa puhelimella
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: bash scripts/verify-s01.sh passaa kaikki 21 tarkistusta (viewport, touch targets ≥44px, visualViewport, overscroll-behavior, touch-action) — vahvistettu 2026-03-21. Lopullinen mobiili-UAT (iOS Safari + Android Chrome) vaaditaan erikseen.
- Notes: S01 toimitti: viewport meta interactive-widget, 100svh, overscroll-behavior: none, touch-action: manipulation, min 44px touch targets, visualViewport keyboard handler. Selain-emulointitestaus tehty (iPhone 15, 390×844). Fyysisen laitteen testaus vaaditaan UAT:ssa.

### R002 — index.html ja nhl-grid.html eivät saa olla identtiset kopiot
- Class: quality-attribute
- Status: validated
- Description: index.html ja nhl-grid.html eivät saa olla identtiset kopiot
- Why it matters: Duplikaatti aiheuttaa ylläpitovelkaa ja divergenssiriskin
- Source: inferred
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: nhl-grid.html on 14-rivinen redirect-sivu (meta refresh + JS fallback + noscript). diff nhl-grid.html index.html tuottaa eroja. Vahvistettu verify-s01.sh:llä.
- Notes: Kanoninen tiedosto on index.html (D002). nhl-grid.html ohjaa sinne.

### R003 — players.js on rebuildittu tuoreesta raakadatasta, audit läpäisty (0 menetettyjä pelaajia/palkintoja)
- Class: core-capability
- Status: validated
- Description: players.js on rebuildittu tuoreesta raakadatasta, audit läpäisty (0 menetettyjä pelaajia/palkintoja)
- Why it matters: Pelin uskottavuus riippuu datan oikeellisuudesta
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: S02 T01: audit 0 lost players/awards, spot-check 5 pelaajaa (Gretzky, Crosby, Ovechkin, Selänne, McDavid). S02 T02: selaintesti daily.html + index.html, DB.length === 5880 molemmissa, pelaajahaku toimii, 0 JS-virheitä. Kaikki 10 verifikaatiota läpi. Vahvistettu 2026-03-21.
- Notes: ETL-pipeline valmis, players.js rebuilditty, players-full.js sisältää position/handedness. 131 pelaajaa ilman position-dataa (historialliset).

### R004 — Jokainen generoitu Daily Grid on ratkaistavissa, monipuolinen ja taktisesti kiinnostava
- Class: primary-user-loop
- Status: validated
- Description: Jokainen generoitu Daily Grid on ratkaistavissa, monipuolinen ja taktisesti kiinnostava
- Why it matters: Pelikokemus on suoraan sidottu puzzlejen laatuun
- Source: inferred
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: `node test-grid-gen.js 30` — 30/30 OK, 0 fallback, 0 failures, exit code 0. Kategoriajakauma: team 65.6%, nat 18.3%, award 10.0%, special 6.1%. Intersektio-koot: min=3, avg=68.1, max=532. Vahvistettu 2026-03-21.
- Notes: Grid-generaattorin validointi ja testaus

### R005 — JS on eroteltu HTML:stä erillisiin tiedostoihin, koodissa ei ole kovakoodattuja tunnuksia
- Class: quality-attribute
- Status: validated
- Description: JS on eroteltu HTML:stä erillisiin tiedostoihin, koodissa ei ole kovakoodattuja tunnuksia
- Why it matters: 2300+ rivin single-file HTML on ylläpidon rajalla
- Source: inferred
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: JS eriytetty HTML:stä 4 erilliseen tiedostoon: shared.js (kategoriadata), config.js (ICE_CONFIG), daily-game.js (1065 riviä), grid-game.js (1394 riviä). daily.html 644 riviä (aiemmin ~1750), index.html 923 riviä (aiemmin ~2370). verify-s04.sh 27/27 PASS. Ei inline-JS:ää, ei duplikaatteja. ICE_CONFIG config.js:ssä. Selaintesti: 0 JS-virheitä, pelit toimivat identtisesti. Vahvistettu 2026-03-21.
- Notes: JS eriytetään, ExpressTURN-tunnukset siirretään config.js:ään

### R012 — Joukkueiden nimet näytetään lyhenteinä (COL, SJS) täysien nimien sijaan kategoriaotsikoissa
- Class: primary-user-loop
- Status: validated
- Description: Joukkueiden nimet näytetään lyhenteinä (COL, SJS) täysien nimien sijaan kategoriaotsikoissa
- Why it matters: Täydet nimet vievät liikaa tilaa etenkin mobiilissa
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: `grep -c "cat\.abbr" daily.html` = 8 (≥6). abbr-kenttä lisätty TEAMS/NATS/AWARDS-objekteihin, 8 renderöintipaikkaa käyttää cat.abbr:ia. Selaimessa joukkuekategoriat näkyvät lyhenteinä (PHI, COL, EDM). Haku toimii sekä lyhenteellä ("COL") että nimellä ("Colorado"). Vahvistettu 2026-03-21.
- Notes: Vaikuttaa grid-renderöintiin ja guess-paneliin

### R013 — Pelaajien palkinnot jotka eivät ole pelissä kategorioina (esim. MarkMessierLeadershipAward) eivät näy vihjeissä eikä UI:ssa, mutta säilytetään databasessa
- Class: primary-user-loop
- Status: validated
- Description: Pelaajien palkinnot jotka eivät ole pelissä kategorioina (esim. MarkMessierLeadershipAward) eivät näy vihjeissä eikä UI:ssa, mutta säilytetään databasessa
- Why it matters: Ylimääräiset palkinnot sekoittavat pelaajaa — ne eivät ole arvattavissa
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: `grep -c "PLAYABLE_AWARDS" daily.html` = 2 (≥2). PLAYABLE_AWARDS = new Set(Object.keys(AWARDS)) — 10 pelattavaa palkintoa. formatPlayerHint() filtteröi p.a:n PLAYABLE_AWARDS:lla. Gretzky: LadyByng piilotettu, 5 pelattavaa näkyy. Anders Lee (vain KingClancy): palkintoriviä ei näytetä. players.js muokkaamaton. Vahvistettu 2026-03-21.
- Notes: Filtteröinti UI-tasolla, ei datan poistoa

## Deferred

### R014 — Ristinolla siirretään PeerJS:stä Firebase Realtime Databaseen
- Class: core-capability
- Status: deferred
- Description: Ristinolla siirretään PeerJS:stä Firebase Realtime Databaseen
- Why it matters: PeerJS/WebRTC ei toimi kaikissa verkkoympäristöissä
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Vaatii Firebase-projektin luonnin (käyttäjätoimenpide)

### R015 — Peli on asennettavissa puhelimen kotinäytölle (manifest.json + service worker)
- Class: launchability
- Status: deferred
- Description: Peli on asennettavissa puhelimen kotinäytölle (manifest.json + service worker)
- Why it matters: Natiivi-ilme ilman osoitepalkkia, offline-Daily
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Odottaa mobiilikorjausten valmistumista

### R016 — Peli siirretään omalle domainille, GitHub-repo yksityiseksi
- Class: launchability
- Status: deferred
- Description: Peli siirretään omalle domainille, GitHub-repo yksityiseksi
- Why it matters: Brändäys ja ammattimainen vaikutelma
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Vaatii domainin ostamisen (käyttäjätoimenpide)

## Out of Scope

### R017 — AdSense-integraatio, rewarded ads, Ko-fi
- Class: differentiator
- Status: out-of-scope
- Description: AdSense-integraatio, rewarded ads, Ko-fi
- Why it matters: Selkeyttää M001:n rajauksen — ei monetisointia tässä vaiheessa
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Myöhempi milestone

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | primary-user-loop | validated | M001/S01 | none | bash scripts/verify-s01.sh passaa kaikki 21 tarkistusta (viewport, touch targets ≥44px, visualViewport, overscroll-behavior, touch-action) — vahvistettu 2026-03-21. Lopullinen mobiili-UAT (iOS Safari + Android Chrome) vaaditaan erikseen. |
| R002 | quality-attribute | validated | M001/S01 | none | nhl-grid.html on 14-rivinen redirect-sivu (meta refresh + JS fallback + noscript). diff nhl-grid.html index.html tuottaa eroja. Vahvistettu verify-s01.sh:llä. |
| R003 | core-capability | validated | M001/S02 | none | S02 T01: audit 0 lost players/awards, spot-check 5 pelaajaa (Gretzky, Crosby, Ovechkin, Selänne, McDavid). S02 T02: selaintesti daily.html + index.html, DB.length === 5880 molemmissa, pelaajahaku toimii, 0 JS-virheitä. Kaikki 10 verifikaatiota läpi. Vahvistettu 2026-03-21. |
| R004 | primary-user-loop | validated | M001/S03 | none | `node test-grid-gen.js 30` — 30/30 OK, 0 fallback, 0 failures, exit code 0. Kategoriajakauma: team 65.6%, nat 18.3%, award 10.0%, special 6.1%. Intersektio-koot: min=3, avg=68.1, max=532. Vahvistettu 2026-03-21. |
| R005 | quality-attribute | validated | M001/S04 | none | JS eriytetty HTML:stä 4 erilliseen tiedostoon: shared.js (kategoriadata), config.js (ICE_CONFIG), daily-game.js (1065 riviä), grid-game.js (1394 riviä). daily.html 644 riviä (aiemmin ~1750), index.html 923 riviä (aiemmin ~2370). verify-s04.sh 27/27 PASS. Ei inline-JS:ää, ei duplikaatteja. ICE_CONFIG config.js:ssä. Selaintesti: 0 JS-virheitä, pelit toimivat identtisesti. Vahvistettu 2026-03-21. |
| R006 | primary-user-loop | active | M001/S05 | none | unmapped |
| R010 | core-capability | active | M001/S05 | none | unmapped |
| R011 | core-capability | active | M001/S05 | none | unmapped |
| R012 | primary-user-loop | validated | M001/S03 | none | `grep -c "cat\.abbr" daily.html` = 8 (≥6). abbr-kenttä lisätty TEAMS/NATS/AWARDS-objekteihin, 8 renderöintipaikkaa käyttää cat.abbr:ia. Selaimessa joukkuekategoriat näkyvät lyhenteinä (PHI, COL, EDM). Haku toimii sekä lyhenteellä ("COL") että nimellä ("Colorado"). Vahvistettu 2026-03-21. |
| R013 | primary-user-loop | validated | M001/S03 | none | `grep -c "PLAYABLE_AWARDS" daily.html` = 2 (≥2). PLAYABLE_AWARDS = new Set(Object.keys(AWARDS)) — 10 pelattavaa palkintoa. formatPlayerHint() filtteröi p.a:n PLAYABLE_AWARDS:lla. Gretzky: LadyByng piilotettu, 5 pelattavaa näkyy. Anders Lee (vain KingClancy): palkintoriviä ei näytetä. players.js muokkaamaton. Vahvistettu 2026-03-21. |
| R014 | core-capability | deferred | none | none | unmapped |
| R015 | launchability | deferred | none | none | unmapped |
| R016 | launchability | deferred | none | none | unmapped |
| R017 | differentiator | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 3
- Mapped to slices: 3
- Validated: 7 (R001, R002, R003, R004, R005, R012, R013)
- Unmapped active requirements: 0
