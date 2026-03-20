# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001/S01 | pattern | Mobiili-virtuaalinäppäimistön käsittelytapa | visualViewport resize + translateY shift — ei scrollIntoView | scrollIntoView käyttäytyy arvaamattomasti eri selaimissa (iOS Safari vs Chrome). translateY antaa täyden hallinnan siirtymän määrään ja on ennustettava. Kynnysarvo 50px estää turhat triggerit. | Yes |
| D002 | M001 | architecture | GSD taskien isolation-malli | none — ei worktreeta eikä milestone-branchia | Pieni projekti, yksi aktiivinen kehittäjä, OneDrive-sijainti tekee worktree-mallista ongelmallisen | Yes |
