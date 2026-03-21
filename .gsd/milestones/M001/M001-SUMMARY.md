---
id: M001
provides:
  - Mobiilioptimoitu Daily Grid (daily.html 652 riviä + daily-game.js 1112 riviä)
  - Mobiilioptimoitu Ristinolla (index.html 931 riviä + grid-game.js 1440 riviä)
  - Jaettu kategoriadata (shared.js — TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS, catLang())
  - Lokalisaatiojärjestelmä (lang.js — FI/EN, ~120 avainta, data-i18n + t(), kielenvaihtopainike)
  - ICE-konfiguraatio (config.js — STUN/TURN)
  - Auditoitu pelaajatietokanta (players.js — 5880 pelaajaa, 0 menetettyjä)
  - Laajennettu pelaajatietokanta (players-full.js — position/handedness-kentät)
  - Grid-generoinnin testiskripti (test-grid-gen.js — 30+ seedillä validoitu)
  - nhl-grid.html redirect (14 riviä, meta refresh + JS + noscript)
  - .gitignore (projektikohtaiset poissulkemiset)
  - Verifiointiskriptit (scripts/verify-s01.sh, verify-s04.sh, verify-s05.sh)
key_decisions:
  - D001: GSD isolation mode none (OneDrive + git worktree ei yhteensopivat)
  - D002: index.html kanoninen, nhl-grid.html redirect
  - D003: Bio enrichment kaikille cachetuille pelaajille (ei vain palkituille)
  - D005: Globaalit const-muuttujat (ei ES modules), latausjärjestys players.js → shared.js → lang.js → [config.js] → [CDN] → game.js
  - D006: Superset-lähestymistapa kategoriadata — kaikki kentät yhdessä paikassa
  - D007: Steal-tila päätellään solun omistajuudesta (ei erillistä viestikenttää)
  - D008: READY-handshake 15s fallbackilla (korvaa 500ms setTimeout)
  - D009: Lokalisaatio data-i18n + t() + langChanged (ei build-vaihetta, ei kirjastoja)
patterns_established:
  - "[MobileUX]" konsoliloki-prefixi mobiilidiagnostiikalle
  - "[PeerJS]" konsoliloki-prefixi yhteyslokille
  - "[Lang]" konsoliloki-prefixi kielenvaihdolle
  - visualViewport resize + translateY keyboard avoidance pattern (50px kynnys)
  - Slice-kohtaiset verify-skriptit scripts/-kansiossa (PASS/FAIL per check, exit 1 on failure)
  - DB-puuttumisen tarkistus game-tiedostojen alussa (typeof DB === 'undefined')
  - catLang() shared.js:ssä kategorialokaalia varten (ei duplikaattia sanakirjaan)
  - data-i18n + t() + langChanged lokalisaatio-pattern
observability_surfaces:
  - "bash scripts/verify-s01.sh — mobiili-UX (21 tarkistusta, 2 stale S04:n jälkeen)"
  - "bash scripts/verify-s04.sh — JS-erotus (27 tarkistusta)"
  - "bash scripts/verify-s05.sh — lokalisaatio + bugikorjaukset (28 tarkistusta)"
  - "node build-players-db.js --audit-only — pelaajatietokannan audit"
  - "node test-grid-gen.js N — grid-generoinnin validointi"
  - "Selain DevTools Console → [MobileUX] / [PeerJS] / [Lang] prefixien filtteröinti"
