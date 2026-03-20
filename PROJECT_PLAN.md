# NHL Hockey Grid — Tuotantosuunnitelma v2

Päivitetty: 2026-03-20

---

## Projektin visio

NHL Hockey Grid on kaksiosainen selainpeli: **Daily Grid** (päivittäinen palautumispeli, pääfocus) ja **Ristinolla** (kaverihaaste, sosiaalinen moninpeli). Pelin tulee olla yksinkertainen, luotettava ja mobiiliystävällinen. Arkkitehtuuri pidetään mahdollisimman kevyenä — ei turhaa monimutkaisuutta.

---

## 1. Auth (rekisteröinti)

**Ei tarvita.** Peli toimii selaimessa ilman rekisteröintiä. Kaikki pysyvä pelaajatieto tallennetaan selaimen `localStorage`-muistiin: streak-laskuri, pelitilastot, asetukset, pelattujen Daily-gridien historia.

Jos joskus tarvitaan käyttäjätilejä (globaali leaderboard), vapaaehtoinen kirjautuminen lisätään myöhemmin ilman arkkitehtuurimuutoksia.

---

## 2. Database (tietojen tallennus)

### Pelaajatietokanta (staattinen)

`players.js` — ~300 KB, ~5880 pelaajaa. Päivitetään ETL-pipelinella (fetch-raw.js → build-players-db.js → players.js). Julkaistaan git pushilla.

### Pelaajatietokannan päivitysperiaatteet

**Append-only**: mitään tietoa ei koskaan poisteta. Uutta tietoa voi tulla (kaupat, palkinnot, rookiet), mutta olemassa olevaa ei ylikirjoiteta ellei vanha ole todistettavasti virheellistä.

**Lähdeseuranta**: jokainen tieto merkitään lähteellä (`"sources": ["roster-2024-25-FLA", "player-landing-api"]`). Tietoa ei hyväksytä ilman lähdettä.

**Validointi**: build-players-db.js ajaa audit-vaiheen joka vertaa uutta ja vanhaa tietokantaa. Jos pelaajia tai palkintoja häviää, build keskeytyy virheilmoituksella. Valheellista tietoa ei saa päätyä tietokantaan.

**Automaattinen päivitys (TODO)**: GitHub Actions -workflow ajaa fetch-raw.js + build-players-db.js kerran viikossa. Jos audit läpäisee, uusi players.js commitoidaan automaattisesti ja deploy triggeröityy. Workflow lähettää notifikaation jos audit havaitsee ongelmia.

### Käyttäjädata (selaimessa)

| Data | Sijainti | Muoto |
|------|----------|-------|
| Streak (esim. 10 päivää putkeen) | `localStorage` | JSON |
| Pelatut Daily-gridit ja tulokset | `localStorage` | JSON |
| Asetukset | `localStorage` | JSON |

### Daily Grid -data (uusi arkkitehtuuri)

Daily-gridit tulevat erillisestä JSON-tiedostosta, eivät generoidu lennossa:

```
/dailies/
├── archive.json          (kaikki menneet gridit, numero + päivämäärä + grid-data)
├── current.json          (tämän päivän grid, cachetaan CDN:ssä)
└── specials/             (admin-gridit: itsenäisyyspäivä, joulu jne.)
    └── 2026-12-06.json
```

Tarkempi suunnittelu kohdassa "Daily Grid -pelimuoto".

---

## 3. Monetisointi

**Ei maksullinen. Mainostulot + lahjoitukset.**

### Mainosstrategia

**Interstitial-mainokset** luonnollisissa taukokohdissa: Daily-tuloksen jälkeen, ristinolla-erän välissä, ottelusarjan päätteeksi. Max 1 mainos per 2-3 minuuttia, ei koskaan kesken pelin.

**Rewarded ads** Daily-pelissä: "Katso mainos → saat ylimääräisen vinkin" tai "Katso mainos → pelaa arkistosta toinen grid". Pelaaja valitsee itse, ei pakotettua.

**Arkistogridit**: unlimited random-generated gridit rewarded ad -muurin takana. Yksi mainos = yksi uusi grid. Tämä on luonteva monetisointikohta, koska pelaaja on jo osoittanut aktiivista kiinnostusta.

**Ei bannereita**: eCPM liian matala (~$0.60), pilaavat visuaalisen ilmeen.

### Mainosverkko

