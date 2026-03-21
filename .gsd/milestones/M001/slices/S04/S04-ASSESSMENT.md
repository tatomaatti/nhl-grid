# S04 Roadmap Assessment

**Verdict: No changes needed.**

S04 retired its risk cleanly — JS eriytetty 4 tiedostoon, HTML-tiedostot luettavia, verify-s04.sh 27/27 PASS. Kaikki S04:n tuotokset (shared.js, config.js, daily-game.js, grid-game.js) ovat S05:n käytettävissä.

## Success Criteria Coverage

Kaikki jäljellä olevat kriteerit (lokalisaatio FI/EN, steal-bugi, online-yhteysongelma) kuuluvat S05:lle. Valmiit kriteerit (mobiili-UX, duplikaatit, players.js rebuild, grid-generointi, JS-erotus, .gitignore, joukkuenimet/palkinnot) on todennettu S01–S04:ssä.

## Requirement Coverage

- R006 (lokalisaatio) → S05, active
- R010 (steal-bugi) → S05, active
- R011 (online-yhteys) → S05, active
- R001–R005, R012–R013 → validated (S01–S04)
- R014–R016 → deferred (post-M001)

Kattavuus on kunnossa. S05 on ainoa jäljellä oleva slice ja kattaa kaikki avoimet vaatimukset ja kriteerit.

## Forward Notes for S05

- Lokalisaatio: shared.js:n TEAMS/NATS/AWARDS name-kentät ovat englanniksi — S05 voi lisätä fi-käännökset näihin tai erilliseen tiedostoon
- Bugikorjaukset: steal-logiikka ja online-yhteyden timing ovat grid-game.js:ssä
- visualViewport-handler on sekä daily-game.js:ssä että grid-game.js:ssä — yhdistäminen mahdollista mutta ei pakollista
