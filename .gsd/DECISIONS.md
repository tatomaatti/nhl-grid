# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001/S01 | pattern | Mobiili-virtuaalinäppäimistön käsittelytapa | visualViewport resize + translateY shift — ei scrollIntoView | scrollIntoView käyttäytyy arvaamattomasti eri selaimissa (iOS Safari vs Chrome). translateY antaa täyden hallinnan siirtymän määrään ja on ennustettava. Kynnysarvo 50px estää turhat triggerit. | Yes |
| D002 | M001 | architecture | GSD taskien isolation-malli | none — ei worktreeta eikä milestone-branchia | Pieni projekti, yksi aktiivinen kehittäjä, OneDrive-sijainti tekee worktree-mallista ongelmallisen | Yes |
| D003 | M001/S02 | data-pipeline | Mistä position/shootsCatches-data poimitaan assemblyssa | Awards-cachen landing-sivuilta (Phase 3, .player-cache/_awards/{id}.json) — ei Phase 1 bios-cachesta | Phase 1 bios-cache ei sisällä position/shoots-kenttiä (vanha cache-formaatti). Landing-sivujen awards-cache sisältää nämä kentät kaikille 5880 pelaajalle. Append-only: enrichment data ei poista mitään olemassaolevaa. | Yes |
| D004 | M001/S03 | pattern | PLAYABLE_AWARDS-filtteröinnin sidonta AWARDS-objektiin | PLAYABLE_AWARDS = new Set(Object.keys(AWARDS)) — automaattisesti synkronissa AWARDS-objektin avainten kanssa | Välttyy manuaaliselta listan ylläpidolta. Uuden pelattavan palkinnon lisääminen AWARDS-objektiin aktivoi sen filtterissä automaattisesti. Ei-pelattavat palkinnot (LadyByng, Masterton jne.) eivät ole AWARDS-objektissa, joten ne filtteröityvät pois luonnostaan. | Yes |
