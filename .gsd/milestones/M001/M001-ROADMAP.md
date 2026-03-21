# M001: Koodipohjan viimeistely ja mobiili-UX

**Vision:** Pelin koodipohja on siisti, mobiiliystävällinen ja pelaajatietokanta on tuore ja auditoitu. Tämän jälkeen projekti on valmis Firebase-siirtymään ja omalle domainille.

## Success Criteria

- Daily Grid ja Ristinolla toimivat moitteettomasti mobiilissa (iOS Safari, Android Chrome)
- Duplikaattitiedostoja ei ole — nhl-grid.html ohjaa index.html:iin
- players.js on rebuildittu tuoreesta datasta, audit raportoi 0 menetettyjä pelaajia/palkintoja
- Daily Grid -generointi tuottaa laadukkaita puzzleita (testattu 30+ gridillä)
- JS-koodi on eriytetty HTML:stä erillisiin tiedostoihin
- .gitignore on kunnossa (.player-cache/ jne.)
- Peli tukee suomea ja englantia, oletus selaimen kielen mukaan
- Ristinolla: pelaaja 2:n steal-bugi korjattu
- Online-pelin ensimmäisen yhteyden timing-ongelma korjattu
- Daily Grid: joukkuenimet lyhenteinä, ei-pelattavat palkinnot piilotettu UI:sta

## Key Risks / Unknowns

- Mobiili-viewport-korjausten yhteensopivuus iOS Safari vs Android Chrome — eri selaimet käsittelevät virtual keyboardia eri tavoin
- ETL-pipeline rebuild — onko raakadata ehyt ja kattava?

## Proof Strategy

- Mobiili-UX → retire in S01 by proving visual + functional correctness selaimessa
- ETL-pipeline → retire in S02 by proving audit pass with 0 data loss

## Verification Classes

- Contract verification: build-players-db.js audit (0 lost players/awards)
- Integration verification: daily.html ja index.html toimivat selaimessa players.js:n kanssa
- Operational verification: none
- UAT / human verification: mobiili-UX käsin testattava

## Milestone Definition of Done

- Kaikki 5 sliceä on valmis
- Molemmat pelimuodot toimivat selaimessa (desktop + mobile)
- Git-repo on siisti (.gitignore, ei duplikaatteja)
- Pelaajatietokanta on tuore ja auditoitu
- Peli toimii englanniksi ja suomeksi
- Tunnetut bugit korjattu (steal, online-yhteys)

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006, R010, R011, R012, R013
- Partially covers: none
- Leaves for later: R014, R015, R016
- Orphan risks: none

## Slices

- [x] **S01: Mobiili-UX ja duplikaatin poisto** `risk:medium` `depends:[]`
  > After this: Molemmat pelimuodot ovat pelattavia mobiilissa, nhl-grid.html ohjaa index.html:iin, .gitignore on kunnossa
- [x] **S02: Pelaajatietokannan rebuild ja audit** `risk:medium` `depends:[]`
  > After this: players.js on rebuildittu tuoreesta raakadatasta, audit raportoi 0 menetettyjä pelaajia/palkintoja
- [x] **S03: Daily Grid -generoinnin testaus ja hionta** `risk:low` `depends:[S02]`
  > After this: Grid-generointi on testattu 30+ seedillä, joukkuenimet lyhenteinä, ei-pelissä-olevat palkinnot piilotettu UI:sta
- [x] **S04: JS-erotus ja koodin siistiminen** `risk:low` `depends:[S01]`
  > After this: JS on eriytetty erillisiin tiedostoihin, HTML-tiedostot ovat luettavia, koodi on jaettavissa pelimuotojen välillä
- [x] **S05: Bugikorjaukset ja lokalisaatio (FI/EN)** `risk:medium` `depends:[S04]`
  > After this: Peli tukee suomea ja englantia (oletus selaimen kielen mukaan), pelaaja 2:n steal-bugi korjattu, online-pelin ensimmäisen yhteyden katkeaminen korjattu

## Boundary Map

### S01 → S04

Produces:
- Korjatut HTML-tiedostot (daily.html, index.html) joissa mobiili-UX-korjaukset
- nhl-grid.html → redirect

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- Tuore players.js joka on auditoitu ja luotettava

Consumes:
- nothing (independent)
