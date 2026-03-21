# S02: Pelaajatietokannan rebuild ja audit — UAT

**Milestone:** M001
**Written:** 2026-03-21

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: ETL-pipeline tuottaa deterministic output — audit ja spot-check kattavat datan eheyden, selaintesti vahvistaa integraation. Ihmisen ei tarvitse arvioida visuaalista kokemusta.

## Preconditions

- Node.js asennettuna (v18+)
- `.player-cache/` -hakemisto olemassa awards-cachen kanssa
- `overrides.json` tiedosto olemassa

## Smoke Test

Aja `node build-players-db.js --audit-only` ja varmista: "No awards lost!" tulostuu, 5880 pelaajaa raportoitu, ei `⚠ PLAYERS LOST` tai `⚠ AWARDS LOST` rivejä.

## Test Cases

### 1. Assembly tuottaa täydellisen players-raw.json

1. Aja `node fetch-raw.js --assemble-only`
2. Tarkista tulostus: "5880 players"
3. Tarkista enrichment-rivi: "Bio enrichment from landing pages: 5749 position, 5746 shoots, 5699 birthDate"
4. **Expected:** players-raw.json kirjoitettu, 5880 pelaajaa, >5700 position-kenttää

### 2. Build tuottaa auditoitavan players.js

1. Aja `node build-players-db.js`
2. Tarkista tuloste: "No awards lost!"
3. Aja `node build-players-db.js 2>&1 | grep -c "LOST"` — tulos pitää olla 0
4. Aja `node -e "const vm=require('vm');const s=require('fs').readFileSync('players.js','utf8').replace(/^const DB/m,'var DB');const c={};vm.runInNewContext(s,c);console.log(c.DB.length)"` — tulos 5880
5. **Expected:** players.js sisältää 5880 pelaajaa, 0 menetettyjä pelaajia tai palkintoja

### 3. Spot-check avainpelaajat

1. Aja `node build-players-db.js --audit-only`
2. Tarkista tulosteesta:
   - Wayne Gretzky: 4 joukkuetta (EDM, LAK, NYR, STL), 7 palkintoa
   - Sidney Crosby: palkintoja ≥ 5
   - Alexander Ovechkin: palkintoja ≥ 5
   - Teemu Selänne: joukkueita ≥ 3
   - Connor McDavid: palkintoja ≥ 3
3. **Expected:** Kaikkien pelaajien data vastaa tunnettuja faktoja

### 4. players-full.js sisältää position/handedness -kentät

1. Aja `node build-players-db.js --include-extra`
2. Kopioi tulos: `copy players.js players-full.js` (tai build tekee sen automaattisesti)
3. Aja `grep -c ' p:"' players-full.js` — tulos > 5000
4. Aja `grep -c ' h:"' players-full.js` — tulos > 5000
5. **Expected:** players-full.js sisältää p- ja h-kentät vähintään 5700 pelaajalle

### 5. daily.html lataa rebuildityn DB:n

1. Käynnistä paikallinen palvelin: `npx http-server . -p 8080 -c-1`
2. Avaa `http://localhost:8080/daily.html`
3. Avaa selaimen konsoli (F12)
4. Kirjoita konsoliin: `DB.length`
5. **Expected:** Konsoli näyttää 5880, ei JS-virheitä

### 6. index.html lataa rebuildityn DB:n ja pelaajahaku toimii

1. Avaa `http://localhost:8080/index.html`
2. Avaa selaimen konsoli (F12)
3. Kirjoita konsoliin: `DB.length`
4. Aloita paikallinen peli (valitse aikaraja)
5. Klikkaa solua
6. Kirjoita hakukenttään "Gretzky"
7. **Expected:** DB.length === 5880, Wayne Gretzky näkyy hakutuloksissa, ei JS-virheitä

## Edge Cases

### Tyhjä override-tiedosto

1. Varmuuskopioi `overrides.json`
2. Korvaa sisältö: `{"byId":{}, "byName":{}}`
3. Aja `node build-players-db.js --audit-only`
4. Palauta alkuperäinen `overrides.json`
5. **Expected:** Build onnistuu, mutta Gretzky voi puuttua StanleyCup-palkinnot (override lisää ne)

### Olemassaolevat kentät eivät ylikirjoitu

1. Aja `node -e "const d=JSON.parse(require('fs').readFileSync('players-raw.json','utf8')); const c=d.players['8471675']; console.log('position:', c.position, 'shoots:', c.shoots)"`
2. Vaihda pelaaja-ID toiseen tunnettuun (esim. 8478402 McDavid)
3. **Expected:** Molemmilla oikea position ja shoots-data

## Failure Signals

- `⚠ PLAYERS LOST (N)` tai `⚠ AWARDS LOST (N)` audit-raportissa
- players.js DB.length ≠ 5880
- JS-virheitä selaimen konsolissa daily.html tai index.html -sivulla
- Pelaajahaku ei palauta tuloksia
- `grep -c ' p:"' players-full.js` < 5000

## Not Proven By This UAT

- Position/handedness-kenttien hyödyntäminen pelilogiikassa (ei vielä käytössä)
- NHL API:n reaaliaikadatan tuoreus (cache on staattinen snapshot)
- Automaattinen DB-päivitys GitHub Actionsilla (tulevaisuuden milestone)
- players-full.js:n integraatio peleihin (vain players.js käytössä)

## Notes for Tester

- `--audit-only` flag on nopein tapa tarkistaa datan eheys ilman tiedostojen kirjoitusta.
- Spot-check perustuu T01-summaryyn — Gretzky on hyvä ankkuripelaaja koska hänellä on overrides.json-lisäyksiä (Cup-rosterit).
- players-full.js vaatii `--include-extra` -flagin buildissa + manuaalisen kopioinnin (build kirjoittaa aina players.js:ään).
