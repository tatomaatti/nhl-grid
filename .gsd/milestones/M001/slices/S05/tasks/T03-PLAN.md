---
estimated_steps: 4
estimated_files: 3
skills_used:
  - frontend-design
---

# T03: Lokalisoi index.html + grid-game.js ja luo verifiointiskripti

**Slice:** S05 — Bugikorjaukset ja lokalisaatio (FI/EN)
**Milestone:** M001

## Description

Laajennetaan T02:ssa luotu lokalisaatiojärjestelmä ristinollapeliin. index.html sisältää merkittävästi enemmän staattisia tekstejä kuin daily.html (~40 vs ~15), ja grid-game.js sisältää ~50 dynaamista merkkijonoa. Lisäksi luodaan verifiointiskripti joka todentaa koko S05-slicen valmiuden.

Lokalisaatio käyttää T02:ssa luotua `lang.js`-infrastruktuuria: `t(key)`, `data-i18n`, `applyLanguage()`, `langChanged`-event. Uudet käännösavaimet lisätään `STRINGS`-objektiin `lang.js`:ään.

## Steps

1. **Lisää ristinollan käännösavaimet `lang.js`:ään:** Kaikki grid-game.js:n ja index.html:n merkkijonot. Avainryhmät:
   - Settings-näkymä: `settings_title`, `settings_subtitle`, `time_limit`, `settings_label`, `reuse_label`, `steal_label`, `hints_label`, `steal_count_label`, `hint_count_label`, `teams_label`, `nats_label`, `awards_label`, `weight_label`, `bestof_label`, `btn_local`, `btn_online`, `btn_daily`
   - Lobby: `waiting_opponent`, `copy_link`, `join_by_code`, `join_btn`, `back_menu`, `connecting`, `connected_starting`, `connected_waiting`, `connection_failed_nat`, `connection_failed_check`
   - Peli: `player_1`, `player_2`, `opponent`, `your_turn`, `opponent_turn`, `select_cell_first`, `search_placeholder`, `waiting`, `surrender_title`, `surrender_text`, `surrender_confirm`, `cancel`
   - Steal/hints: `steal_tag`, `steal_status`, `steal_need_different`, `hint_no_players`, `used_label`
   - Tulokset: `winner`, `you_won`, `you_lost`, `draw`, `won_round`, `lost_round`, `next_round`, `menu`, `series_won`, `series_lost`, `next_starter`, `opponent_starts`, `waiting_host`, `opponent_surrendered`, `opponent_wrong_your_turn`, `time_up_your_turn`, `time_up_switched`, `wrong_opponent_turn`
   - Virheet: `grid_gen_fail`, `player_not_found`, `player_already_used`, `wrong_guess`
   - Disconnect: `disconnected_title`, `disconnected_text`

2. **Päivitä `index.html`:** Lisää `<script src="lang.js"></script>` shared.js:n jälkeen ja ennen config.js:ää (latausjärjestys: players.js → shared.js → lang.js → config.js → peerjs CDN → grid-game.js). Lisää `data-i18n`-attribuutit kaikkiin staattisiin teksti-elementteihin: settings-näkymä (~15 elementtiä), lobby-näkymä (~6), disconnect-näkymä (~2), game-näkymä (~8), surrender-modal (~4), win-screen (~3), round-overlay (~2). Lisää kielenvaihtopainike settings-näkymään (samalla tyylillä kuin daily.html:ssa).

3. **Päivitä `grid-game.js`:** Korvaa kaikki kovakoodatut suomenkieliset merkkijonot `t(key)`-kutsuilla (~50 kohtaa). Pääryhmät:
   - `refreshUI()`: pelaajien nimet, vuoroteksti
   - `clickCell()`: steal-viesti
   - `validateAndApplyMove()`: virheviestit
   - `handleWrongGuess()`, `endTurn()`: placeholder-tekstit
   - `handleRoundEnd()`, `showRoundOverlay()`, `showSeriesEnd()`: tulostekstit
   - `createOnlineGame()`, `joinOnlineGame()`: lobby-tekstit
   - `handleHostMessage()`, `handleGuestMessage()`: online-viestit
   - `generateAndShowHint()`: "ei pelaajia" -viesti
   - Kuuntele `langChanged`-eventtiä: kutsu `refreshUI()` jos peli on käynnissä

4. **Luo `scripts/verify-s05.sh`:** Windows Git Bash -yhteensopiva verifiointiskripti (ei grep -P, huomioi \r\n). Tarkistukset:
   - lang.js olemassa ja sisältää STRINGS.fi, STRINGS.en, `function t(`
   - daily.html ja index.html sisältävät `<script src="lang.js">` oikeassa järjestyksessä
   - data-i18n-attribuutit löytyvät molemmista HTML-tiedostoista (vähintään 10 kpl kummassakin)
   - grid-game.js sisältää READY-handshake-koodin (`grep -q "READY"`)
   - grid-game.js sisältää steal-korjauksen (`grep -q "stealMode" handleGuestMessage`-kontekstissa)
   - daily-game.js ja grid-game.js eivät sisällä kovakoodattuja suomenkielisiä merkkijonoja (grep Finnish characters äöÄÖ JS-merkkijonojen sisältä, pois lukien kommentit)
   - Kaikki JS-tiedostot parsitaan: `node -c lang.js shared.js daily-game.js grid-game.js`
   - shared.js sisältää englanninkieliset kentät (`grep -q "name_en"`)

## Must-Haves

- [ ] lang.js sisältää kaikki ristinollan käännösavaimet (FI ja EN)
- [ ] index.html lataa lang.js:n oikeassa järjestyksessä (shared.js jälkeen, config.js ennen)
- [ ] index.html:n kaikki staattiset tekstit käyttävät data-i18n-attribuutteja
- [ ] grid-game.js:ssä ei ole kovakoodattuja suomenkielisiä merkkijonoja (pois lukien kommentit)
- [ ] grid-game.js kuuntelee langChanged-eventtiä
- [ ] verify-s05.sh on Windows Git Bash -yhteensopiva ja läpäisee kaikki tarkistukset
- [ ] Kielenvaihtopainike näkyy index.html:n settings-näkymässä

## Verification

- `bash scripts/verify-s05.sh` — kaikki tarkistukset PASS, exit 0
- `node -c lang.js && node -c grid-game.js` — syntaksitarkistus
- Selaintesti: index.html latautuu, kieli vaihtuu painikkeella, kaikki tekstit lokalisoituvat

## Inputs

- `lang.js` — T02:ssa luotu lokalisaatiojärjestelmä (lisätään ristinollan avaimet)
- `index.html` — HTML-pohja johon lisätään data-i18n-attribuutit ja lang.js-lataus
- `grid-game.js` — T01:ssä korjattu pelilogiikka josta korvataan kovakoodatut merkkijonot

## Expected Output

- `lang.js` — muokattu: ristinollan käännösavaimet lisätty
- `index.html` — muokattu: data-i18n, lang.js script-tagi, kielenvaihtopainike
- `grid-game.js` — muokattu: t()-kutsut kovakoodattujen merkkijonojen tilalla, langChanged-kuuntelija
- `scripts/verify-s05.sh` — uusi: koko S05-slicen verifiointiskripti