Google AdSense H5 Games Ads (ei minimivaatimusta). Vaihtoehto: AdMaven / Adsterra.

### GDPR (EU-käyttäjät)

CMP-ratkaisu pakollinen (TCF v2.3 maaliskuusta 2026). Ilmainen CMP (Quantcast Choice / CookieYes).

### Lahjoitukset

Ko-fi-linkki asetussivulle. Lisätulo, ei korvaa mainoksia.

### Realistiset tuloarviot

| Päivittäiset pelaajat | Tulot/kk (arvio) |
|------------------------|-------------------|
| 100 | ~$3-7 |
| 1 000 | ~$30-70 |
| 10 000 | ~$300-700 |

---

## 4. Security (tietoturva)

### Perusturvallisuus

**HTTPS**: pakollinen, automaattinen kaikilla suositelluilla hosteilla.
**CSP-headerit**: lisätään omalle domainille siirryttäessä.
**Firebase Security Rules**: rajoittaa kuka voi lukea/kirjoittaa moninpelihuoneen dataa.

### Firebase Realtime Database -turvallisuus

**Mitä tapahtuu, kun 10 pelaajaa avaa saman huonelinkin?**

Firebase Realtime Database hoitaa tämän: se on suunniteltu tuhansien yhtäaikaisten yhteyksien käsittelyyn. Tietomalli rajoittaa huoneen kahteen pelaajaan:

```javascript
// Firebase Security Rules
{
  "rules": {
    "rooms": {
      "$roomCode": {
        // Kuka tahansa voi lukea huoneen tilan (tarvitaan synkronointiin)
        ".read": true,
        // Kirjoitus vain jos huoneessa on tilaa TAI kirjoittaja on jo pelaajana
        ".write": "!data.exists() || data.child('players').numChildren() < 2 || data.child('players').hasChild(auth.uid)",
        "players": {
          // Max 2 pelaajaa
          ".validate": "newData.numChildren() <= 2"
        }
      }
    }
  }
}
```

Käytännössä: jos 10 pelaajaa avaa saman linkin, kaksi ensimmäistä pääsee peliin, loput 8 näkevät "Huone täynnä" -ilmoituksen. Tämä on Firebase-tasoinen suojaus — sitä ei voi kiertää selaimesta.

### TURN-tunnusten suojaus (väliaikainen ratkaisu)

Nykyisellään ExpressTURN-tunnukset ovat näkyvissä HTML-koodissa. Tämä on hyväksyttävää koska:
- Ilmaistasolla 1000 GB/kk, väärinkäytön riski olematon
- Repo on yksityinen (ei julkisesti GitHubissa)
- Firebase-siirtymässä TURN-tunnukset poistuvat kokonaan

### Tulevaisuudessa (Firebase-arkkitehtuuri)

Firebase API-avain on suunniteltu näkyväksi selaimessa — se ei ole salaisuus. Turvallisuus tulee Security Ruleista, ei avaimen piilottamisesta. Tämä on sama malli kuin Tiki Taka Toessa.

---

## 5. Frontend

### Nykyinen rakenne (toimii, pidetään yksinkertaisena)

Single-file HTML -arkkitehtuuri on riittävä tämänkokoiselle pelille. CSS ja JS pysyvät HTML:n sisällä. Ei tarvetta Astro/React/Tailwind-pinoon — nykyinen custom CSS toimii hyvin.

```
/
├── index.html          (ristinolla, ~2330 riviä)
├── daily.html          (daily-pelimuoto, ~1725 riviä)
├── players.js          (pelaajadata, ~300 KB)
├── config.js           (Firebase-konfiguraatio, TURN-tunnukset)
├── manifest.json       (PWA)
├── sw.js               (service worker)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── dailies/            (Daily Grid -arkisto)
│   ├── archive.json
│   └── specials/
└── admin/              (ylläpitäjän työkalut)
    └── grid-builder.html
```

### Mobiili-UX (kriittiset korjaukset, EI TOTEUTETTU)

**Näppäimistöongelma**: virtuaalinäppäimistö muuttaa viewportin kokoa mobiilissa.

