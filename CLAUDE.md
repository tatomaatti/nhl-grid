# NHL Hockey Grid — CLAUDE.md

Päivitetty: 2026-03-20

## Project Overview

NHL Hockey Grid — kaksiosainen selainpeli osoitteessa `https://tatomaatti.github.io/nhl-grid/` (siirtyy omalle domainille):

1. **Daily Grid** (pääfocus) — Wordle-tyylinen päivittäinen peli. 3×3 ruudukko, piilotetut rivi/sarake-kategoriat, pelaaja arvaa NHL-pelaajien nimiä. Tiedosto: `daily.html`
2. **Ristinolla** (kaverihaaste) — 1v1 moninpeli, pelaajat nimeävät NHL-pelaajia kategoriaristeyksiin. Offline + online. Tiedosto: `nhl-grid.html` / `index.html`

## Key Files

### Pelitiedostot (tuotanto)
- `index.html` / `nhl-grid.html` — Ristinolla (~2330 riviä, single-file HTML)
- `daily.html` — Daily puzzle (~1725 riviä)
- `players.js` — Pelaajatietokanta (~300 KB, ~5880 pelaajaa)
- `config.js` — Firebase-konfiguraatio (TODO: luodaan Firebase-siirtymässä)
- `manifest.json` — PWA (TODO)
- `sw.js` — Service Worker (TODO)

### ETL-pipeline (pelaajatietokannan päivitys)
- `fetch-raw.js` — Vaihe 1: hakee biot, palkinnot (/v1/player/{id}/landing), Cup-rosterit NHL API:sta
- `build-players-db.js` — Vaihe 2: rakentaa players.js players-raw.json:sta + overrides.json
- `players-raw.json` — Raakadata kaikista lähteistä (~2.3 MB)
- `overrides.json` — Manuaaliset korjaukset (Gretzky, Timonen jne.)
- `migrate-to-raw.js` — Kertakäyttö: migroi vanha data uuteen formaattiin

### Vanhat scriptit (varmuuskopiot)
- `fetch-all-players-v1.js` — Vanha pelaajahaku
- `fetch-nhl-players-v1.js` — Vanha NHL API -haku

### Dokumentaatio
- `PROJECT_PLAN.md` — Tuotantosuunnitelma, roadmap, arkkitehtuuripäätökset
- `TIKI_TAKA_TOE_ANALYSIS.md` — Referenssianalyysi (Firebase-arkkitehtuuri)
- `CLAUDE.md` — Tämä tiedosto (projektimuisti)

## Technical Architecture

### Nykyinen (v1)
- Single-file HTML (CSS + JS sisällä)
- PeerJS/WebRTC moninpeli + ExpressTURN (väliaikainen, korvataan Firebasella)
- Staattinen `players.js` ladataan `<script src>`-tagilla
- Seeded PRNG (Mulberry32) Daily-gridille
- GitHub Pages hosting

### Tavoite (v2)
- **Moninpeli**: Firebase Realtime Database (PeerJS korvataan)
- **Hosting**: Cloudflare Pages + oma domain (yksityinen GitHub-repo)
- **Daily-gridit**: JSON-arkisto (archive.json), ei lennossa generoitu
- **PWA**: manifest.json + service worker
- **CI/CD**: git push → automaattinen deploy
- **DB-päivitys**: GitHub Actions viikottain (fetch + build + audit)

### Pelaajatietokannan periaatteet (KRIITTINEN)
1. **Append-only**: tietoa ei koskaan poisteta, vain lisätään
2. **Lähdeseuranta**: jokainen tieto merkitään lähteellä
3. **Audit ennen julkaisua**: build-players-db.js vertaa uutta ja vanhaa, keskeyttää jos dataa häviää
4. **Valheellista tietoa ei hyväksytä**: lähde vaaditaan kaikelle datalle

### Referenssiarkkitehtuuri: Tiki Taka Toe
Analysoitu 2026-03-20. He käyttävät:
- Astro 5 + React (Islands), Netlify, BunnyCDN
- **Firebase Realtime Database** moninpeliin (identtinen tarpeemme)
- Huoneen elinkaari: set() → onValue() → update() → remove()
- Firebase API-avain näkyvillä selaimessa (normaali, turvallisuus Security Ruleissa)
- Katso TIKI_TAKA_TOE_ANALYSIS.md yksityiskohdat

