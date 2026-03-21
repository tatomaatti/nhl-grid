---
estimated_steps: 4
estimated_files: 3
skills_used:
  - agent-browser
---

# T02: Integraatiotesti — pelit lataavat rebuildityn DB:n

**Slice:** S02 — Pelaajatietokannan rebuild ja audit
**Milestone:** M001

## Description

T01 rebuild players.js tuoreesta datasta. Tämä taski varmistaa end-to-end-toimivuuden: molemmat pelimuodot (daily.html, index.html) lataavat rebuildityn players.js:n ja pelaajahaku toimii. Rebuild voi rikkoa players.js:n formaatin tavalla joka ei näy build-auditin numeerisissa tarkistuksissa mutta estää pelien toiminnan (esim. syntaksivirhe, muuttunut kenttänimi, encoding-ongelma).

**Konteksti:**
- `daily.html` ja `index.html` lataavat `<script src="players.js"></script>` — DB on globaali `const DB = [...]`
- Molemmissa on runtime-tarkistus: `typeof DB === 'undefined'` → virheilmoitus
- Pelaajahaku perustuu `DB.filter(p => p.n.toLowerCase().includes(query))` -tyyppiseen hakuun
- index.html on ristinolla, daily.html on päivittäinen peli

## Steps

1. **Käynnistä paikallinen HTTP-palvelin** projektin juuressa (`npx http-server . -p 8080 -c-1` tai vastaava). Tiedostot ovat staattisia HTML-sivuja joten yksinkertainen palvelin riittää.

2. **Avaa daily.html selaimessa** ja tarkista:
   - Sivu latautuu ilman JS-virheitä (tarkista console)
   - DB on ladattu: `typeof DB !== 'undefined'` ja `DB.length === 5880`
   - Grid-generointi toimii (ruudukko renderöityy)
   - Pelaajahaku: kirjoita "Gretzky" hakukenttään → Wayne Gretzky löytyy

3. **Avaa index.html selaimessa** ja tarkista:
   - Sivu latautuu ilman JS-virheitä
   - DB on ladattu: `DB.length === 5880`
   - Pelaajahaku toimii: kirjoita "Crosby" → Sidney Crosby löytyy

4. **Sulje palvelin** ja raportoi tulokset.

## Must-Haves

- [ ] daily.html latautuu ilman JS console-virheitä
- [ ] index.html latautuu ilman JS console-virheitä
- [ ] DB.length === 5880 molemmissa
- [ ] Pelaajahaku palauttaa tuloksia molemmissa pelimuodoissa

## Verification

- Browser console: 0 JS errors molemmilla sivuilla
- `browser_evaluate('typeof DB !== "undefined" && DB.length')` palauttaa 5880
- Pelaajahaku "Gretzky" tuottaa tuloksen daily.html:ssä
- Pelaajahaku "Crosby" tuottaa tuloksen index.html:ssä

## Inputs

- `players.js` — T01:n tuottama rebuilditty pelaajatietokanta
- `daily.html` — päivittäinen peli
- `index.html` — ristinolla

## Observability Impact

- **No new runtime signals** — this task is a verification-only task, not a code change
- **Inspection surface**: Browser console logs confirm players.js loads without errors; `DB.length` in console confirms record count
- **Failure visibility**: JS console errors surface immediately if players.js has syntax errors or encoding issues; `typeof DB === 'undefined'` check in both HTML files shows error modal if DB fails to load
- **Future agent note**: If this test fails, the root cause is in build-players-db.js output format, not in the HTML files

## Expected Output

- `daily.html` — ei muutoksia (varmistettu toimivaksi)
- `index.html` — ei muutoksia (varmistettu toimivaksi)