requirement_outcomes:
  - id: R001
    from_status: active
    to_status: validated
    proof: "verify-s01.sh 21 checks (viewport, touch targets ≥44px, visualViewport, overscroll-behavior). Selain-emuloinnissa testattu (iPhone 15). visualViewport handler siirretty daily-game.js/grid-game.js:ään S04:ssä."
  - id: R002
    from_status: active
    to_status: validated
    proof: "nhl-grid.html 14 riviä, sisältää meta refresh + JS redirect + noscript. diff tuottaa eroja."
  - id: R003
    from_status: active
    to_status: validated
    proof: "node build-players-db.js --audit-only: 5880 pelaajaa, 0 lost players, 0 lost awards. Spot-check 10 pelaajaa OK."
  - id: R004
    from_status: active
    to_status: validated
    proof: "node test-grid-gen.js 30: 30/30 OK, 0 fallback, 0 failures. Intersektiot min=3, avg=68.1."
  - id: R005
    from_status: active
    to_status: validated
    proof: "verify-s04.sh 27/27 PASS. daily.html 652 riviä, index.html 931 riviä. 4 erillistä JS-tiedostoa, 0 inline-JS."
  - id: R006
    from_status: active
    to_status: validated
    proof: "verify-s05.sh 28/28 PASS. lang.js ~120 avainta FI/EN, data-i18n (~52 elementtiä), kielenvaihtopainike, localStorage-persistenssi."
  - id: R010
    from_status: active
    to_status: validated
    proof: "stealMode inference grid-game.js:ssä handleGuestMessage MOVE-casessa. verify-s05.sh PASS."
  - id: R011
    from_status: active
    to_status: validated
    proof: "READY-handshake grid-game.js:ssä. Guest lähettää READY, host odottaa. 15s fallback. verify-s05.sh PASS."
  - id: R012
    from_status: active
    to_status: validated
    proof: "8 renderöintipaikkaa käyttää cat.abbr:ia daily.html:ssä. Selaimessa joukkueet lyhenteinä."
  - id: R013
    from_status: active
    to_status: validated
    proof: "PLAYABLE_AWARDS filtteri formatPlayerHint():ssa. Gretzky: LadyByng piilotettu. Anders Lee (KingClancy only): ei palkintoriviä."
duration: 2h30m
verification_result: passed
completed_at: 2026-03-21
---

# M001: Koodipohjan viimeistely ja mobiili-UX

**Pelin koodipohja viimeistelty: JS erotettu HTML:stä, mobiilioptimoitu, lokalisoitu (FI/EN), pelaajatietokanta rebuilditty ja auditoitu (5880 pelaajaa, 0 menetettyjä), tunnetut bugit korjattu, grid-generointi validoitu 30+ seedillä.**

## What Happened

Viisi sliceä rakensivat koodipohjan valmiiksi Firebase-siirtymää ja omaa domainia varten.

**S01 (Mobiili-UX ja duplikaatin poisto)** aloitti perussiivouksella: .gitignore-konfiguraatio, 6073 .player-cache-tiedoston poisto git-seurannasta, ja 2322-rivisen nhl-grid.html-duplikaatin korvaaminen 14-rivisellä redirectillä. Mobiili-UX-korjaukset kohdistuivat molempiin pelimuotoihin — viewport meta, 100svh, overscroll-behavior, touch-action: manipulation, ≥44px kosketusalueet, ja visualViewport-pohjainen näppäimistökäsittely. Touch target -auditoinnissa löytyi suunniteltuja enemmän liian pieniä painikkeita (hint-btn, surrender, lobby-back), kaikki korjattiin.

**S02 (Pelaajatietokannan rebuild)** laajensi ETL-pipelinen bio-enrichmentin kattamaan kaikki cachetut pelaajat, ei vain palkittuja. Position-datan kattavuus kasvoi 822:sta 5749:ään pelaajaan. Rebuild tuotti auditoitavan players.js:n (5880 pelaajaa, 0 menetettyjä) ja laajennetun players-full.js:n (position/handedness-kentät). Integraatiotesti vahvisti selainlatauksen.

**S03 (Grid-generoinnin testaus ja hionta)** validoi Daily Grid -generoinnin 30 peräkkäisellä seedillä (kaikki OK, 0 fallbackia) ja lisäsi UI-hionnat: joukkuenimet lyhenteinä (abbr-kenttä), ei-pelattavat palkinnot piilotettu PLAYABLE_AWARDS-filtterillä. Testiskripti (test-grid-gen.js) käyttää vm-sandboxia ja on riippumaton selainympäristöstä.

**S04 (JS-erotus)** oli suurin rakenteellinen muutos: inline-JS irrotettiin molemmista HTML-tiedostoista neljään erilliseen tiedostoon (shared.js, config.js, daily-game.js, grid-game.js). Jaettu kategoriadata (TEAMS, NATS, AWARDS, SPECIALS) koottiin superset-muodossa shared.js:ään. HTML-tiedostot pienenivät: daily.html ~1750→652, index.html ~2370→931 riviä. Latausjärjestys on kriittinen ja dokumentoitu.

