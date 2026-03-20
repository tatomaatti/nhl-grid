# Knowledge

## K001 — NHL API endpoint oikea muoto palkintohaulle
- `/v1/player/{id}/landing` toimii (sisältää awards-kentän)
- `/v1/player/{id}/awards` **EI toimi** (palauttaa 404)
- Smart quote -normalisointi vaaditaan palkintonimiä verratessa (U+201C/U+201D → ")

## K002 — Team alias mapping
- PHX→UTA, ARI→UTA, ATL→WPG, HFD→CAR, QUE→COL, MNS→DAL, WIN→WPG, CLR→COL, CGS→CGY
- Tämä mapping pitää olla identtinen fetch-raw.js, build-players-db.js JA pelikoodissa

## K003 — Namesake-käytäntö
- Syntymävuosi-suffiksi: `"Matt Murray (1994)"`
- Jos vuodetkin sama: täysi päivämäärä `"Petr Svoboda (1966-02-14)"`
- Toteutettu build-players-db.js:ssä

## K004 — Daily Grid seed
- Epoch: 2026-03-15 (Grid #1)
- Seed: `NHLGRID{year}{month}{date}` → DJB2 hash → Mulberry32 PRNG
- Muutokset seediin rikkovat kaikkien pelaajien historian — EI saa muuttaa

## K005 — OneDrive-sijainti
- Projekti on `C:\Users\tatu_\OneDrive\Työpöytä\Aivot\Hockeygrid`
- Git worktree ei toimi hyvin OneDrive-synkronoinnin kanssa
- Käytetään GSD isolation mode: none

## K006 — ExpressTURN-tunnukset HTML:ssä
- nhl-grid.html sisältää kovakoodattuja STUN/TURN-tunnuksia
- Tämä on väliaikainen — poistuu Firebase-siirtymässä
- Ei turvallisuusriski koska repo on yksityinen ja ilmaistason quota

## K007 — Tunnetut bugit (käyttäjäraportti 2026-03-21)
- Ristinolla: pelaaja 2:n steals ei kulu käytettäessä
- Online-peli: ensimmäinen peli katkeaa lähes aina, sivunpäivitys korjaa
- Molemmat korjataan S05:ssä

## K008 — Pelissä olevat vs ei-pelissä-olevat palkinnot
- PELISSÄ (arvattavina kategorioina): Hart, Vezina, Norris, StanleyCup, Calder, RocketRichard, ConnSmythe, ArtRoss, TedLindsay, Selke
- EI PELISSÄ (piilotetaan UI:sta): JackAdams, LadyByng, Masterton, Jennings, KingClancy, MessierLeadership
- Piilotetut palkinnot SÄILYVÄT players.js:ssä — filtteri on vain UI-tasolla

## K009 — Lokalisaatio
- Oletuskieli: navigator.language → "fi" jos alkaa "fi", muuten "en"
- Kielivalinta tallennetaan localStorage:en
- Joukkuenimet ovat aina englanniksi (NHL-vakio), kansallisuudet lokalisoidaan
