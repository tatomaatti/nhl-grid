---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T01: Luo shared.js ja config.js — jaettu data ja konfiguraatio

**Slice:** S04 — JS-erotus ja koodin siistiminen
**Milestone:** M001

## Description

Luo kaksi uutta tiedostoa: `shared.js` (jaettu kategoriadata) ja `config.js` (verkko- ja palvelinkonfiguraatio). Nämä korvaavat duplikoituneet TEAMS/NATS/AWARDS/SPECIALS-määrittelyt molemmissa HTML-tiedostoissa ja siirtävät ICE_CONFIG:n (STUN/TURN-tunnukset) omaan tiedostoonsa.

Molemmat tiedostot käyttävät globaaleja muuttujia (ei ES modules), koska selain lataa ne `<script src>` -tageilla. Tiedostojen pitää olla syntaktisesti valideja ja latautua selaimessa ilman virheitä.

## Steps

1. **Lue kategoriadata molemmista HTML-tiedostoista** ja tunnista erot:
   - daily.html: TEAMS (33 joukkuetta, `group`-kenttä), NATS (11 maata, `group`), AWARDS (10, `group`), SPECIALS (3)
   - index.html: TEAMS (25 joukkuetta, ei `group`), NATS (8, ei `group`), AWARDS (10, `desc`-kenttä, ei `group`)
   - Luo superset: kaikki joukkueet, maat, palkinnot — sisällytä `group`, `desc` ja `abbr` kaikkiin joissa ne esiintyvät

2. **Kirjoita `shared.js`** joka sisältää:
   - `const TEAMS = { ... }` — kaikki 33 NHL-joukkuetta, jokaisella: `name`, `icon`, `group`, `abbr`
   - `const NATS = { ... }` — kaikki 11 kansallisuutta, jokaisella: `name`, `icon`, `group`, `abbr`
   - `const AWARDS = { ... }` — kaikki 10 pelattavaa palkintoa, jokaisella: `name`, `icon`, `group`, `abbr`, `desc`
   - `const SPECIALS = { ... }` — 3 erityiskategoriaa (one_club, multi_cup, five_teams), jokaisella `name`, `icon`, `group`, `match` -funktio
   - `const PLAYABLE_AWARDS = new Set(Object.keys(AWARDS))` — automaattisesti synkronissa AWARDS:n kanssa (D004)
   - Huomio: daily.html käyttää `group`-kenttää `buildCategoryPool`:ssa. index.html käyttää `desc`-kenttää `generateAndShowHint`:ssä. Molemmat kentät pitää olla.

3. **Kirjoita `config.js`** joka sisältää:
   - `const ICE_CONFIG = { iceServers: [...] }` — kopioitu index.html:n riveiltä 1897-1908
   - Kommentti joka kertoo että tämä on väliaikainen ja poistuu Firebase-siirtymässä

4. **Validoi molemmat tiedostot** Node.js:llä (syntaksitarkistus):
   - `node -e "eval(require('fs').readFileSync('shared.js','utf8'))"`
   - `node -e "eval(require('fs').readFileSync('config.js','utf8'))"`

## Must-Haves

- [ ] shared.js sisältää TEAMS (33 joukkuetta), NATS (11 maata), AWARDS (10 palkintoa), SPECIALS (3), PLAYABLE_AWARDS
- [ ] Jokainen TEAMS-entry sisältää `name`, `icon`, `group`, `abbr`
- [ ] Jokainen AWARDS-entry sisältää `name`, `icon`, `group`, `abbr`, `desc`
- [ ] config.js sisältää ICE_CONFIG (iceServers: STUN + TURN)
- [ ] Molemmat tiedostot ovat syntaktisesti valideja JS:ää
- [ ] Globaalit muuttujat — ei ES module syntaksia (ei import/export)

## Verification

- `node -e "eval(require('fs').readFileSync('shared.js','utf8')); console.log(Object.keys(TEAMS).length, Object.keys(NATS).length, Object.keys(AWARDS).length)"` tulostaa `33 11 10`
- `node -e "eval(require('fs').readFileSync('config.js','utf8')); console.log(ICE_CONFIG.iceServers.length)"` tulostaa `3`
- `grep -c "group:" shared.js` ≥ 50 (teams 33 + nats 11 + awards 10 + specials 3 = 57)

## Inputs

- `daily.html` — TEAMS (33 joukkuetta + group), NATS (11 + group), AWARDS (10 + group), SPECIALS (3)
- `index.html` — TEAMS (25 joukkuetta), NATS (8), AWARDS (10 + desc), ICE_CONFIG (rivit 1897-1908)

## Expected Output

- `shared.js` — jaettu kategoriadata, globaalit muuttujat
- `config.js` — ICE_CONFIG (STUN/TURN-tunnukset)
