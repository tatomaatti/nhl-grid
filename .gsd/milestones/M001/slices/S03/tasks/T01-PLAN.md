---
estimated_steps: 6
estimated_files: 3
skills_used: []
---

# T01: Grid-generaattorin testiskripti

**Slice:** S03 — Daily Grid -generoinnin testaus ja hionta
**Milestone:** M001

## Description

Luo Node.js-testiskripti (`test-grid-gen.js`) joka extrahoi daily.html:n grid-generointilogiikan ja ajaa sen N kertaa eri sedeillä. Skripti lataa players.js:n, rakentaa kategoria-poolin ja generoi gridejä. Jokainen grid validoidaan: 9 uniikkia pelaajaa, kaikki intersektiot ≥ MIN_POOL, ei fallback-käyttöä. Lopuksi tulostetaan tilastot.

Tämä on ainoa tapa systemaattisesti todentaa R004: "Jokainen generoitu Daily Grid on ratkaistavissa, monipuolinen ja taktisesti kiinnostava."

## Steps

1. **Extrahoi generointi-koodi**: Kopioi daily.html:n JS-funktiot test-grid-gen.js:iin — TEAMS, NATS, AWARDS, SPECIALS, buildCategoryPool, intersectCats, mulberry32, shuffleArray, fameScore, sortByFame, fillGridBacktrack, findMatchingCats, validatePuzzle, countValidAssignments, generateDailyGrid, generateFallbackGrid, getDailySeed-logiikka. Nämä löytyvät daily.html:stä rivien 643–1035 väliltä (katso `// CATEGORY DEFINITIONS` → `// GAME STATE`). **ÄLÄ** muuta generointi-logiikkaa — kopioi sellaisenaan.

2. **Lataa players.js**: Käytä `fs.readFileSync` + `vm.runInContext` ladataksesi `players.js`. Huomaa: tiedosto käyttää `const DB = [...]`, joten korvaa `const DB` → `var DB` ennen vm-ajoa jotta se päätyy sandbox-kontekstiin. Aseta globaali `DB`-muuttuja generointi-koodin käyttöön.

3. **Seed-generointi**: Generoi N gridiä käyttäen peräkkäisiä seedejä. Käytä samaa getDailySeed-logiikkaa (DJB2 hash "NHLGRID{year}{month}{date}"), mutta iteroi päiviä eteenpäin epoch-päivästä (2026-03-15). Esim. grid 1 = epoch, grid 2 = epoch+1 päivä, jne.

4. **Per-grid validointi**: Jokainen generoitu grid tarkistetaan:
   - 9 uniikkia pelaajaa (ei duplikaatteja)
   - Kaikki 9 intersektiota ≥ MIN_POOL (3 pelaajaa)
   - Ei fallback-gridiä (generateDailyGrid palautti normaalin tuloksen)
   - Kategoriatyyppien jakauma kirjataan (team/nat/award/special)
   - Min/max intersektio-koot kirjataan

5. **Raportointi**: Tulosta lopuksi:
   - `Generated: N/N OK, 0 fallbacks`
   - Kategoriatyyppien kokonaisjakauma (montako kertaa team/nat/award/special valittiin)
   - Min/avg/max intersektio-koot kaikkien gridien yli
   - FAIL-rivit jos generointi epäonnistui (seed, syy)
   - Exit code: 0 = kaikki OK, 1 = yksikin epäonnistui

6. **--verbose flag**: Kun ajetaan `node test-grid-gen.js 1 --verbose`, tulosta yksittäisen gridin:
   - 6 kategoriaa (tyyppi, nimi, pelaajamäärä poolissa)
   - 9 pelaajaa (nimi, joukkueet, kansallisuus, palkinnot)
   - 9 intersektio-koon
   - Validoinnin yksityiskohdat (rowOptions, colOptions)

## Must-Haves

- [ ] Skripti lataa players.js onnistuneesti (5880 pelaajaa)
- [ ] Skripti generoi 30+ gridiä ilman virheitä
- [ ] 0 fallback-käyttöä (kaikki gridit generoituvat normaalilla algoritmilla)
- [ ] Jokainen grid: 9 uniikkia pelaajaa, 9 intersektiota ≥ MIN_POOL
- [ ] Tilastoraportti tulostuu (kategoriajakauma, intersektio-koot)
- [ ] --verbose toimii yksittäiselle gridille
- [ ] Exit code 0 kun kaikki OK, 1 kun virhe
- [ ] Generointi-logiikka on identtinen daily.html:n kanssa — EI muokata algoritmia

## Verification

- `node test-grid-gen.js 30` — exit code 0, raportti tulostuu, sisältää "Generated: 30/30"
- `node test-grid-gen.js 30 2>&1 | grep -c "FAIL"` palauttaa 0
- `node test-grid-gen.js 1 --verbose` — tulostaa yksittäisen gridin rakenteen
- Epäonnistumisskenaarion diagnoosi: jos grid epäonnistuu, seed ja syy tulostuvat

## Inputs

- `daily.html` — generointi-logiikan lähdekoodi (rivit 643–1035)
- `players.js` — pelaajatietokanta (5880 pelaajaa, `const DB = [...]` -formaatti)

## Expected Output

- `test-grid-gen.js` — Node.js-testiskripti joka generoi ja validoi gridejä
