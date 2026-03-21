---
id: S05
milestone: M001
status: done
outcome: success
tasks_completed: 3
tasks_total: 3
requirements_validated: [R006, R010, R011]
verification_result: passed
completed_at: 2026-03-21
---

# S05: Bugikorjaukset ja lokalisaatio (FI/EN)

**Korjattu ristinollan steal-bugi ja online-yhteyden timing-ongelma, rakennettu lokalisaatiojärjestelmä (lang.js) ja lokalisoitu molemmat pelimuodot suomeksi ja englanniksi.**

## What This Slice Delivered

### Bug Fixes (T01)

**Steal-bugi (R010):** Online-modessa host ei tiennyt guest:n steal-tilasta. Korjattu päättelemällä `G.stealMode` solun omistajuudesta `handleGuestMessage` MOVE-casessa ennen `validateAndApplyMove`-kutsua: `G.stealMode = (G.cells[data.cell].owner !== 0 && G.cells[data.cell].owner !== 2)`. Offline-pelissä bugia ei ollut.

**Online-yhteys (R011):** Korvattu epäluotettava 500ms `setTimeout` READY-handshakella. Guest lähettää `{type:'READY'}` kun data channel avautuu, host odottaa READY:ä ennen `startOnlineRound()`. 15s fallback timeout varmistaa pelin alkavan vaikka READY katoaisi.

### Lokalisaatiojärjestelmä (T02 + T03)

**lang.js (R006):** Uusi tiedosto — lokalisaation ydin. STRINGS.fi ja STRINGS.en sanakirjat (~120 avainta yhteensä), `t(key, ...args)` funktio `{0}`/`{1}` parametrisubstituutiolla, `getCurrentLang()`, `setLang(code)`, `applyLanguage()`. Oletuskieli `navigator.language` → "fi" jos alkaa "fi", muuten "en". Kielivalinta tallennetaan `localStorage('nhl-grid-lang')`. `langChanged` custom event mahdollistaa game-tiedostojen reagoinnin.

**shared.js:** Lisätty `name_en`, `abbr_en`, `group_en`, `desc_en` kenttiin NATS/AWARDS/SPECIALS/TEAMS. Uusi `catLang(info)` apufunktio palauttaa lokalisoidun version kategoriaobjektista.

**daily.html + daily-game.js:** 22+ `data-i18n` elementtiä, kielenvaihtopainike (🇬🇧/🇫🇮) headerissa. Kaikki kovakoodatut suomenkieliset merkkijonot korvattu `t()`-kutsuilla. `buildCategoryPool()` ja `getDailyDateLabel()` lokalisoitu. `langChanged`-listener päivittää kategoriapoolin ja UI:n lennossa.

**index.html + grid-game.js:** ~30 `data-i18n` elementtiä, kielenvaihtopainike settings-näkymässä. ~50 kovakoodattua merkkijonoa korvattu `t()`-kutsuilla. `catHeaderHTML()` käyttää `catLang()`:ia. `langChanged`-listener päivittää grid-otsikot ja pelaajanimet.

**verify-s05.sh:** 28-kohtainen verifiointiskripti tarkistaa lang.js:n sisällön, script-tagien järjestyksen, data-i18n-attribuutit, bugikorjaukset, suomenkielisten merkkijonojen puuttumisen JS-tiedostoista, syntaksin, ja lokalisaatiokentät.

## Key Files

| File | Role | Change |
|------|------|--------|
| `lang.js` | Lokalisaatiomoottori | **New** — STRINGS, t(), applyLanguage(), langChanged event |
| `shared.js` | Jaettu kategoriadata | Modified — name_en/abbr_en/group_en/desc_en + catLang() |
| `grid-game.js` | Ristinollan pelilogiikka | Modified — steal-korjaus, READY-handshake, ~50 t()-kutsua, langChanged listener |
| `daily-game.js` | Daily-pelin pelilogiikka | Modified — kaikki merkkijonot t()-kutsuiksi, lokalisoitu buildCategoryPool/getDailyDateLabel, langChanged listener |
| `daily.html` | Daily-pelin HTML | Modified — lang.js script tag, 22+ data-i18n, kielenvaihtopainike |
| `index.html` | Ristinollan HTML | Modified — lang.js script tag, ~30 data-i18n, kielenvaihtopainike |
| `scripts/verify-s05.sh` | Verifiointiskripti | **New** — 28 tarkistusta |

## Patterns Established

- **Lokalisaatio-pattern:** Staattinen teksti `data-i18n`, dynaaminen `t()`, kategoriadata `catLang()`. Uuden avaimen lisääminen: lisää STRINGS.fi + STRINGS.en + data-i18n tai t()-kutsu.
- **`langChanged`-event:** Game-tiedostot kuuntelevat tätä ja päivittävät dynaamiset tekstinsä. Guard: `if (G.cells && el.offsetParent !== null)` estää virheen ennen pelin alkua.
- **`[PeerJS]`-prefixi:** Kaikki PeerJS-yhteyslokit konsolissa — filtteröi DevToolsissa.
- **`[Lang]`-prefixi:** Kaikki kielenvaihtolokit konsolissa.

## Observability

- `[Lang] Initialized: fi|en` — kieli tunnistettu
- `[Lang] Language set: en|fi` — kieli vaihdettu
- `[Lang] Applied language to N elements` — DOM päivitetty
- `[Lang] Missing key: <key>` — puuttuva käännös
- `[PeerJS] Host: guest READY received` — handshake onnistui
- `[PeerJS] Host: guest READY not received in 15s` — fallback
- `getCurrentLang()` konsolissa → nykyinen kieli
- `localStorage.getItem('nhl-grid-lang')` → tallennettu kieli

## Decisions Made

- D007: Steal-tila päätellään solun omistajuudesta (ei erillistä viestikenttää)
- D008: READY-handshake 15s fallbackilla (korvaa 500ms setTimeout)
- D009: Lokalisaatio data-i18n + t() + langChanged (ei build-vaihetta, ei kirjastoja)

## Verification

```
bash scripts/verify-s05.sh → 28/28 PASS
node -c lang.js → OK
node -c shared.js → OK
node -c daily-game.js → OK
node -c grid-game.js → OK
```

Browser-testit (T02 + T03): daily.html ja index.html FI/EN, kielenvaihtopainike, localStorage-persistenssi, langChanged live-päivitys.

## What the Next Slice Should Know

**M001 on valmis.** Kaikki 5 sliceä ovat valmiita. Kaikki aktiiviset vaatimukset (R001–R006, R010–R013) on validoitu.

Seuraavaa milestonia varten:
- **Latausjärjestys:** players.js → shared.js → lang.js → [config.js] → [CDN] → game.js (K018 + K021)
- **Lokalisaatio:** Uuden käännetyn merkkijonon lisääminen: 1) lisää avain STRINGS.fi + STRINGS.en, 2) data-i18n HTML:ssä tai t() JS:ssä, 3) tarvittaessa langChanged-listener
- **Kategorialokaali:** catLang(info) shared.js:ssä — ei duplikoi sanakirjaan
- **Online-peli:** READY-handshake on paikallaan, mutta PeerJS/WebRTC korvataan Firebase-siirtymässä (R014)
- **config.js** palauttaa 404 — tarvitsee luoda Firebase-siirtymässä

## Known Issues

- Online-pelin lopullinen testaus vaatii kahden selaimen manuaalisen UAT:n
- config.js:n 404 on odotettu (Firebase-siirtymä luo sen)
- `_t(key)` fallback-funktio game-tiedostoissa DB-virheelle — lang.js ei ehkä ole ladattu silloin
