---
estimated_steps: 4
estimated_files: 1
skills_used:
  - debug-like-expert
---

# T01: Korjaa steal-bugi ja online-yhteyden timing-ongelma

**Slice:** S05 — Bugikorjaukset ja lokalisaatio (FI/EN)
**Milestone:** M001

## Description

Kaksi kriittistä bugia ristinollapelissä (grid-game.js):

**Bugi 1 — Steal-laskuri (R010):** Online-modessa kun guest (pelaaja 2) varastaa host:n (pelaaja 1) ruudun, host ei tiedä guest:n olevan steal-modessa. Host vastaanottaa guest:n MOVE-viestin `handleGuestMessage`:ssa ja kutsuu `validateAndApplyMove(data.cell, data.playerName, 2)`. Mutta `G.stealMode` on `false` hostilla koska vain guest asetti sen `clickCell`:ssä. Tämä tarkoittaa rivillä 575 `if (G.stealMode) G.stealsLeft[turn]--` EI suorita, jolloin steals ei vähene.

**Bugi 2 — Online-yhteys (R011):** Host kutsuu `startOnlineRound()` 500ms setTimeout:lla `onConnOpen`:n jälkeen. PeerJS:n `open`-event voi laueta hostilla ennen kuin guest:n data channel on valmis vastaanottamaan dataa. INIT-viesti voi kadota. Korjaus: READY-handshake — guest lähettää `{type:'READY'}` kun data channel avautuu, host odottaa sitä.

## Steps

1. **Steal-bugi (online):** `handleGuestMessage`:n `MOVE`-casessa, ennen `validateAndApplyMove`-kutsua, lisää: `G.stealMode = (G.cells[data.cell].owner !== 0 && G.cells[data.cell].owner !== 2);` — tämä päättelee steal-tilan solun omistajuudesta. Jos solu on pelaaja 1:n omistama ja guest yrittää pelata siihen, se on steal.

2. **Online-yhteys (host-puoli):** Muokkaa `createOnlineGame`:n `onConnOpen`-käsittelijää: poista `setTimeout(() => startOnlineRound(), 500)`. Lisää sen tilalle guest:n READY-viestin odotus conn.on('data') -käsittelijässä. Ensimmäinen data-viesti guestilta on READY → kutsu `startOnlineRound()`. Lisää 15s timeout vara-poluksi.

3. **Online-yhteys (guest-puoli):** Muokkaa `joinOnlineGame`:n `onGuestConnOpen`-käsittelijää: lisää `sendMsg({type:'READY'})` heti kun guest:n data channel avautuu. Tämä varmistaa hostin tietävän guest:n olevan valmis.

4. **Guest-viestien käsittely (host):** Lisää `handleGuestMessage`:iin `READY`-case. Tätä ei tarvita jos READY käsitellään suoraan `createOnlineGame`:n conn.on('data') -käsittelijässä ennen yleistä handler-siirtoa. Varmista ettei `handleGuestMessage` rikkoudu tuntemattomasta viestityypistä.

## Must-Haves

- [ ] Online-modessa guest:n steal vähentää stealsLeft-laskuria hostilla
- [ ] G.stealMode asetetaan host-puolella guest-moveissa ennen validateAndApplyMove-kutsua
- [ ] READY-handshake: guest lähettää READY, host odottaa sitä ennen pelin aloitusta
- [ ] setTimeout-pohjainen 500ms viive poistettu host:n onConnOpen:sta
- [ ] 15s timeout vara-polkuna jos READY ei saavu
- [ ] grid-game.js parsitaan ilman syntaksivirheitä

## Verification

- `node -c grid-game.js` — syntaksitarkistus
- Haku: `grep -q "G.stealMode" grid-game.js` löytää steal-korjauksen handleGuestMessage:sta
- Haku: `grep -q "READY" grid-game.js` löytää handshake-koodin
- Haku: `grep -v "setTimeout.*startOnlineRound" grid-game.js` — vanha 500ms viive poistettu

## Inputs

- `grid-game.js` — nykyinen ristinolla-pelilogiikka (1394 riviä), bugikorjausten kohde

## Expected Output

- `grid-game.js` — korjattu: steal-bugi fixattu, READY-handshake lisätty
