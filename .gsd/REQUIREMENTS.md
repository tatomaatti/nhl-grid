# Requirements

## Active

### R001 — Mobiili-UX toimii moitteettomasti
- Class: primary-user-loop
- Status: active
- Description: Peli on pelattava mobiilissa ilman viewport-ongelmia, näppäimistöbugia tai liian pieniä kosketusalueita
- Why it matters: Suurin osa käyttäjistä pelaa puhelimella
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: viewport meta, 100svh, touch-action, visualViewport API

### R002 — Ei duplikaattitiedostoja
- Class: quality-attribute
- Status: active
- Description: index.html ja nhl-grid.html eivät saa olla identtiset kopiot
- Why it matters: Duplikaatti aiheuttaa ylläpitovelkaa ja divergenssiriskin
- Source: inferred
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Toinen tiedosto pitää korvata redirectillä

### R003 — Pelaajatietokanta on ajan tasalla ja auditoitu
- Class: core-capability
- Status: active
- Description: players.js on rebuildittu tuoreesta raakadatasta, audit läpäisty (0 menetettyjä pelaajia/palkintoja)
- Why it matters: Pelin uskottavuus riippuu datan oikeellisuudesta
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: ETL-pipeline valmis, awards + cup rosters cachettu

### R004 — Daily Grid tuottaa laadukkaita puzzleita
- Class: primary-user-loop
- Status: active
- Description: Jokainen generoitu Daily Grid on ratkaistavissa, monipuolinen ja taktisesti kiinnostava
- Why it matters: Pelikokemus on suoraan sidottu puzzlejen laatuun
- Source: inferred
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Grid-generaattorin validointi ja testaus

### R005 — Koodi on ylläpidettävää
- Class: quality-attribute
- Status: active
- Description: JS on eroteltu HTML:stä erillisiin tiedostoihin, koodissa ei ole kovakoodattuja tunnuksia
- Why it matters: 2300+ rivin single-file HTML on ylläpidon rajalla
- Source: inferred
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: JS eriytetään, ExpressTURN-tunnukset siirretään config.js:ään

### R006 — Monikielisyys (FI/EN)
- Class: primary-user-loop
- Status: active
- Description: Peli tukee suomea ja englantia. Oletuskieli seuraa selaimen/järjestelmän kieltä (navigator.language), fallback englanti. Pelaaja voi vaihtaa kielen manuaalisesti.
- Why it matters: Pelin potentiaalinen yleisö on kansainvälinen — suomenkielinen UI rajaa käyttäjäkuntaa
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Englanti vakiona ellei järjestelmä ole suomi

### R010 — Ristinolla: pelaaja 2:n varastukset eivät kulu
- Class: core-capability
- Status: active
- Description: Ristinollapelissä pelaaja 2:n "steals" eivät vähene käytettäessä — bugi
- Why it matters: Pelibalanssiongelma — pelaaja 2 saa rajattomasti varastuksia
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Bugikorjaus

### R011 — Online-peli: ensimmäinen peli katkeaa
- Class: core-capability
- Status: active
- Description: Online-ristinollassa ensimmäinen peli katkeaa lähes aina, mutta sivunpäivityksen jälkeen toimii
- Why it matters: Ensivaikutelma online-pelistä on rikki
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Todennäköisesti PeerJS-yhteyden alustuksen timing-ongelma

### R012 — Daily Grid: joukkuenimet lyhenteinä
- Class: primary-user-loop
- Status: active
- Description: Joukkueiden nimet näytetään lyhenteinä (COL, SJS) täysien nimien sijaan kategoriaotsikoissa
- Why it matters: Täydet nimet vievät liikaa tilaa etenkin mobiilissa
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Vaikuttaa grid-renderöintiin ja guess-paneliin

### R013 — Ei-pelissä-olevat palkinnot piilotetaan UI:sta
- Class: primary-user-loop
- Status: active
- Description: Pelaajien palkinnot jotka eivät ole pelissä kategorioina (esim. MarkMessierLeadershipAward) eivät näy vihjeissä eikä UI:ssa, mutta säilytetään databasessa
- Why it matters: Ylimääräiset palkinnot sekoittavat pelaajaa — ne eivät ole arvattavissa
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Filtteröinti UI-tasolla, ei datan poistoa

## Deferred

### R014 — Firebase-moninpeli
- Class: core-capability
- Status: deferred
- Description: Ristinolla siirretään PeerJS:stä Firebase Realtime Databaseen
- Why it matters: PeerJS/WebRTC ei toimi kaikissa verkkoympäristöissä
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Vaatii Firebase-projektin luonnin (käyttäjätoimenpide)

### R015 — PWA-tuki
- Class: launchability
- Status: deferred
- Description: Peli on asennettavissa puhelimen kotinäytölle (manifest.json + service worker)
- Why it matters: Natiivi-ilme ilman osoitepalkkia, offline-Daily
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Odottaa mobiilikorjausten valmistumista

### R016 — Oma domain + Cloudflare Pages
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

### R017 — Monetisointi (mainokset, lahjoitukset)
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
| R001 | primary-user-loop | active | M001/S01 | none | unmapped |
| R002 | quality-attribute | active | M001/S01 | none | unmapped |
| R003 | core-capability | active | M001/S02 | none | unmapped |
| R004 | primary-user-loop | active | M001/S03 | none | unmapped |
| R005 | quality-attribute | active | M001/S04 | none | unmapped |
| R006 | primary-user-loop | active | M001/S05 | none | unmapped |
| R010 | core-capability | active | M001/S05 | none | unmapped |
| R011 | core-capability | active | M001/S05 | none | unmapped |
| R012 | primary-user-loop | active | M001/S03 | none | unmapped |
| R013 | primary-user-loop | active | M001/S03 | none | unmapped |
| R014 | core-capability | deferred | none | none | unmapped |
| R015 | launchability | deferred | none | none | unmapped |
| R016 | launchability | deferred | none | none | unmapped |
| R017 | differentiator | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 10
- Mapped to slices: 10
- Validated: 0
- Unmapped active requirements: 0