Korjaus:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=overlays-content">
```

CSS-lisäykset:
```css
html, body { min-height: 100svh; overscroll-behavior: none; }
button, .option-btn, .cell, .sug-item, .grid-cell { touch-action: manipulation; }
.game-screen, .daily-grid, #grid { user-select: none; -webkit-user-select: none; }
.cell, .grid-cell, .sug-item { min-height: 44px; min-width: 44px; }
```

iOS Safari `visualViewport` API -korjaus:
```javascript
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const offset = window.innerHeight - window.visualViewport.height;
    document.querySelector('.search-wrap').style.transform = `translateY(-${offset}px)`;
  });
}
```

### PWA (EI TOTEUTETTU)

Manifest.json + service worker → asennettavissa puhelimen kotinäytölle, offline-Daily mahdollinen, natiivi-ilme ilman osoitepalkkia.

---

## 6. Backend / Online-arkkitehtuuri

### Valinta: Firebase Realtime Database

**Perusteltu Tiki Taka Toe -analyysillä.** He käyttävät identtistä arkkitehtuuria (vuoropohjainen ristinolla, huonekoodi, reaaliaikainen synkronointi) ja se toimii luotettavasti tuhansille pelaajille.

```
Pelaaja A (selain)                    Pelaaja B (selain)
     │                                      │
     ├── set() / update() ──────────────┐   │
     │                                  ▼   │
     │                          ┌──────────────┐
     │                          │   Firebase    │
     │                          │   Realtime    │
     │                          │   Database    │
     │                          │  /rooms/      │
     │                          │    /ABCDE/    │
     │                          │      grid     │
     │                          │      turn     │
     │                          │      players  │
     │                          │      settings │
     │                          │      score    │
     │                          └──────────────┘
     │                                  │
     │   ┌──────────── onValue() ◄──────┘
     ▼   ▼
  UI päivittyy reaaliajassa
