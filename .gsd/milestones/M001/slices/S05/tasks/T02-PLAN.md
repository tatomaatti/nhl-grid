---
estimated_steps: 5
estimated_files: 4
skills_used:
  - frontend-design
---

# T02: Luo lokalisaatiojärjestelmä (lang.js) ja lokalisoi daily.html + daily-game.js

**Slice:** S05 — Bugikorjaukset ja lokalisaatio (FI/EN)
**Milestone:** M001

## Description

Luodaan keskitetty lokalisaatiojärjestelmä `lang.js`:ään ja sovelletaan sitä daily-peliin. Tämä on arkkitehtuurin validointi — sama malli laajennetaan T03:ssa ristinollapeliin.

Lokalisaatioarkkitehtuuri:
- `lang.js` ladataan shared.js:n jälkeen, ennen game-tiedostoja
- `STRINGS`-objekti sisältää `fi` ja `en` -sanakirjat avain-arvo-pareina
- `t(key, ...args)` palauttaa käännöksen nykyisellä kielellä, tukee `{0}`, `{1}` -parametreja
- `getCurrentLang()` palauttaa nykyisen kielen koodin
- `setLang(code)` vaihtaa kielen ja kutsuu `applyLanguage()`
- `applyLanguage()` päivittää kaikki `[data-i18n]`-elementit DOM:sta ja lähettää `langChanged`-eventin
- Oletuskieli: `navigator.language?.startsWith('fi') ? 'fi' : 'en'`, override localStorage:sta
- Puuttuva käännösavain: palautetaan avain itse + `console.warn('[Lang] Missing key: <key>')`

Kansallisuusnimien lokalisointi: shared.js:n NATS-objektiin lisätään `name_en`-kenttä (englanniksi), `name`-kenttä pysyy suomeksi. `catInfo(key)`-funktio peli-tiedostoissa käyttää `t()`-kutsua tai kielen mukaista kenttää.

## Steps

1. **Luo `lang.js`:** Kirjoita tiedosto joka sisältää:
   - `STRINGS`-objektin fi/en-sanakirjoilla. Daily-pelin avaimet: `loading`, `daily_title`, `daily_subtitle`, `hint_mode_banner`, `hint_mode_cancel`, `progress_format`, `guess_panel_title`, `guess_search_placeholder`, `guess_panel_hint`, `nav_back`, `end_correct`, `end_lives_left`, `end_hints_used`, `share_btn`, `practice_btn`, `tomorrow_msg`, `already_played`, `already_played_sub`, `daily_status_correct`, `daily_status_wrong`, `daily_status_already`, `practice_label`, `great_job`, `try_again`, `come_back_tomorrow`, `puzzle_gen_fail`, `no_match`, `used_already`. Nämä ovat daily.html:n ja daily-game.js:n merkkijonojen avaimet.
   - `t(key, ...args)` -funktio
   - `getCurrentLang()`, `setLang(code)`, `applyLanguage()`-funktiot
   - Kielenvaihto-event: `document.dispatchEvent(new Event('langChanged'))`
   - Alustus: `DOMContentLoaded`-eventissä kutsu `applyLanguage()`

2. **Päivitä `shared.js`:** Lisää NATS-objektin jokaiseen entryyn `name_en`-kenttä (Canada, USA, Sweden, Finland, Russia, Czech Republic, Slovakia, Germany, Switzerland, Austria, Latvia). Lisää AWARDS-objektiin `desc_en`-kenttä englanninkielisillä kuvauksilla. Lisää SPECIALS-objektiin `name_en`-kenttä. Lisää TEAMS-objektiin `group_en: "Team"`. Lisää NATS-objektiin `group_en: "Nationality"`, `abbr_en`-kenttä. Lisää AWARDS-objektiin `group_en: "Award"`. **Huom:** `abbr`-kentät pysyvät englanninkielisinä (Hart Trophy, Vezina Trophy jne.) koska ne ovat virallisia NHL-nimiä.

3. **Päivitä `daily.html`:** Lisää `<script src="lang.js"></script>` shared.js:n jälkeen ja ennen daily-game.js:ää. Lisää `data-i18n`-attribuutit kaikkiin staattisiin teksti-elementteihin (loading-viesti, hint-mode-banner, progress-teksti, end-screen-labelit, share/practice-painikkeet, tomorrow-viesti, already-played-teksti, nav-linkit). Lisää kielenvaihtopainike daily-headeriin (lippu-emoji: 🇫🇮/🇬🇧, onclick `setLang(getCurrentLang() === 'fi' ? 'en' : 'fi')`).

4. **Päivitä `daily-game.js`:** Korvaa kaikki kovakoodatut suomenkieliset merkkijonot `t(key)`-kutsuilla. Nämä ovat: status-viestit (oikein/väärin/käytetty), end-screen-tekstit (loistava/kokeile uudelleen/tule huomenna), puzzle-generoinnin virheviesti, kategoria-haun placeholder, harjoittelu-label.

5. **Testaa:** Varmista `node -c lang.js && node -c shared.js && node -c daily-game.js` parsitaan. Avaa daily.html selaimessa, tarkista FI-teksti näkyy oletuksena, vaihda EN:ksi painikkeella, tarkista kaikki tekstit vaihtuvat.

## Must-Haves

- [ ] lang.js sisältää STRINGS.fi ja STRINGS.en sanakirjat
- [ ] t(key, ...args) palauttaa käännöksen ja tukee parametreja
- [ ] getCurrentLang() ja setLang(code) toimivat
- [ ] applyLanguage() päivittää kaikki data-i18n-elementit
- [ ] Kielivalinta tallennetaan localStorage:en avaimella 'nhl-grid-lang'
- [ ] Puuttuva avain: palautetaan avain itse + console.warn
- [ ] shared.js:n NATS/AWARDS/SPECIALS/TEAMS sisältävät englanninkieliset kentät
- [ ] daily.html lataa lang.js:n oikeassa järjestyksessä
- [ ] daily.html:ssä on kielenvaihtopainike
- [ ] daily-game.js:ssä ei ole kovakoodattuja suomenkielisiä merkkijonoja

## Verification

- `node -c lang.js && node -c shared.js && node -c daily-game.js` — syntaksitarkistus
- `grep -q "data-i18n" daily.html` — data-i18n-attribuutit löytyvät
- `grep -q "lang.js" daily.html` — script-tagi löytyy
- `grep -q "STRINGS" lang.js` — sanakirjat löytyvät
- Selaintesti: daily.html latautuu, kieli vaihtuu painikkeella

## Inputs

- `shared.js` — kategoriadata johon lisätään englanninkieliset kentät
- `daily.html` — HTML-pohja johon lisätään data-i18n-attribuutit ja lang.js-lataus
- `daily-game.js` — pelilogiikka josta korvataan kovakoodatut merkkijonot

## Expected Output

- `lang.js` — uusi: lokalisaatiojärjestelmä FI/EN-sanakirjoilla
- `shared.js` — muokattu: englanninkieliset kentät lisätty
- `daily.html` — muokattu: data-i18n, lang.js script-tagi, kielenvaihtopainike
- `daily-game.js` — muokattu: t()-kutsut kovakoodattujen merkkijonojen tilalla