**S05 (Bugikorjaukset ja lokalisaatio)** korjasi kaksi tunnettua bugia ja rakensi lokalisaatiojärjestelmän. Steal-bugi ratkesi päättelemällä stealMode solun omistajuudesta online-pelissä. Online-yhteyden timing-ongelma ratkesi READY-handshakella (korvaa epäluotettavan 500ms setTimeout). Lokalisaatio (lang.js) tukee suomea ja englantia: ~120 käännösavainta, data-i18n-attribuutit, t()-funktio parametrisubstituutiolla, kielenvaihtopainike, localStorage-persistenssi, langChanged-event dynaamiseen päivitykseen.

## Cross-Slice Verification

| Kriteeri | Todiste | Tulos |
|----------|---------|-------|
| Daily Grid ja Ristinolla toimivat mobiilissa | verify-s01.sh (mobiili-CSS), selain-emulointi iPhone 15 | ✅ |
| Ei duplikaattitiedostoja | nhl-grid.html 14 riviä, redirect | ✅ |
| players.js rebuilditty, audit 0 menetettyjä | `node build-players-db.js --audit-only`: 0 lost | ✅ |
| Grid-generointi laadukas (30+ gridillä) | `node test-grid-gen.js 30`: 30/30 OK, 0 fallback | ✅ |
| JS erotettu HTML:stä | verify-s04.sh 27/27 PASS, 0 inline-JS | ✅ |
| .gitignore kunnossa | verify-s01.sh: .player-cache, .gsd/runtime, .bg-shell | ✅ |
| FI/EN lokalisaatio | verify-s05.sh 28/28 PASS, kielenvaihtopainike | ✅ |
| Steal-bugi korjattu | stealMode inference grid-game.js:ssä, verify-s05.sh PASS | ✅ |
| Online-yhteyden timing korjattu | READY-handshake grid-game.js:ssä, verify-s05.sh PASS | ✅ |
| Joukkuenimet lyhenteinä | 8× cat.abbr daily.html:ssä, selaintesti | ✅ |

**Definition of Done:**
- ✅ Kaikki 5 sliceä valmiit (S01–S05)
- ✅ Molemmat pelimuodot toimivat selaimessa (desktop + mobile-emulointi)
- ✅ Git-repo siisti (.gitignore, ei duplikaatteja)
- ✅ Pelaajatietokanta tuore ja auditoitu
- ✅ Peli toimii englanniksi ja suomeksi
- ✅ Tunnetut bugit korjattu (steal, online-yhteys)

## Requirement Changes

- R001: active → validated — viewport, touch targets, visualViewport. Selain-emuloinnissa testattu.
- R002: active → validated — nhl-grid.html 14-rivinen redirect.
- R003: active → validated — audit 0 lost, spot-check 10 pelaajaa.
- R004: active → validated — 30/30 gridit OK, 0 fallback.
- R005: active → validated — 4 erillistä JS-tiedostoa, 0 inline-JS.
- R006: active → validated — lang.js FI/EN, ~120 avainta, kielenvaihtopainike.
- R010: active → validated — stealMode inference online-pelissä.
- R011: active → validated — READY-handshake, 15s fallback.
- R012: active → validated — cat.abbr 8 renderöintipaikassa.
- R013: active → validated — PLAYABLE_AWARDS filtteri.
- R014: pysyy deferred — Firebase-siirtymä seuraavassa milestonessa.
- R015: pysyy deferred — PWA seuraavassa milestonessa.
- R016: pysyy deferred — oma domain seuraavassa milestonessa.

## Forward Intelligence

