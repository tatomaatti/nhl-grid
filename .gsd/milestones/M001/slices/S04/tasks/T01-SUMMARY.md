---
id: T01
parent: S04
milestone: M001
provides:
  - shared.js (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS)
  - config.js (ICE_CONFIG)
key_files:
  - shared.js
  - config.js
key_decisions:
  - Superset-lähestymistapa kategoriadata — daily.html:n 33 joukkuetta + group, index.html:n desc-kentät. Molemmat kentät mukana kaikissa joissa ne esiintyvät.
  - Art Ross abbr-arvo "Art Ross Trophy" (daily.html:n versio) ei "Art Ross" (index.html:n versio) — johdonmukaisuus muiden kanssa
patterns_established:
  - Globaalit const-muuttujat (ei ES modules) — selain lataa <script src> tageilla, muuttujat saatavilla seuraavissa skripteissä
  - Function constructor -pohjainen Node.js-validointi const-muuttujille (eval ei toimi const:n kanssa)
observability_surfaces:
  - "node -e" -syntaksivalidointi Function constructorilla
  - Selainkonsolissa 404 (puuttuva tiedosto) tai ReferenceError (väärä latausjärjestys)
duration: 15m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T01: Luo shared.js ja config.js — jaettu data ja konfiguraatio

**Luotu shared.js (33 joukkuetta, 11 maata, 10 palkintoa, 3 erityiskategoriaa + PLAYABLE_AWARDS) ja config.js (ICE_CONFIG STUN/TURN) globaaleina muuttujina**

## What Happened

Luin kategoriadata molemmista HTML-tiedostoista ja tunnistin erot: daily.html:ssä 33 joukkuetta `group`-kentällä, index.html:ssä 25 joukkuetta ilman `group`:ia mutta AWARDS:ssa `desc`-kenttä. Loin superset-versiot joissa kaikki kentät (`name`, `icon`, `group`, `abbr`, ja AWARDS:ssa myös `desc`) ovat mukana.

shared.js sisältää TEAMS (33), NATS (11), AWARDS (10), SPECIALS (3) ja PLAYABLE_AWARDS (Set). config.js sisältää ICE_CONFIG:n 3 iceServerillä (2× STUN + 1× TURN). Molemmat käyttävät `const`-globaaleja ilman ES module syntaksia.

Node.js `eval()` ei vuoda `const`-muuttujia scopeen — käytin `new Function()` -konstruktoria validointiin.

## Verification

Kaikki 3 verifiointitarkistusta läpäisty:

1. `node -e` shared.js: TEAMS=33, NATS=11, AWARDS=10, SPECIALS=3, PLAYABLE_AWARDS=10 ✅
2. `node -e` config.js: ICE_CONFIG.iceServers.length=3 ✅
3. `grep -c "group:" shared.js` = 57 (≥ 50) ✅

Lisäksi tarkistin ohjelmallisesti:
- Jokainen TEAMS-entry sisältää name, icon, group, abbr ✅
- Jokainen AWARDS-entry sisältää name, icon, group, abbr, desc ✅
- Ei ES module syntaksia (import/export) kummassakaan tiedostossa ✅

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node -e "...shared.js...TEAMS/NATS/AWARDS count"` | 0 | ✅ pass | <1s |
| 2 | `node -e "...config.js...ICE_CONFIG.iceServers.length"` | 0 | ✅ pass | <1s |
| 3 | `grep -c "group:" shared.js` → 57 | 0 | ✅ pass | <1s |
| 4 | `node -e "...field completeness check"` | 0 | ✅ pass | <1s |

## Diagnostics

- **Syntaksivalidointi:** `node -e "const fn = new Function(require('fs').readFileSync('shared.js','utf8') + '; return {TEAMS,NATS,AWARDS};'); const r = fn(); console.log(Object.keys(r.TEAMS).length);"` — tulostaa 33 jos OK
- **Selaintesti:** Avaa daily.html tai index.html DevToolsilla — jos shared.js puuttuu, `ReferenceError: TEAMS is not defined` konsolissa
- **Muuttujamäärät:** TEAMS 33, NATS 11, AWARDS 10, SPECIALS 3, PLAYABLE_AWARDS 10

## Deviations

- Node.js validointimetodi muuttui: `eval()` ei toimi `const`-muuttujien kanssa (ne eivät vuoda scopeen). Käytin `new Function()` -konstruktoria sen sijaan. Selaimessa `<script src>` toimii normaalisti `const`:n kanssa.

## Known Issues

None.

## Files Created/Modified

- `shared.js` — Uusi: jaettu kategoriadata (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS)
- `config.js` — Uusi: ICE_CONFIG (STUN/TURN-palvelinkonfiguraatio)
- `.gsd/milestones/M001/slices/S04/S04-PLAN.md` — Lisätty failure-path diagnostiikkatarkistus Verification-osioon
- `.gsd/milestones/M001/slices/S04/tasks/T01-PLAN.md` — Lisätty Observability Impact -osio
