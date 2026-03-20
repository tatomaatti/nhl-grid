# Tiki Taka Toe — Arkkitehtuurianalyysi

## Yhteenveto

Tiki Taka Toe on **Astro 5 + React** -selainpeli, joka käyttää **Firebase Realtime Databasea** moninpelin relaynä. Sivusto hostataan **Netlifyllä**, staattiset resurssit jaetaan **BunnyCDN:n** kautta. Mainontaan käytetään **FCP/Freewheel** -videomainosalustaa. Peli on **PWA** (asennettavissa puhelimeen).

---

## Frontend

| Komponentti | Teknologia |
|-------------|------------|
| **Metaframework** | Astro v5.17.1 (Islands Architecture) |
| **UI-framework** | React (JSX runtime, Astro-islanteina) |
| **CSS** | Tailwind CSS |
| **UI-komponentit** | Headless UI (radiogroup, dialog, transitions) |
| **Build/bundle** | Astro built-in (Vite pohjalla) |
| **PWA** | manifest.json + Service Worker |

### Astro Islands -arkkitehtuuri

Astro renderöi HTML:n palvelimella (SSG/SSR). Vain interaktiiviset komponentit ladataan React-islanteina selaimessa:

```
Staattinen HTML (Astro, 0 KB JS)
  ├── <astro-island> Room.js         ← pelin ydin (React, 17 KB)
  ├── <astro-island> Settings.js     ← asetukset (React)
  ├── <astro-island> Streaks.js      ← streak-laskuri (React)
  ├── <astro-island> SocialLinks.js  ← Discord/some (React)
  └── <astro-island> Infobox.js      ← info-modaalit (React)
```

Hyöty: valtaosa sivusta on staattista HTML:ää, joka latautuu nopeasti. React-koodi ladataan vain tarvittaessa.

### Tiedostorakenne (pääteltynä)

```
playfootball.games/
├── src/
│   ├── pages/
│   │   └── footy-tic-tac-toe/
│   │       ├── index.astro          (daily-pelimuoto)
│   │       └── room/
│   │           └── index.astro      (moninpeli)
│   ├── components/
│   │   ├── Room.tsx                 (pelin pääkomponentti)
│   │   ├── Settings.tsx             (asetukset)
│   │   ├── EndMatchModal.tsx        (pelin loppu)
│   │   ├── Autocomplete.tsx         (pelaajahaku)
│   │   ├── Infobox.tsx              (ohjeet)
│   │   ├── Streaks.tsx              (streak-laskuri)
│   │   └── SocialLinks.tsx          (linkit)
│   ├── lib/
│   │   ├── firebase.ts              (Firebase init + wrapper)
│   │   ├── settings.ts              (asetuslogiikka)
│   │   └── pickMultipleChoiceOptions.ts
│   └── styles/
│       └── (Tailwind config)
├── public/
│   ├── manifest.json
│   └── icon.png
├── astro.config.mjs
└── package.json
```

---

## Backend / Multiplayer

### Firebase Realtime Database

**Ei omaa palvelinta.** Moninpeli toimii kokonaan Firebase Realtime Databasen kautta:

```
Pelaaja A (selain)                    Pelaaja B (selain)
     │                                      │
     ├── set() / update() ──────────────┐   │
     │                                  ▼   │
     │                          ┌──────────────┐
     │                          │   Firebase    │
     │                          │   Realtime    │
     │                          │   Database    │
     │                          │              │
     │                          │  /rooms/     │
     │                          │    /ABCDE/   │
     │                          │      grid    │
     │                          │      turn    │
     │                          │      players │
     │                          │      settings│
     │                          │      score   │
     │                          └──────────────┘
     │                                  │
     │   ┌──────────── onValue() ◄──────┘
     ▼   ▼
  UI päivittyy
```

### Firebase-operaatiot Room.js:ssä

| Funktio | Firebase-operaatio | Käyttö |
|---------|-------------------|--------|
| `ref()` | Luo viittaus polkuun | `/rooms/{roomCode}` |
| `onValue()` | Kuuntelee muutoksia reaaliajassa | Pelin tila synkronoituu |
| `set()` | Kirjoittaa dataa | Uuden huoneen luonti, siirron tekeminen |
| `update()` | Päivittää kenttiä | Vuoron vaihto, pisteen lisäys |
| `push()` | Lisää uniikin avaimen alle | Huonekoodin generointi? |
| `remove()` | Poistaa dataa | Huoneen siivous pelin jälkeen |
| `get()` | Lukee kerran | Tarkistaa onko huone olemassa |

### Huoneen elinkaari

1. **Host luo huoneen**: `set(ref(db, 'rooms/' + roomCode), { settings, grid, turn, players: { 1: host } })`
2. **Guest liittyy**: `update(ref(db, 'rooms/' + roomCode + '/players'), { 2: guest })`
3. **Molemmat kuuntelevat**: `onValue(ref(db, 'rooms/' + roomCode), callback)` — jokainen muutos triggeröi UI-päivityksen
4. **Siirto**: `update(ref(db, 'rooms/' + roomCode), { grid: newGrid, turn: nextTurn })`
5. **Peli päättyy**: `remove(ref(db, 'rooms/' + roomCode))` — siivotaan data

### Miksi tämä toimii 100 % yhteyksistä

- **Ei P2P:tä** — kaikki kulkee Googlen palvelinten kautta tavallisella HTTPS/WebSocket-yhteydellä
- **Ei NAT-ongelmia** — sama kuin minkä tahansa nettisivun lataaminen
- **Ei STUN/TURN-riippuvuuksia** — ei tarvita
- **Automaattinen uudelleenyhdistäminen** — Firebase SDK hoitaa yhteyskatkot
- **Latenssi ~50-100 ms** — merkityksetön vuoropohjaisessa pelissä