```

### Miksi Firebase eikä Cloudflare Durable Objects

- **Ilmainen** alkuvaiheessa (100 yhtäaikaista yhteyttä, 10 GB/kk)
- **Ei omaa palvelinkoodia** — Firebase SDK hoitaa kaiken selaimessa
- **Todistettu toimivaksi** — Tiki Taka Toe pyörittää samaa arkkitehtuuria tuotannossa
- **100 % yhteyksistä toimii** — ei NAT-ongelmia, ei STUN/TURN-riippuvuuksia
- **~50-80 riviä koodia** korvaa nykyisen PeerJS-logiikan (~200 riviä)

### Migraatiosuunnitelma PeerJS → Firebase

1. Luo Firebase-projekti (Console: console.firebase.google.com)
2. Ota käyttöön Realtime Database
3. Kirjoita Security Rules (2 pelaajaa per huone, huoneen automaattinen poisto)
4. Korvaa PeerJS-koodi Firebase SDK:lla nhl-grid.html:ssä
5. Poista PeerJS-scripti ja STUN/TURN/ExpressTURN-konfiguraatio
6. Testaa: eri verkot, mobiili-4G, yritysverkko

### Firebase ilmaistaso (Spark Plan)

| Resurssi | Raja |
|----------|------|
| Yhtäaikaiset yhteydet | 100 (~50 peliä) |
| Tallennustila | 1 GB |
| Lataukset | 10 GB / kk |
| Hinta | $0 |

Skaalautuminen: Blaze plan ($0.03/GB) kun ilmaistaso loppuu.

---

## 7. Daily Grid -pelimuoto (pääfocus)

### Nykyinen toiminta

Daily-grid generoidaan deterministisesti päivämäärän perusteella (seeded PRNG, Mulberry32). Pelaaja arvaa 3×3-ruudukon pelaajanimiä piilossa olevien rivi/sarake-kategorioiden perusteella.

### Suunnitellut parannukset

#### 7.1 Admin Grid Builder (EI TOTEUTETTU)

Erillinen `admin/grid-builder.html` -työkalu, jolla ylläpitäjä voi:

1. **Luoda käsin räätälöityjä gridejä** (esim. Suomen itsenäisyyspäivä-special: 9 suomalaista pelaajaa)
2. **Validoida gridin ennen julkaisua**: työkalu listaa jokaiselle ruudulle kaikki oikeat vastaukset players.js:stä
3. **Tarkistaa riippuvuudet**: näyttää mitkä kategoriaparit ovat mahdottomia (0 oikeaa vastausta)
4. **Esikatsella gridin**: näyttää miltä se näyttää pelaajalle

**Haasteet jotka tulee ratkaista:**
- Ruudun tulee olla ratkaistavissa: jokaisessa 9 ruudussa oltava vähintään 1 oikea vastaus
- Sama pelaaja voi olla oikea vastaus useassa ruudussa, mutta pelaaja saa käyttää nimeä vain kerran → backtracking-tarkistus
- Special-gridit voivat rikkoa normaalin vaikeustason: "9 suomalaista" kuulostaa helpolta, mutta jos kategoriat ovat liian spesifejä, ratkaisuja voi olla 0-1 per ruutu
- Admin-työkalu EI saa olla julkisesti saavutettavissa (ei linkkiä pääsivulta, erillinen URL)

#### 7.2 Gridien numerointi ja arkistointi (EI TOTEUTETTU)

**Rakenne:**

```javascript
// dailies/archive.json
{
  "grids": [
    {
      "number": 1,
      "date": "2026-04-01",
      "type": "daily",            // "daily" | "special"
      "label": null,              // "Suomi 109" tms. special-grideissä
      "rows": ["FIN", "SWE", "RUS"],
      "cols": ["StanleyCup", "Hart", "ArtRoss"],
      "seed": 20260401            // fallback PRNG-seed jos grid on auto-generoitu
    },
    {
      "number": 2,
      "date": "2026-04-02",
      "type": "daily",
      ...
    }
  ]
}
```

**Arkkitehtuuripäätös**: gridit tulevat JSON-tiedostosta, eivät generoidu lennossa koodissa. Syyt:
- Admin-gridit (special) eivät voi olla koodissa
- Arkistointi vaatii pysyvää tallennusta
- Gridin validointi tehdään etukäteen, ei pelaajan selaimessa
- Koodin koko ei kasva gridien määrän myötä
- daily.html lataa `archive.json` CDN:ltä ja näyttää oikean gridin päivämäärän perusteella

**Pelaajan arkistonäkymä**: lista pelatuista ja pelaamattomista grideistä. Pelattujen kohdalla näkyy tulos (pisteet, streak). Vanhojen gridien pelaaminen on rajoittamaton (tai rewarded ad -muurin takana).

#### 7.3 Unlimited Random Grids (EI TOTEUTETTU)

Erillinen "Harjoittele" -tila: rajaton määrä satunnaisia gridejä. Tämä on monetisointikohta: ensimmäinen random-grid ilmainen, seuraavat rewarded ad -muurin takana.

Random-gridit eivät tallennu arkistoon eivätkä vaikuta streakiin.

---

## 8. Notifications (ilmoitukset)

PWA push-ilmoitukset Daily-muistutukseen: "Tämän päivän NHL Grid odottaa!" Vapaaehtoinen, pelaaja valitsee haluaako ilmoituksia. Lisätään myöhemmin kun pelaajamäärä kasvaa.

---

## 9. Analytics (käytön seuranta)

**Umami** (ilmainen, cookieton, GDPR-yhteensopiva). Seurattavat tapahtumat: päivittäiset pelaajat, pelimuotojen suosio, peliaika, streak-jakaumat, mobiili vs. desktop. Vaihtoehto: Cloudflare Analytics (sisäänrakennettu, ilmainen).

---

## Hosting & Deployment

### Tuotantopino

| Komponentti | Palvelu | Hinta |
|-------------|---------|-------|
| Hosting + CDN | Cloudflare Pages | Ilmainen (rajaton kaista) |
| Domain | .com / .fi (Namecheap/Spaceship) | ~$10-15/vuosi |
| Moninpeli | Firebase Realtime Database (Spark) | Ilmainen (100 yhteyttä) |
| Analytics | Umami free / Cloudflare Analytics | Ilmainen |
| SSL | Cloudflare (automaattinen) | Ilmainen |
| CI/CD | GitHub Actions (automaattinen deploy) | Ilmainen |

**Kokonaiskustannus: ~$1/kk** (vain domain)

### Deployment-flow

```
git push → GitHub repo (yksityinen)
              ↓ (webhook)
         Cloudflare Pages
              ↓ (build: none, output: /)
         Tuotantosivu live
```

Push = välitön päivitys. Ei build-vaihetta, ei odotusta. HTML-tiedostot serveerataan suoraan.

### Pelaajatietokannan automaattipäivitys (TODO)

```
GitHub Actions (viikottain, esim. ma klo 04:00)
  ↓
node fetch-raw.js          (hae uudet tiedot NHL API:sta)
  ↓
node build-players-db.js   (rakenna uusi players.js, audit)
  ↓