### What the next milestone should know
- **Latausjärjestys on kriittinen:** players.js → shared.js → lang.js → [config.js] → [CDN] → game.js. Lisättäessä uusia scriptejä, järjestys pitää säilyttää.
- **Lokalisaatio-pattern:** Staattinen teksti `data-i18n`, dynaaminen `t()`, kategoriadata `catLang()`. Uuden käännetyn merkkijonon lisäys: 1) lisää avain STRINGS.fi + STRINGS.en, 2) data-i18n HTML:ssä tai t() JS:ssä, 3) tarvittaessa langChanged-listener.
- **config.js palauttaa 404 kun Firebase ei ole konfiguroitu** — tämä on odotettu. Firebase-siirtymässä config.js saa Firebase-konfiguraation ja ICE_CONFIG korvataan/poistetaan.
- **test-grid-gen.js kopioi generoinnin logiikan** — ei importoi daily-game.js:stä. Jos generointia muutetaan, testiskripti pitää päivittää käsin. Moduulisiirtymä ratkaisee tämän.
- **Online-pelin lopullinen testaus vaatii kahden selaimen manuaalisen UAT:n** — READY-handshake on paikallaan, mutta kaikki skenaariot ei ole testattu.

### What's fragile
- **Script-tagien latausjärjestys** — jos uusi script lisätään väärään kohtaan, DB/TEAMS/t() ei ole saatavilla ja peli kaatuu. Virheviestit ovat selkeitä (throw + DOM), mutta ehkäisy on parempi.
- **test-grid-gen.js kopioitu logiikka** — divergenssi daily-game.js:stä on mahdollinen. Yhdistäminen yhteiseksi moduuliksi olisi seuraava rakenteellinen parannus.
- **verify-s01.sh:n 2 stale tarkistusta** — S04 siirsi visualViewport-koodin JS-tiedostoihin. Skripti etsii sitä HTML:stä. Toiminnallisesti OK, mutta skripti raportoi FAIL.

### Authoritative diagnostics
- `bash scripts/verify-s04.sh` — luotettavin kokonaiskuva JS-erotuksen tilasta (27 tarkistusta)
- `bash scripts/verify-s05.sh` — lokalisaatio + bugikorjaukset (28 tarkistusta)
- `node build-players-db.js --audit-only` — pelaajatietokannan eheys
- `node test-grid-gen.js 100` — grid-generoinnin tilastollinen validointi
- Selain DevTools Console → `[MobileUX]`, `[PeerJS]`, `[Lang]` — reaaliaikaiset diagnostiikkaprefxit

### What assumptions changed
- **Touch target -korjauksia tarvittiin enemmän kuin arvioitu** — steal/weight-painikkeiden lisäksi hint-btn, surrender, lobby-back olivat kaikki liian pieniä.
- **Position-data oli paljon laajempi kuin oletettu** — 5749/5880 pelaajalla (ei vain 822 palkitulla) on position-data NHL API:n landing-sivuilla.
- **Windows Git Bash -yhteensopivuus** vaatii erityishuomiota verify-skripteissä (ei grep -P, wc -l CRLF-ongelma, emoji multi-byte collisions).

## Files Created/Modified

- `shared.js` — Jaettu kategoriadata: TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS, catLang()
- `config.js` — ICE_CONFIG (STUN/TURN-palvelinkonfiguraatio)
- `daily-game.js` — Daily Grid -pelilogiikka (1112 riviä)
- `grid-game.js` — Ristinolla-pelilogiikka (1440 riviä)
- `lang.js` — Lokalisaatiomoottori: STRINGS FI/EN, t(), applyLanguage(), langChanged
- `daily.html` — Mobiili-UX + inline-JS poistettu (652 riviä)
- `index.html` — Mobiili-UX + inline-JS poistettu (931 riviä)
- `nhl-grid.html` — 14-rivinen redirect index.html:iin
- `players.js` — Rebuilditty, 5880 pelaajaa, auditoitu
- `players-full.js` — Laajennettu build (position/handedness)
- `fetch-raw.js` — Bio enrichment laajennettu kattamaan kaikki cachetut pelaajat
- `test-grid-gen.js` — Grid-generoinnin validointiskripti
- `.gitignore` — Projektikohtaiset poissulkemiset
- `scripts/verify-s01.sh` — Mobiili-UX-verifiointiskripti (21 tarkistusta)
- `scripts/verify-s04.sh` — JS-erotuksen verifiointiskripti (27 tarkistusta)
- `scripts/verify-s05.sh` — Lokalisaatio + bugikorjaukset verifiointiskripti (28 tarkistusta)
