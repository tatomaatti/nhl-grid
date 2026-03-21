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

## K010 — visualViewport-näppäimistön käsittely
- Käytä `visualViewport.resize`-eventtiä, EI `scrollIntoView`:ta (epäluotettava selainten välillä)
- Laske näppäimistön korkeus: `window.innerHeight - visualViewport.height`
- Kynnysarvo 50px — pienemmät muutokset ovat osoitepalkin kutistumista, eivät näppäimistöä
- Siirrä elementtiä `translateY(-Npx)` missä N on suhteessa näppäimistön korkeuteen
- `[MobileUX]`-prefixi konsolilokissa — filtteröi DevToolsissa
- Identtinen logiikka daily.html:ssä ja index.html:ssä — S04:n JS-erotuksessa yhdistetään

## K011 — Touch target audit
- iOS/Android minimum: 44×44px (Apple HIG / Material)
- index.html:n pieniä painikkeita jotka tarvitsivat korjausta: steal-count (36px), weight (30px), hint-btn (26px), surrender (~34px), lobby-back (~30px)
- Tarkista aina computed styles, ei vain CSS-sääntöjä — padding, margin ja line-height vaikuttavat todelliseen kokoon

## K012 — players.js vs players-full.js formaattieroavaisuus grepissä
- players.js ja players-full.js käyttävät unquoted JS-avaimia: `{n:"Name", t:["T1"], p:"C", h:"L"}`
- `grep -c '"p":' players-full.js` EI täsmää — oikea: `grep -c ' p:"' players-full.js`
- Luotettavin tapa tarkistaa: `vm.runInNewContext` Node.js:ssä (parsii JS:n oikein)

## K013 — Bio enrichment kattavuus awards-cachesta
- Awards-cachen landing-sivuilla position/shootsCatches/birthDate 5749/5746/5699 pelaajalle (5880:sta)
- 131 pelaajaa ilman position-dataa — historiallisia pelaajia joiden NHL API ei palauta kenttää
- Enrichment poimii dataa KAIKILLE cachetuille pelaajille, ei vain palkituille (irrotettu awards-ehdosta D003)

## K014 — players.js vm-sandbox lataus Node.js:ssä vaatii const→var korvauksen
- players.js alkaa `const DB = [...]` — vm.runInNewContext ei tue const:ia globaalina
- Korvaa `const DB` → `var DB` ennen evaluointia: `code.replace('const DB', 'var DB')`
- Jos DB-muuttujan nimi muuttuu, lataus rikkoutuu — tarkista aina vm-sandboxia käyttävät skriptit
- Toteutettu test-grid-gen.js:ssä (S03/T01)

## K015 — test-grid-gen.js kopioi generoinnin logiikan daily.html:stä
- Testiskripti sisältää kopion daily.html:n grid-generointifunktioista (ei importoi niitä)
- Jos daily.html:n generointia muutetaan, test-grid-gen.js pitää päivittää manuaalisesti
- S04:n JS-erotuksessa nämä voidaan yhdistää yhteiseksi moduuliksi → importointi testiskriptiin

## K016 — Node.js const-validointi: eval ei toimi, käytä Function-konstruktoria
- `eval(code)` ei vuoda `const`-muuttujia scopeen Node.js:ssä → ReferenceError
- `vm.createContext` + `vm.runInContext` ei myöskään aseta `const`:ia kontekstin propertyiksi
- Toimiva tapa: `new Function(code + '; return {VAR1, VAR2};')()` — const näkyy funktion sisällä
- Selaimessa `<script src>` toimii normaalisti const:lla — ongelma on vain Node.js-validoinnissa

## K017 — Windows Git Bash -yhteensopivuus verify-skripteissä
- `grep -P` (PCRE) ei tuettu Git Bashin grepissä — käytä `sed` tai `grep -E` (ERE)
- `wc -l` tuottaa `\r\n`-rivinvaihtoja → `[ "$VAR" -eq 0 ]` rikkoutuu — putki `tr -d '\r'` tai `sed`
- Skriptien testauksessa huomioi aina Git Bash vs Linux bash -erot

## K018 — JS-erotuksen jälkeinen tiedostorakenne ja latausjärjestys
- daily.html: players.js (head) → shared.js → lang.js → daily-game.js (ennen </body>)
- index.html: players.js (head) → shared.js → lang.js → config.js → peerjs CDN → grid-game.js (ennen </body>)
- DB-puuttumisen tarkistus kunkin game-tiedoston alussa: `if (typeof DB === 'undefined')` → throw + DOM-virheilmoitus
- Kategoriadata (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS) vain shared.js:ssä — ei duplikaatteja
- test-grid-gen.js kopioi edelleen generointilogiikan — EI importoi daily-game.js:stä (K015 edelleen voimassa)

## K019 — Emoji multi-byte collisions Finnish character grep checks
- Emoji kuten ❤️, ℹ︎, 🤝 sisältävät tavuja jotka osuvat `[äöÄÖ]` grep-patterniin
- verify-s05.sh:ssä tarvitaan `grep -v "❤" | grep -v "ℹ" | grep -v "🤝"` poistamaan false positivet
- Tämä on Git Bash -spesifinen — Linux grep Unicode-modessa ei välttämättä tuota samaa ongelmaa

## K020 — CSS style.display vs offsetParent näkyvyyden tarkistus
- `element.style.display` palauttaa vain inline-tyylien arvon, ei CSS-luokkien
- Jos elementti on piilotettu CSS:llä (display:none CSS-säännössä), `style.display` on `""` (tyhjä), EI `"none"`
- `offsetParent !== null` on luotettavampi näkyvyystarkistus — palauttaa null jos elementti tai vanhempi on piilotettu

## K021 — Lokalisaatioarkkitehtuuri (lang.js)
- `lang.js` latautuu shared.js:n jälkeen, ennen game-tiedostoja
- Staattinen teksti: `data-i18n="key"` attribuutti HTML-elementissä → `applyLanguage()` päivittää
- Dynaaminen teksti: `t("key", ...args)` kutsu JS:ssä, `{0}`/`{1}` parametrisubstituutio
- Input-placeholderit: `data-i18n-placeholder="key"` → applyLanguage päivittää `.placeholder`
- Kielenvaihto: `setLang("fi"|"en")` → päivittää localStorage + DOM + dispatch `langChanged`
- Game-tiedostojen tulee kuunnella `langChanged`-eventtiä ja päivittää dynaamiset tekstit
- Kategoriadata (TEAMS/NATS/AWARDS) lokalisoitu `catLang(info)` -apufunktiolla shared.js:ssä, ei STRINGS-sanakirjasta
- `_t(key)` fallback-funktio DB-virheille kun lang.js ei ole vielä ladattu

## K022 — Online-pelin READY-handshake
- Guest lähettää `{type:'READY'}` kun data channel avautuu
- Host odottaa READY-viestiä ennen `startOnlineRound()`-kutsua
- 15s fallback timeout — jos READY ei tule, peli alkaa silti
- Korvasi aiemman epäluotettavan 500ms setTimeout-ratkaisun
- `[PeerJS]`-prefixi kaikissa yhteyslogeissa konsolissa
