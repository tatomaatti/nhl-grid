# Decisions

## D001 — Single-file HTML säilytetään perusrakenteena
- Scope: architecture
- Decision: Pidetään daily.html ja nhl-grid.html single-file-muodossa, mutta erotetaan JS erillisiin tiedostoihin
- Choice: JS eriytetään `<script src>`-tagilla, CSS pysyy HTML:n sisällä
- Rationale: ~2300 rivin single-file on ylläpidon rajalla. JS-erotus pienentää tiedostoja ~40% ja mahdollistaa jaetun koodin. Framework-siirtymä (Astro/React) olisi ylimitoitettu tälle skaalle.
- When: M001
- Revisable: Yes

## D002 — index.html on kanoninen, nhl-grid.html redirect
- Scope: architecture
- Decision: Kumpi tiedosto on pääsivulla?
- Choice: index.html on kanoninen ristinollatiedosto, nhl-grid.html korvataan redirectillä
- Rationale: index.html on GitHub Pagesin oletussivu. Duplikaatin ylläpito on riski.
- When: M001
- Revisable: Yes

## D003 — Isolation mode: none
- Scope: architecture
- Decision: GSD taskien isolation-malli
- Choice: none — ei worktreeta eikä milestone-branchia
- Rationale: Pieni projekti, yksi aktiivinen kehittäjä, OneDrive-sijainti tekee worktree-mallista ongelmallisen
- When: M001
- Revisable: Yes