### NHL API -endpointit
- Pelaajan tiedot: `https://api-web.nhle.com/v1/player/{id}/landing` (sisältää palkinnot, bio, position)
- **EI** käytä: `/v1/player/{id}/awards` (palauttaa 404)
- Palkintonimet: smart quote -normalisointi vaaditaan (U+201C/U+201D → ")
- Cup-rosterit: `/v1/roster/{teamAbbr}/{season}` per kausi

### Namesake disambiguation
- Syntymävuosi-suffiksi: `"Matt Murray (1994)"`
- Jos vuodetkin sama: täysi päivämäärä `"Petr Svoboda (1966-02-14)"`
- Pelaajadata: `{ n: "Name", t: ["TEAM1","TEAM2"], c: "NAT", a: ["Award1"] }`
- Team alias mapping: `{PHX: 'UTA', ATL: 'WPG', HFD: 'CAR', QUE: 'COL'}`

## Deployment

### Nykyinen
- GitHub Pages: `https://tatomaatti.github.io/nhl-grid/`
- Manuaalinen upload GitHub web UI:n kautta

### Tavoite
- Cloudflare Pages + oma domain
- Yksityinen GitHub-repo
- git push → automaattinen deploy (välitön)
- GitHub Actions: viikottainen players.js -päivitys

## Pending / TODO

### Käynnissä
- Awards-haku NHL API:sta (fetch-raw.js --awards-only, ~3h)

### Seuraavat vaiheet (roadmap PROJECT_PLAN.md:ssä)
1. Mobiilikorjaukset (viewport, keyboard, touch)
2. Oma domain + Cloudflare Pages
3. Firebase-moninpeli (korvaa PeerJS)
4. PWA
5. Daily Grid -arkistointi + admin-työkalu
6. Monetisointi (AdSense, rewarded ads)
7. Automaattinen DB-päivitys (GitHub Actions)

### Tunnettu tekninen velka
- ExpressTURN-tunnukset kovakoodattuna HTML:ssä (poistuu Firebase-siirtymässä)
- 2024-25 Stanley Cup champion merkitty 'TBD' fetch-raw.js:ssä
- Position/handedness -kentät suunniteltu mutta ei vielä players.js:n outputissa

---

## Who Is Tatu — User Profile

### Language & Communication
- Primary language: Finnish. Mixes Finnish and English naturally
- Direct and concise. Gives clear, specific bug reports
- Suunnittelee ennen toteutusta — arvostaa huolellista valmistelua

### Workflow — The 7 Phases
1. **Requirements** — Tatu shares what he wants
2. **Planning** — I ask clarifying questions and propose an approach
3. **Approval** — Wait for explicit green light ("toteutetaan", "kuulostaa hyvältä")
4. **Implementation** — Only now write code
5. **Testing** — Tatu tests thoroughly
6. **Feedback** — Detailed bug reports with context
7. **Iteration** — Fix and repeat

### Signal Words

| Tatu says | What it means | What I do |
|-----------|---------------|-----------|
| "Suunnittele ensin" | PLAN FIRST — do NOT code | Ask questions, analyze, propose |
| "Ota huomioon porsaanreiät" | Think about edge cases | Enumerate pitfalls before coding |
| "Kuulostaa hyvältä, toteutetaan" | GREEN LIGHT | Write code |
| "Vastaa ennenkuin tehdään muutoksia" | DIAGNOSE first | Investigate root cause |
| "Palataan tähän myöhemmin" | Defer | Mark as TODO, move on |
| "Ei kelpaa" | Rejection | Ask why, propose alternative |

### What Tatu Values
1. **Correctness** — Bugs > features. Solid > ambitious.
2. **Planning** — Think first, code second. Always.
3. **Simplicity** — Arkkitehtuurin tulee olla selkeä, yksinkertainen, ihmisystävällinen ja käytännöllisesti ylläpidettävä.
4. **Pitfall analysis** — Anticipate edge cases
5. **Think-out-loud** — Show reasoning
6. **Pragmatism** — No over-engineering

### What Tatu Does NOT Like
- Coding before planning
- Trusting external data without validation
- Jumping to solutions without diagnosis
- Over-engineered features he didn't ask for
- Being told to do things he can figure out

---

## Error Taxonomy — 7 Error Classes

### CLASS A: Premature Implementation
Coding before approval. Prevention: Did Tatu say "toteutetaan"? If not, DON'T CODE.

### CLASS B: Insufficient Testing
Shipping untested features. Prevention: Test ALL mode combinations, spot-check 10+ known players, test edge cases.

### CLASS C: Trusting External Data
Assuming APIs return complete data. Prevention: Cross-validate, audit before/after diffs, check what was lost.

### CLASS D: Jumping to Solutions
Proposing fixes before diagnosis. Prevention: Investigate root cause FIRST, present diagnosis before solutions.

### CLASS E: UI State Management
UI elements not cleaning up. Prevention: Does reset clear ALL state? Does any UI reveal hidden info?

### CLASS F: Missing Features Late
Requirements not gathered upfront. Prevention: Walk full user flow, consider casual users, ask "anything else?"

### CLASS G: Environment Mistakes
Not knowing VM/infra constraints. Prevention: Test connectivity first, have fallback plans, clear file paths.

---

## Process Rules

1. **Read signal words.** "Suunnittele" = plan, don't code.
2. **Think out loud.** Show reasoning before acting.
3. **Ask clarifying questions** when requirements are vague.
4. **Cross-validate ALL external data.** Never trust a single source.
5. **Audit after every data transformation.** Before/after diffs.
6. **Test the full feature space.** All modes, edge cases.
7. **Trace the full pipeline** before changing anything.
8. **Know environment limits first.**
9. **MVP first.** Finish current feature before starting next.
10. **Enumerate edge cases BEFORE coding.**