Jos audit OK → git commit + push → Cloudflare Pages deploy
Jos audit FAIL → lähetä notifikaatio ylläpitäjälle
```

### Migraatio GitHub Pages → oma domain

1. Osta domain (huom: "NHL" nimessä → tavaramerkkiriski. Turvallisempi: hockeygrid.com, kiekkogrid.fi tms.)
2. Luo Cloudflare-tili → lisää domain → vaihda nimipalvelimet
3. Yhdistä GitHub-repo Cloudflare Pagesiin (automaattinen deploy)
4. SSL aktivoituu automaattisesti
5. Luo Firebase-projekti → ota Realtime Database käyttöön
6. Vaihda repo yksityiseksi GitHubissa

---

## Roadmap (toteutusjärjestys)

### Vaihe 0 — Pelaajatietokannan korjaus (käynnissä)
- [x] ETL-pipeline rakennettu (fetch-raw.js, build-players-db.js)
- [x] Korjattu NHL API endpoint (/v1/player/{id}/landing)
- [ ] Awards-haku käynnissä (--awards-only, ~3h)
- [ ] Cup-rosterit (--cup-only)
- [ ] Kokoa ja rakenna uusi players.js
- [ ] Varmista audit: 0 menetettyjä pelaajia/palkintoja

### Vaihe 1 — Mobiilikorjaukset (1-2 päivää)
- [ ] Viewport meta: `interactive-widget=overlays-content`
- [ ] CSS: `100svh`, `touch-action: manipulation`, `overscroll-behavior: none`
- [ ] `visualViewport` API keyboard-korjaus
- [ ] Testaa molemmilla pelimuodoilla mobiilissa

### Vaihe 2 — Oma domain + Cloudflare Pages (1 päivä)
- [ ] Osta domain
- [ ] Cloudflare Pages setup (yhdistä GitHub-repo)
- [ ] DNS-konfigurointi
- [ ] Varmista HTTPS + automaattinen deploy toimii
- [ ] Vaihda GitHub-repo yksityiseksi

### Vaihe 3 — Firebase-moninpeli (2-3 päivää)
- [ ] Luo Firebase-projekti + Realtime Database
- [ ] Kirjoita Security Rules
- [ ] Korvaa PeerJS Firebase SDK:lla nhl-grid.html:ssä
- [ ] Poista PeerJS + STUN/TURN/ExpressTURN
- [ ] Testaa eri verkkoympäristöissä

### Vaihe 4 — PWA (1 päivä)
- [ ] manifest.json
- [ ] sw.js (cachea players.js, HTML-tiedostot, archive.json)
- [ ] PWA-ikonit (192px, 512px)
- [ ] Testaa "Add to Home Screen"

### Vaihe 5 — Daily Grid -arkistointi (2-3 päivää)
- [ ] Suunnittele archive.json -rakenne
- [ ] Migroi nykyinen PRNG-generointi → JSON-pohjaiseksi
- [ ] Rakenna arkistonäkymä daily.html:iin
- [ ] Gridien numerointi (Grid #1, Grid #2, ...)
- [ ] Vanhojen gridien pelaaminen

### Vaihe 6 — Admin Grid Builder (2-3 päivää)
- [ ] admin/grid-builder.html: visuaalinen grid-editori
- [ ] Validointi: oikeat vastaukset per ruutu, backtracking-tarkistus
- [ ] Riippuvuusnäkymä: kategoriaparien oikeiden vastausten määrä
- [ ] Special-gridien luonti ja tallennus
- [ ] Esikatselu

### Vaihe 7 — Monetisointi (1 päivä)
- [ ] AdSense-tilin haku
- [ ] CMP-ratkaisu (GDPR)
- [ ] Interstitial-mainokset (Daily-tuloksen jälkeen, ristinolla-erän välissä)
- [ ] Rewarded ad (ylimääräinen vinkki, arkistogridin avaus)

### Vaihe 8 — Automaattinen DB-päivitys (1 päivä)
- [ ] GitHub Actions workflow: viikottainen fetch + build + audit + deploy
- [ ] Notifikaatio audit-epäonnistumisesta

### Vaihe 9 — Analytics & hionta
- [ ] Umami / CF Analytics
- [ ] Streak-laskuri localStorage:en
- [ ] Push-ilmoitukset (vapaaehtoinen)
- [ ] Ko-fi-linkki
