#!/usr/bin/env node
/**
 * fetch-all-players.js  —  Comprehensive NHL Player Database Builder  (v2)
 * =========================================================================
 * Two-phase approach using the NHL Stats REST API:
 *   Phase A: /bios   → name, nationality, playerId  (per season)
 *   Phase B: /summary → playerId, teamAbbrevs        (per season)
 * Both are fetched per season and cached. Combine by playerId → full records.
 *
 * Fallback: uses api-web.nhle.com/v1/roster/{team}/{season} to catch any
 * players or team assignments the stats API misses.
 *
 * Usage:
 *   node fetch-all-players.js                # full fetch
 *   node fetch-all-players.js --merge-only   # skip API, assemble from cache
 *   node fetch-all-players.js --from 2005    # start from 2005-06 season
 *
 * Output:  players-full.js  (same format as players.js)
 * Cache:   .player-cache/   one JSON per season × endpoint
 *
 * Requires: Node.js 18+ (built-in fetch)
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR   = join(__dirname, '.player-cache');
const OUT_FILE    = join(__dirname, 'players-full.js');
const EXISTING_DB = join(__dirname, 'players.js');

// ── CLI flags ────────────────────────────────────────────────────────────────

const MERGE_ONLY = process.argv.includes('--merge-only');
const FROM_IDX   = process.argv.indexOf('--from');
const FROM_YEAR  = FROM_IDX !== -1 ? parseInt(process.argv[FROM_IDX + 1]) : null;

// ── Configuration ────────────────────────────────────────────────────────────

const DELAY_MS     = 2000;   // between API calls
const MAX_RETRIES  = 4;
const RETRY_BASE   = 5000;

const FIRST_SEASON = 1987;
const LAST_SEASON  = 2025;

const STATS_API = 'https://api.nhle.com/stats/rest/en';
const WEB_API   = 'https://api-web.nhle.com/v1';

// ── Team alias mapping ───────────────────────────────────────────────────────

const TEAM_ALIAS = {
  QUE:'COL', HFD:'CAR', ATL:'WPG', PHX:'UTA', ARI:'UTA', MNS:'DAL',
  WIN:'WPG', CLR:'COL', CGS:'CGY',
};

const VALID_TEAMS = new Set([
  'ANA','BOS','BUF','CGY','CAR','CHI','COL','CBJ',
  'DAL','DET','EDM','FLA','LAK','MIN','MTL','NSH',
  'NJD','NYI','NYR','OTT','PHI','PIT','SJS','SEA',
  'STL','TBL','TOR','UTA','VAN','VGK','WSH','WPG',
]);

const TEAM_CODES = [...VALID_TEAMS];

function resolveTeam(code) {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  const resolved = TEAM_ALIAS[upper] || upper;
  return VALID_TEAMS.has(resolved) ? resolved : null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeName(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u2032\u0060\u00B4]/g, "'")
    .toLowerCase().trim();
}

function natCode(cc) {
  if (!cc) return '';
  const M = {
    CAN:'CAN', USA:'USA', SWE:'SWE', FIN:'FIN', RUS:'RUS',
    CZE:'CZE', SVK:'SVK', DEU:'GER', GER:'GER', SUI:'SUI', CHE:'SUI',
    AUT:'AUT', NOR:'NOR', DNK:'DNK', LVA:'LVA', BLR:'BLR',
    FRA:'FRA', SVN:'SVN', KAZ:'KAZ', AUS:'AUS', GBR:'GBR',
    UKR:'UKR', LTU:'LTU', HRV:'HRV', POL:'POL', ITA:'ITA',
    JPN:'JPN', BRA:'BRA', NGA:'NGA', JAM:'JAM', HTI:'HTI',
    ZAF:'ZAF', KOR:'KOR', TWN:'TWN', CHN:'CHN', THA:'THA',
  };
  return M[cc.toUpperCase()] || cc.toUpperCase();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Season list ──────────────────────────────────────────────────────────────

function buildSeasonList() {
  const seasons = [];
  for (let y = FIRST_SEASON; y <= LAST_SEASON; y++) {
    if (FROM_YEAR && y < FROM_YEAR) continue;
    seasons.push({ id: `${y}${y + 1}`, label: `${y}-${String(y + 1).slice(2)}`, year: y });
  }
  return seasons;
}

// ── Cache ────────────────────────────────────────────────────────────────────

function ensureCache() { if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true }); }
function cacheFile(seasonId, type) { return join(CACHE_DIR, `${seasonId}-${type}.json`); }
function hasCached(seasonId, type) { return existsSync(cacheFile(seasonId, type)); }
function readCache(seasonId, type) { return JSON.parse(readFileSync(cacheFile(seasonId, type), 'utf8')); }
function writeCache(seasonId, type, data) { writeFileSync(cacheFile(seasonId, type), JSON.stringify(data), 'utf8'); }

// ── API fetch with retry ─────────────────────────────────────────────────────

async function fetchJSON(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'NHL-Grid-Game/2.0', 'Accept': 'application/json' },
      });
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        const wait = RETRY_BASE * Math.pow(2, attempt);
        console.log(`    ⏳ HTTP ${res.status}. Waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        if (attempt < retries) { await sleep(RETRY_BASE * Math.pow(2, attempt)); continue; }
        console.log(`    ✗ HTTP ${res.status} after ${retries + 1} attempts`);
        return null;
      }
      return await res.json();
    } catch (err) {
      if (attempt < retries) { await sleep(RETRY_BASE * Math.pow(2, attempt)); continue; }
      console.log(`    ✗ ${err.message}`);
      return null;
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE A: BIOS  (name + nationality + playerId)
// ══════════════════════════════════════════════════════════════════════════════

async function fetchSeasonBios(seasonId, type) {
  const url = `${STATS_API}/${type}/bios?isAggregate=false&isGame=false&limit=-1&start=0&cayenneExp=seasonId=${seasonId}%20and%20gameTypeId=2`;
  const data = await fetchJSON(url);
  if (!data || !data.data) return [];

  return data.data.map(p => {
    const name = type === 'skater'
      ? (p.skaterFullName || `${p.firstName || ''} ${p.lastName || ''}`.trim())
      : (p.goalieFullName || `${p.firstName || ''} ${p.lastName || ''}`.trim());
    return {
      name: name || '',
      nat: natCode(p.nationalityCode || p.birthCountryCode || ''),
      playerId: p.playerId || null,
      birthDate: p.birthDate || null,
    };
  }).filter(p => p.name.length > 1 && p.playerId);
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE B: SUMMARY  (playerId + teamAbbrevs per season)
// ══════════════════════════════════════════════════════════════════════════════

async function fetchSeasonSummary(seasonId, type) {
  const url = `${STATS_API}/${type}/summary?isAggregate=false&isGame=false&limit=-1&start=0&cayenneExp=seasonId=${seasonId}%20and%20gameTypeId=2`;
  const data = await fetchJSON(url);
  if (!data || !data.data) return [];

  return data.data.map(p => {
    const rawTeams = (p.teamAbbrevs || '').toString();
    const teams = rawTeams.split(',').map(t => resolveTeam(t.trim())).filter(Boolean);
    return {
      playerId: p.playerId || null,
      teams,
      // Summary also has the name — use as backup
      name: type === 'skater'
        ? (p.skaterFullName || '')
        : (p.goalieFullName || ''),
    };
  }).filter(p => p.playerId && p.teams.length > 0);
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE C: ROSTER SWEEP  (fallback for teams via api-web.nhle.com)
// ══════════════════════════════════════════════════════════════════════════════

async function fetchRosterSeasons(team) {
  const data = await fetchJSON(`${WEB_API}/roster-season/${team}`);
  return (Array.isArray(data) ? data : []).map(String);
}

async function fetchRoster(team, season) {
  const data = await fetchJSON(`${WEB_API}/roster/${team}/${season}`);
  if (!data) return [];
  const players = [];
  for (const grp of ['forwards', 'defensemen', 'goalies']) {
    for (const p of (data[grp] || [])) {
      const firstName = p.firstName?.default || '';
      const lastName  = p.lastName?.default || '';
      const name = `${firstName} ${lastName}`.trim();
      if (name && p.id) {
        players.push({ playerId: p.id, name, team: resolveTeam(team) });
      }
    }
  }
  return players;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function fetchAllData() {
  const seasons = buildSeasonList();
  ensureCache();

  const totalCalls = seasons.length * 4; // bios×2 + summary×2 per season
  console.log(`\n🏒 NHL All-Players Fetcher v2`);
  console.log(`   Seasons: ${seasons[0].label} → ${seasons[seasons.length - 1].label} (${seasons.length})`);
  console.log(`   Phase A (bios): ~${seasons.length * 2} calls`);
  console.log(`   Phase B (summary): ~${seasons.length * 2} calls`);
  console.log(`   Estimated time: ~${Math.ceil(totalCalls * DELAY_MS / 60000)} min (cached calls skipped)\n`);

  let fetched = 0, cached = 0;

  // Phase A: Bios
  console.log('── Phase A: Fetching bios (name + nationality) ──');
  for (const season of seasons) {
    for (const type of ['skater', 'goalie']) {
      const cacheKey = `${type}`;
      if (hasCached(season.id, cacheKey)) { cached++; continue; }

      process.stdout.write(`  ${season.label} ${type} bios... `);
      const players = await fetchSeasonBios(season.id, type);
      writeCache(season.id, cacheKey, players);
      console.log(`✓ ${players.length}`);
      fetched++;
      await sleep(DELAY_MS);
    }
  }

  // Phase B: Summary (team assignments)
  console.log('\n── Phase B: Fetching summary (team assignments) ──');
  for (const season of seasons) {
    for (const type of ['skater', 'goalie']) {
      const cacheKey = `${type}-summary`;
      if (hasCached(season.id, cacheKey)) { cached++; continue; }

      process.stdout.write(`  ${season.label} ${type} summary... `);
      const players = await fetchSeasonSummary(season.id, type);
      writeCache(season.id, cacheKey, players);
      console.log(`✓ ${players.length} with teams`);
      fetched++;
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n  API calls: ${fetched} | Cached: ${cached}`);

  // Phase C: Roster sweep (optional fallback — fills gaps)
  console.log('\n── Phase C: Roster sweep (api-web.nhle.com) ──');
  const rosterCacheKey = 'roster-sweep';
  if (hasCached('all', rosterCacheKey)) {
    console.log('  Using cached roster data.');
  } else {
    const rosterData = [];
    for (const team of TEAM_CODES) {
      process.stdout.write(`  ${team}... `);
      let teamSeasons;
      try {
        teamSeasons = await fetchRosterSeasons(team);
      } catch {
        teamSeasons = [];
      }
      // Filter seasons to our range
      teamSeasons = teamSeasons.filter(s => {
        const y = parseInt(s.substring(0, 4));
        return y >= FIRST_SEASON && y <= LAST_SEASON && (!FROM_YEAR || y >= FROM_YEAR);
      });

      let teamPlayers = 0;
      for (const season of teamSeasons) {
        const players = await fetchRoster(team, season);
        for (const p of players) {
          rosterData.push({ playerId: p.playerId, name: p.name, team: p.team, season });
        }
        teamPlayers += players.length;
        await sleep(300); // lighter delay for roster calls
      }
      console.log(`${teamSeasons.length} seasons, ${teamPlayers} entries`);
    }
    writeCache('all', rosterCacheKey, rosterData);
    console.log(`  Total roster entries: ${rosterData.length}`);
  }
}

function aggregateFromCache() {
  const seasons = buildSeasonList();
  // Master map: playerId → { name, teams: Set, nat }
  const byId = new Map();
  // Fallback map: normalized name → { name, teams: Set, nat }
  const byName = new Map();

  console.log('\n📦 Aggregating cached data...');

  // Step 1: Load bios → get name + nationality per playerId
  let bioRecords = 0;
  for (const season of seasons) {
    for (const type of ['skater', 'goalie']) {
      if (!hasCached(season.id, type)) continue;
      const data = readCache(season.id, type);
      for (const p of data) {
        bioRecords++;
        if (p.playerId && !byId.has(p.playerId)) {
          byId.set(p.playerId, {
            name: p.name,
            teams: new Set(),
            nat: p.nat || '',
            awards: [],
            birthDate: p.birthDate || null,
          });
        } else if (p.playerId && byId.has(p.playerId)) {
          // Update nat/birthDate if missing
          const existing = byId.get(p.playerId);
          if (!existing.nat && p.nat) existing.nat = p.nat;
          if (!existing.birthDate && p.birthDate) existing.birthDate = p.birthDate;
        }
      }
    }
  }
  console.log(`  Bios: ${bioRecords} records → ${byId.size} unique players`);

  // Step 2: Load summaries → add team assignments by playerId
  let summaryRecords = 0, teamsAssigned = 0;
  for (const season of seasons) {
    for (const type of ['skater', 'goalie']) {
      const cacheKey = `${type}-summary`;
      if (!hasCached(season.id, cacheKey)) continue;
      const data = readCache(season.id, cacheKey);
      for (const p of data) {
        summaryRecords++;
        if (p.playerId && byId.has(p.playerId)) {
          const existing = byId.get(p.playerId);
          for (const t of (p.teams || [])) {
            if (!existing.teams.has(t)) { existing.teams.add(t); teamsAssigned++; }
          }
        } else if (p.playerId) {
          // Player in summary but not in bios — add with name from summary
          byId.set(p.playerId, {
            name: p.name || `Player-${p.playerId}`,
            teams: new Set(p.teams || []),
            nat: '',
            awards: [],
            birthDate: null,
          });
        }
      }
    }
  }
  console.log(`  Summary: ${summaryRecords} records → ${teamsAssigned} team assignments`);

  // Step 3: Load roster sweep → add more team assignments
  if (hasCached('all', 'roster-sweep')) {
    const rosterData = readCache('all', 'roster-sweep');
    let rosterTeamsAdded = 0, rosterNewPlayers = 0;
    for (const entry of rosterData) {
      if (!entry.team) continue;
      if (entry.playerId && byId.has(entry.playerId)) {
        const existing = byId.get(entry.playerId);
        if (!existing.teams.has(entry.team)) { existing.teams.add(entry.team); rosterTeamsAdded++; }
      } else if (entry.playerId) {
        // New player from roster not in stats API at all
        byId.set(entry.playerId, {
          name: entry.name,
          teams: new Set([entry.team]),
          nat: '',  // will be filled from existing DB merge
          awards: [],
          birthDate: null,
        });
        rosterNewPlayers++;
      }
    }
    console.log(`  Roster: ${rosterData.length} entries → +${rosterTeamsAdded} teams, +${rosterNewPlayers} new players`);
  }

  // Build output map, disambiguating namesakes instead of merging them
  // Step 1: Group byId entries by normalized name
  const nameGroups = new Map(); // normName → [{ id, ...playerData }]
  for (const [id, p] of byId.entries()) {
    const key = normalizeName(p.name);
    if (!nameGroups.has(key)) nameGroups.set(key, []);
    nameGroups.get(key).push({ id, ...p });
  }

  // Step 2: For each group, decide display names
  let namesakeCount = 0;
  for (const [normName, group] of nameGroups.entries()) {
    if (group.length === 1) {
      // Unique name — use as-is
      const p = group[0];
      byName.set(normName, {
        name: p.name,
        teams: new Set(p.teams),
        nat: p.nat,
        awards: [...p.awards],
      });
    } else {
      // Namesakes — disambiguate with birth year (or full date if years collide)
      namesakeCount += group.length;
      const birthYears = group.map(p => p.birthDate ? p.birthDate.substring(0, 4) : null);
      const uniqueYears = new Set(birthYears.filter(Boolean));
      const yearsCollide = uniqueYears.size < birthYears.filter(Boolean).length;

      for (const p of group) {
        let suffix;
        if (p.birthDate && !yearsCollide) {
          // Birth years are unique among namesakes — use year
          suffix = p.birthDate.substring(0, 4);
        } else if (p.birthDate && yearsCollide) {
          // Same birth year — use full date YYYY-MM-DD
          suffix = p.birthDate.substring(0, 10);
        } else {
          // No birth date available — use playerId as last resort
          suffix = `#${p.id}`;
        }
        const displayName = `${p.name} (${suffix})`;
        const key = normalizeName(displayName);
        byName.set(key, {
          name: displayName,
          teams: new Set(p.teams),
          nat: p.nat,
          awards: [...p.awards],
        });
      }
    }
  }

  // Count players with teams
  const withTeams = [...byName.values()].filter(p => p.teams.size > 0).length;
  const noTeams   = [...byName.values()].filter(p => p.teams.size === 0).length;
  console.log(`\n  Unique players: ${byName.size} (${withTeams} with teams, ${noTeams} without)`);
  if (namesakeCount > 0) console.log(`  Namesakes disambiguated: ${namesakeCount} players`);

  return byName;
}

function loadExistingDB() {
  if (!existsSync(EXISTING_DB)) {
    console.log('  No existing players.js found.');
    return new Map();
  }
  try {
    const src = readFileSync(EXISTING_DB, 'utf8').replace(/^const DB/m, 'var DB');
    const ctx = {};
    vm.runInNewContext(src, ctx);
    const arr = Array.isArray(ctx.DB) ? ctx.DB : [];
    const map = new Map();
    for (const p of arr) {
      map.set(normalizeName(p.n), {
        name: p.n,
        teams: new Set(Array.isArray(p.t) ? p.t : []),
        nat: p.c || '',
        awards: Array.isArray(p.a) ? [...p.a] : [],
      });
    }
    console.log(`  Loaded ${map.size} players from existing players.js`);
    return map;
  } catch (err) {
    console.log(`  ⚠ Could not load players.js: ${err.message}`);
    return new Map();
  }
}

function mergeDBs(newPlayers, existingDB) {
  let merged = 0, teamsAdded = 0, awardsPreserved = 0, newFromExisting = 0, natFilled = 0;

  // Build reverse lookup: base name (without year suffix) → [keys in newPlayers]
  const baseNameToNew = new Map();
  for (const key of newPlayers.keys()) {
    // Strip "(YYYY)" or "(YYYY-MM-DD)" or "(#id)" suffix for matching
    const baseName = key.replace(/\s*\(.*?\)\s*$/, '').trim();
    if (!baseNameToNew.has(baseName)) baseNameToNew.set(baseName, []);
    baseNameToNew.get(baseName).push(key);
  }

  for (const [key, newP] of newPlayers.entries()) {
    // Try exact match first, then base name match for old DB entries without suffix
    const ex = existingDB.get(key) || existingDB.get(key.replace(/\s*\(.*?\)\s*$/, '').trim());
    if (!ex) continue;

    // If the existing DB entry matched by base name and there are multiple namesakes,
    // we can't safely assign awards/teams — they might belong to the wrong namesake.
    const baseName = key.replace(/\s*\(.*?\)\s*$/, '').trim();
    const namesakeKeys = baseNameToNew.get(baseName) || [];
    if (namesakeKeys.length > 1 && !existingDB.has(key)) {
      // Multiple namesakes but old DB had them merged — only merge nat, not teams/awards
      // (teams are already correct from API, awards would be ambiguous)
      if (!newP.nat && ex.nat) { newP.nat = ex.nat; natFilled++; }
      merged++;
      continue;
    }

    merged++;
    for (const t of ex.teams) if (!newP.teams.has(t) && VALID_TEAMS.has(t)) { newP.teams.add(t); teamsAdded++; }
    for (const a of ex.awards) if (!newP.awards.includes(a)) { newP.awards.push(a); awardsPreserved++; }
    if (!newP.nat && ex.nat) { newP.nat = ex.nat; natFilled++; }
  }

  for (const [key, ex] of existingDB.entries()) {
    if (!newPlayers.has(key)) {
      // Check if this old entry was a namesake that's now split
      const baseName = key;
      const namesakeKeys = baseNameToNew.get(baseName);
      if (namesakeKeys && namesakeKeys.length > 1) {
        // Old merged entry is now split — don't re-add the merged version
        continue;
      }
      newPlayers.set(key, {
        name: ex.name,
        teams: new Set(ex.teams),
        nat: ex.nat,
        awards: [...ex.awards],
      });
      newFromExisting++;
    }
  }

  console.log(`  Merge: ${merged} matched, +${teamsAdded} teams, +${awardsPreserved} awards, +${natFilled} nats, +${newFromExisting} existing-only`);
  return newPlayers;
}

function writeOutput(playersMap) {
  const all = [];
  for (const p of playersMap.values()) {
    const teams = [...p.teams].filter(t => VALID_TEAMS.has(t)).sort();
    if (teams.length === 0) continue;  // no valid NHL teams

    all.push({
      n: p.name,
      t: teams,
      c: p.nat,
      a: p.awards.length ? p.awards.sort() : undefined,
    });
  }

  all.sort((a, b) => a.n.localeCompare(b.n));

  const lines = all.map(p => {
    const aStr = p.a ? `, a:${JSON.stringify(p.a)}` : '';
    return `  { n:${JSON.stringify(p.n)}, t:${JSON.stringify(p.t)}, c:${JSON.stringify(p.c)}${aStr} }`;
  });

  const output =
`// players-full.js — NHL Player Database (Comprehensive)
// Auto-generated by fetch-all-players.js on ${new Date().toISOString().slice(0, 10)}
// ${all.length} players | Seasons: ${FIRST_SEASON}-${String(FIRST_SEASON + 1).slice(2)} → ${LAST_SEASON}-${String(LAST_SEASON + 1).slice(2)}
//
// Format: { n:"Name", t:["TEAM",...], c:"NAT", a:["Award",...] }

const DB = [
${lines.join(',\n')}
];
`;

  writeFileSync(OUT_FILE, output, 'utf8');
  console.log(`\n✅ Wrote ${OUT_FILE}`);
  console.log(`   ${all.length} players | ${(output.length / 1024).toFixed(1)} KB`);
  return all;
}

function validate(all) {
  console.log('\n════════════════════════ VALIDATION ════════════════════════');

  const natCount = {};
  for (const p of all) natCount[p.c] = (natCount[p.c] || 0) + 1;
  console.log('\nNationalities:');
  Object.entries(natCount).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  const teamCount = {};
  for (const p of all) for (const t of p.t) teamCount[t] = (teamCount[t] || 0) + 1;
  console.log('\nTeams (top 15):');
  Object.entries(teamCount).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([t, n]) => console.log(`  ${t}: ${n}`));

  console.log(`\nWith awards: ${all.filter(p => p.a).length}`);

  const spotCheck = [
    'Olli Jokinen', 'Jussi Jokinen', 'Mikko Koivu',
    'Valtteri Filppula', 'Niklas Hagman', 'Lauri Korpikoski',
    'Joni Pitkanen', 'Sami Salo', 'Kimmo Timonen',
    'Tuomo Ruutu', 'Jarkko Ruutu', 'Teppo Numminen',
    'Alex Ovechkin', 'Sidney Crosby', 'Wayne Gretzky',
    'Mario Lemieux', 'Patrick Roy', 'Martin Brodeur',
    'Jaromir Jagr', 'Peter Forsberg', 'Mats Sundin',
    'Teemu Selanne', 'Saku Koivu', 'Nicklas Lidstrom',
  ];

  const nameSet = new Set(all.map(p => normalizeName(p.n)));
  console.log('\nSpot-check:');
  let pass = 0;
  for (const name of spotCheck) {
    const found = nameSet.has(normalizeName(name));
    if (found) pass++;
    console.log(`  ${found ? '✓' : '✗'} ${name}`);
  }
  console.log(`  ${pass}/${spotCheck.length} found`);

  const finnCount = all.filter(p => p.c === 'FIN').length;
  console.log(`\n🇫🇮 Suomalaiset: ${finnCount}`);
  console.log('════════════════════════════════════════════════════════════');
}

// ══════════════════════════════════════════════════════════════════════════════
// RUN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  NHL All-Players Database Builder v2');
  console.log('  Phase A: bios (name+nat) | Phase B: summary (teams)');
  console.log('  Phase C: roster sweep (fallback)');
  console.log('═══════════════════════════════════════════════════════════════');

  if (!MERGE_ONLY) {
    await fetchAllData();
  } else {
    console.log('\n⏩ --merge-only: using cached data');
  }

  const newPlayers = aggregateFromCache();

  console.log('\n🔀 Merging with existing players.js...');
  const existingDB = loadExistingDB();
  const merged = mergeDBs(newPlayers, existingDB);

  const all = writeOutput(merged);
  validate(all);

  console.log('\n🏁 Valmis! Seuraavat askeleet:');
  console.log('   1. Tarkista players-full.js');
  console.log('   2. Jos OK: cp players-full.js players.js');
  console.log('   3. Avaa nhl-grid.html ja pelaa!\n');
}

main().catch(err => { console.error('\n💥 Fatal:', err); process.exit(1); });