### Firebase ilmaistaso (Spark Plan)

| Resurssi | Raja |
|----------|------|
| Yhtäaikaiset yhteydet | 100 |
| Tallennustila | 1 GB |
| Lataukset | 10 GB / kk |
| Kirjoitukset | Rajaton* |

*Käytännössä 100 yhtäaikaista yhteyttä = ~50 peliä samaan aikaan. Tämä riittää pitkälle alkuvaiheessa.

---

## Hosting & CDN

| Kerros | Palvelu | Rooli |
|--------|---------|-------|
| **Hosting** | Netlify | Astro SSG/SSR, HTML-sivut |
| **CDN** | BunnyCDN (`cdn.playfootball.games`) | JS-bundlet, pelaajadata-JSON, kuvat |
| **Tietokanta** | Firebase Realtime Database | Moninpelin reaaliaikadata |
| **DNS** | (ei tunnistettu) | playfootball.games domain |

### CDN-rakenne

```
cdn.playfootball.games/
├── _astro/                          (Astro-bundlet)
│   ├── Room.CpDLT21b.js            (17 KB, pelin ydin)
│   ├── index.esm2017.BPQO3_eG.js   (181 KB, Firebase SDK)
│   ├── Settings.BweBC0OF.js
│   ├── Autocomplete.DnRuGS7j.js
│   └── ... (30+ JS-chunkkia)
└── api/
    └── footy-tic-tac-toe/
        └── eu1/
            ├── players.json          (pelaajatietokanta)
            └── gameData.json         (kategoriat, vaikeustaso)
```

BunnyCDN cache: `max-age=1200` (20 min). Tiedostonimet sisältävät hash-tunnisteen (esim. `.CpDLT21b.js`), joten uusi deploy invalidoi cachen automaattisesti.

---

## Pelaajadata

Pelaajadata tulee staattisena JSON-tiedostona CDN:ltä — ei tietokannasta:

```json
{
  "players": [
    {"n": "Abelardo", "v": [-24, 2, 112, 304, 317, 334, 566]},
    {"n": "Messi", "v": [-39, 1, 2, 86, 112, ...]}
  ]
}
```

- `n` = nimi (kompakti)
- `v` = numeeriseksi koodatut kategoriat (joukkueet, maat, trofeet) — negatiiviset = metadata (ikä?), positiiviset = kategoria-ID:t gameData.json:sta

Erillinen `gameData.json` sisältää kategorioiden nimet, reputaation ja vaikeusasetukset. Tämä erottelu on fiksu: pelaajadata pysyy pienenä ja kategoriat ovat helposti päivitettävissä.

---

## Monetisointi / Mainokset

| Palvelu | Rooli |
|---------|-------|
| **FCP / Freewheel** (`cdn.fcp.codes`) | Videomainokset (SMART-tagit) |
| **DoubleVerify** (`cdn.doubleverify.com`) | Mainoksen verifiointi (näkyvyys, branditurvallisuus) |
| **Longitude** (`lngtd.com`) | Mainosten analytiikka/optimointi |
| **Google Tag Manager** | Tagien hallinta, analytiikka |
| **reCAPTCHA** (`google.com/recaptcha`) | Bot-suojaus |

Mainokset ovat **videomainoksia** (FCP/Freewheel), eivät Google AdSense -bannereita. Sivulla näkyy musta 16:9-alue Settings-kohdan alla — tämä on videomainospaikka.

---

## Yhteenveto: mitä tämä tarkoittaa NHL Gridille

### Tiki Taka Toen pino vs. ehdotettu NHL Grid -pino

| Osa-alue | Tiki Taka Toe | NHL Grid (ehdotus) |
|----------|---------------|---------------------|
| Framework | Astro 5 + React | **Ei tarvita** — nykyinen single-file HTML toimii |
| Multiplayer | Firebase Realtime DB | **Firebase Realtime DB** (sama ratkaisu) |
| Hosting | Netlify | Cloudflare Pages (ilmainen) |
| CDN | BunnyCDN (maksullinen) | Cloudflare CDN (sisäänrakennettu, ilmainen) |
| Pelaajadata | Staattinen JSON CDN:ltä | Staattinen `players.js` (sama idea) |
| Mainokset | FCP/Freewheel (video) | AdSense H5 Games (yksinkertaisempi) |
| PWA | Kyllä | **Kyllä** (lisätään) |
| UI-kirjasto | Tailwind + Headless UI | Custom CSS (toimii jo) |

### Tärkein oivallus

Tiki Taka Toe todistaa, että **Firebase Realtime Database on riittävä ja toimiva ratkaisu** vuoropohjaiselle moninpelille. Se on yksinkertaisempi kuin Cloudflare Durable Objects ja ilmaistaso kattaa alkuvaiheen tarpeet.

**Suositukseni muuttuu**: käytä Firebasea Cloudflare Workersin sijaan. Syyt:

1. **Ilmainen** alkuvaiheessa (100 yhtäaikaista yhteyttä)
2. **Ei tarvitse omaa palvelinkoodia** — Firebase SDK hoitaa kaiken selaimessa
3. **Todistettu toimivaksi** — Tiki Taka Toe pyörittää tuhansia pelejä päivässä samalla arkkitehtuurilla
4. **Helpompi toteuttaa** — 50-80 riviä koodia korvaa nykyisen PeerJS-logiikan
5. **Skaalautuu** — Blaze plan ($0.03/GB) kun ilmaistaso loppuu
