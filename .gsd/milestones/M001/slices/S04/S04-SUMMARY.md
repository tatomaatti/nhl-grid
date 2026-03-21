---
id: S04
parent: M001
milestone: M001
provides:
  - shared.js (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS — jaettu kategoriadata)
  - config.js (ICE_CONFIG — STUN/TURN-palvelinkonfiguraatio)
  - daily-game.js (Daily Grid -pelilogiikka, 1065 riviä)
  - grid-game.js (Ristinolla-pelilogiikka, 1394 riviä)
  - daily.html (muokattu, inline-JS poistettu, 644 riviä)
  - index.html (muokattu, inline-JS poistettu, 923 riviä)
  - scripts/verify-s04.sh (27-tarkistuksen verifiointiskripti)
requires:
  - slice: S01
    provides: Mobiili-UX-korjatut daily.html ja index.html
affects:
  - S05
key_files:
  - shared.js
  - config.js
  - daily-game.js
  - grid-game.js
  - daily.html
  - index.html
  - scripts/verify-s04.sh
key_decisions:
  - D005: Globaalit const-muuttujat (ei ES modules), latausjärjestys players.js → shared.js → [config.js] → [CDN] → game.js
  - D006: Superset-lähestymistapa kategoriadata — kaikki kentät (group, desc, abbr) yhdessä paikassa
patterns_established:
  - Eriytetyn JS-tiedoston DB-puuttumisen tarkistus alussa (typeof DB === 'undefined' → throw + DOM-virheilmoitus)
  - Kategoriadata shared.js:stä globaaleina, pelilogiikka ei toista niitä
  - Function constructor -pohjainen Node.js-validointi const-muuttujille
  - verify-skripti Windows Git Bash -yhteensopivana (ei grep -P, wc -l \r\n-käsittely)
observability_surfaces:
  - "bash scripts/verify-s04.sh" — 27 tarkistusta koko slicen tilasta
  - "[MobileUX]" konsolilokit eriytetyissä JS-tiedostoissa
  - "Error: players.js not loaded — DB is undefined" latausjärjestysvirheessä
drill_down_paths:
  - .gsd/milestones/M001/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S04/tasks/T03-SUMMARY.md
duration: 40m
verification_result: passed
completed_at: 2026-03-21
---

# S04: JS-erotus ja koodin siistiminen

**JavaScript eriytetty HTML-tiedostoista neljään erilliseen .js-tiedostoon. Jaettu kategoriadata yhteisessä shared.js:ssä, ICE_CONFIG config.js:ssä. HTML-tiedostot pudonneet ~2370→923 (index) ja ~1750→644 (daily) riviä.**

## What Happened

**T01** loi shared.js:n ja config.js:n. Kategoriadata (TEAMS 33 joukkuetta, NATS 11 maata, AWARDS 10 palkintoa, SPECIALS 3 erityiskategoriaa, PLAYABLE_AWARDS) koottiin superset-muodossa molemmista HTML-tiedostoista — daily.html:n group-kentät ja index.html:n desc-kentät yhdistettynä. ICE_CONFIG (3 iceServeriä: 2× STUN + 1× TURN) siirrettiin config.js:ään.

**T02** eristi daily.html:n inline-scriptin (~1140 riviä) daily-game.js:ään. Kategoriamäärittelyt poistettiin (tulevat shared.js:stä). DB-puuttumisen tarkistus lisättiin tiedoston alkuun. Script-tagien latausjärjestys: players.js (head) → shared.js → daily-game.js (ennen </body>).

**T03** eristi index.html:n inline-scriptin (~1460 riviä) grid-game.js:ään. Kategoriadata ja ICE_CONFIG poistettiin (tulevat shared.js/config.js:stä). Latausjärjestys: players.js → shared.js → config.js → peerjs CDN → grid-game.js. Luotiin scripts/verify-s04.sh (27 tarkistusta: tiedostot, rivimäärät, inline-JS:n puuttuminen, script-tagit, syntaksivalidointi, duplikaattien puuttuminen).

## Verification

- `bash scripts/verify-s04.sh` — 27/27 PASS, exit 0
- Rivimäärät: daily.html 644, index.html 923, daily-game.js 1065, grid-game.js 1394
- Selaintesti: daily.html gridi renderöityy, pelaajahaku toimii, 0 JS-virheitä
- Selaintesti: index.html lobby näkyy, offline-peli käynnistyy, gridi renderöityy, pelaajahaku toimii (Gretzky), 0 JS-virheitä
- Node.js syntaksivalidointi: kaikki 4 JS-tiedostoa parsitaan ilman virheitä

## Requirements Validated

- R005 — JS eriytetty HTML:stä erillisiin tiedostoihin. verify-s04.sh vahvistaa: ei inline-JS:ää, script src -tagit, kategoriadata shared.js:ssä, ICE_CONFIG config.js:ssä. daily.html 644 riviä (aiemmin ~1750), index.html 923 riviä (aiemmin ~2370). Vahvistettu 2026-03-21.

## Requirements Advanced

- none

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- verify-s04.sh:n inline-script tarkistus muokattu Windows Git Bash -yhteensopivaksi: grep -P (PCRE) korvattu sed-pohjaisella ratkaisulla, wc -l \r\n-ongelma huomioitu.

## Known Limitations

- shared.js:n TEAMS sisältää 33 joukkuetta (daily.html:n laajempi lista) — index.html:n ristinolla käyttää vain osaa niistä, mutta ylimääräiset eivät haittaa
- config.js sisältää ExpressTURN-tunnukset selkokielisenä — hyväksyttävää koska repo on yksityinen ja tunnukset poistuvat Firebase-siirtymässä

## Follow-ups

- S05 voi hyödyntää shared.js:n lokalisointia (TEAMS/NATS/AWARDS name-kentät ovat englanniksi)
- test-grid-gen.js sisältää kopion grid-generointilogiikasta — voisi importoida daily-game.js:stä, mutta vaatisi moduulimuunnoksen (deferred)

## Files Created/Modified

- `shared.js` — Uusi: jaettu kategoriadata (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS)
- `config.js` — Uusi: ICE_CONFIG (STUN/TURN-palvelinkonfiguraatio)
- `daily-game.js` — Uusi: Daily Grid -pelilogiikka (1065 riviä)
- `grid-game.js` — Uusi: Ristinolla-pelilogiikka (1394 riviä)
- `daily.html` — Muokattu: inline-JS poistettu, script src -tagit (~1750 → 644 riviä)
- `index.html` — Muokattu: inline-JS poistettu, script src -tagit (~2370 → 923 riviä)
- `scripts/verify-s04.sh` — Uusi: 27-tarkistuksen S04-verifiointiskripti

## Forward Intelligence

### What the next slice should know
- Kategoriadata tulee nyt shared.js:stä globaaleina (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS) — S05:n lokalisaatio voi lisätä käännökset näihin objekteihin tai erilliseen lokalisaatiotiedostoon
- Pelilogiikka on daily-game.js:ssä ja grid-game.js:ssä — bugikorjaukset (steal, online-yhteys) kohdistuvat grid-game.js:ään
- visualViewport-handler on molemmissa pelitiedostoissa — potentiaalinen yhdistämiskohde jos shared-utilityn tarve ilmenee

### What's fragile
- Script-tagien latausjärjestys on kriittinen — jos shared.js latautuu ennen players.js:ää, TEAMS on saatavilla mutta DB ei. Virhe näkyy konsolissa selkeästi (DB-tarkistus tiedoston alussa).
- test-grid-gen.js kopioi daily-game.js:n generointilogiikan — jos generointia muutetaan, testi pitää päivittää käsin

### Authoritative diagnostics
- `bash scripts/verify-s04.sh` — 27 tarkistusta koko JS-erotuksen tilasta, kattaa tiedostot, rivimäärät, inline-JS:n, script-tagit, syntaksin, duplikaatit
- Selainkonsolissa: 404 = puuttuva script-tiedosto, ReferenceError = latausjärjestysongelma, "Error: players.js not loaded" = DB puuttuu

### What assumptions changed
- Alkuperäinen arvio oli että HTML-tiedostot jäisivät alle 1000 riviä — molemmat ovat selvästi alle (644 ja 923)
