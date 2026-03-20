#!/usr/bin/env node
/**
 * migrate-to-raw.js — One-time migration: existing cache + players.js → players-raw.json
 * This creates the initial players-raw.json from the old pipeline data.
 * After this, fetch-raw.js takes over for future updates.
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '.player-cache');
const PLAYERS_JS = join(__dirname, 'players.js');
const RAW_FILE = join(__dirname, 'players-raw.json');

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

function normalizeName(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u2032\u0060\u00B4]/g, "'")
    .toLowerCase().trim();
}

function main() {
  console.log('🔄 Migrating existing data to players-raw.json...\n');

  const players = {};
  const seasons = [];
  for (let y = 1987; y <= 2025; y++) {
    seasons.push({ id: `${y}${y+1}`, label: `${y}-${String(y+1).slice(2)}` });
  }

  // Read from cache (bios + summaries)
  let cacheHits = 0;
  for (const season of seasons) {
    for (const type of ['skater', 'goalie']) {
      const bioFile = join(CACHE_DIR, `${season.id}-${type}.json`);
      if (existsSync(bioFile)) {
        const bios = JSON.parse(readFileSync(bioFile, 'utf8'));
        for (const p of bios) {
          if (!p.playerId) continue;
          const id = String(p.playerId);
          if (!players[id]) {
            players[id] = {
              name: p.name || '',
              birthDate: p.birthDate || null,
              nationality: p.nat || '',
              position: p.position || null,
              shoots: p.shoots || null,
              teams: [],
              seasons: [],
              awards: {},
            };
          }
          const rec = players[id];
          if (p.birthDate && !rec.birthDate) rec.birthDate = p.birthDate;
          if (p.nat && !rec.nationality) rec.nationality = p.nat;
          if (p.position && !rec.position) rec.position = p.position;
          if (p.shoots && !rec.shoots) rec.shoots = p.shoots;
          if (!rec.seasons.includes(season.label)) rec.seasons.push(season.label);
          cacheHits++;
        }
      }

      const sumFile = join(CACHE_DIR, `${season.id}-${type}-summary.json`);
      if (existsSync(sumFile)) {
        const sums = JSON.parse(readFileSync(sumFile, 'utf8'));
        for (const p of sums) {
          if (!p.playerId) continue;
          const id = String(p.playerId);
          if (!players[id]) continue;
          for (const t of (p.teams || [])) {
            const resolved = TEAM_ALIAS[t] || t;
            if (VALID_TEAMS.has(resolved) && !players[id].teams.includes(resolved)) {
              players[id].teams.push(resolved);
            }
          }
        }
      }
    }
  }
  console.log(`  From cache: ${Object.keys(players).length} players (${cacheHits} bio records)`);

  // Read awards from existing players.js (the ONLY source of awards currently)
  const src = readFileSync(PLAYERS_JS, 'utf8').replace(/^const DB/m, 'var DB');
  const ctx = {};
  vm.runInNewContext(src, ctx);
  const oldDB = ctx.DB || [];

  // Build name→id index from players (for matching old DB entries by name)
  const nameToIds = new Map();
  for (const [id, rec] of Object.entries(players)) {
    const key = normalizeName(rec.name);
    if (!nameToIds.has(key)) nameToIds.set(key, []);
    nameToIds.get(key).push(id);
  }

  let awardsMigrated = 0;
  let playersAddedFromOldDB = 0;

  for (const entry of oldDB) {
    const baseName = entry.n.replace(/\s*\(.*?\)\s*$/, '').trim();
    const key = normalizeName(baseName);
    const ids = nameToIds.get(key);

    if (!ids || ids.length === 0) {
      // Player only exists in old DB, not in cache — add them
      // Use a synthetic ID
      const syntheticId = `old-${normalizeName(entry.n).replace(/\s/g,'-')}`;
      players[syntheticId] = {
        name: entry.n,
        birthDate: null,
        nationality: entry.c || '',
        position: null,
        shoots: null,
        teams: Array.isArray(entry.t) ? [...entry.t] : [],
        seasons: [],
        awards: {},
      };
      if (entry.a) {
        for (const a of entry.a) {
          players[syntheticId].awards[a] = { sources: ['old-players-js'] };
        }
        awardsMigrated++;
      }
      playersAddedFromOldDB++;
      continue;
    }

    if (!entry.a || entry.a.length === 0) continue;

    if (ids.length === 1) {
      // Unique match — safe to assign all awards
      const rec = players[ids[0]];
      for (const a of entry.a) {
        if (!rec.awards[a]) rec.awards[a] = { sources: [] };
        if (!rec.awards[a].sources.includes('old-players-js')) {
          rec.awards[a].sources.push('old-players-js');
        }
      }
      awardsMigrated++;
    } else {
      // Multiple players with same name — try to match by year suffix
      const yearMatch = entry.n.match(/\((\d{4})\)/);
      if (yearMatch) {
        const year = yearMatch[1];
        const matched = ids.find(id => players[id].birthDate && players[id].birthDate.startsWith(year));
        if (matched) {
          const rec = players[matched];
          for (const a of entry.a) {
            if (!rec.awards[a]) rec.awards[a] = { sources: [] };
            if (!rec.awards[a].sources.includes('old-players-js')) {
              rec.awards[a].sources.push('old-players-js');
            }
          }
          awardsMigrated++;
        } else {
          console.log(`  ⚠ Namesake ${entry.n}: no birth year match for ${year} among IDs: ${ids.join(',')}`);
        }
      } else {
        // No year suffix on namesake — can't safely assign. Log warning.
        console.log(`  ⚠ Namesake ${baseName}: ${ids.length} candidates, awards ambiguous: ${entry.a.join(',')}`);
      }
    }
  }

  console.log(`  Awards migrated: ${awardsMigrated} players`);
  console.log(`  Players added from old DB only: ${playersAddedFromOldDB}`);

  // Write output
  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      seasons: seasons.map(s => s.label),
      playerCount: Object.keys(players).length,
      pipeline: 'migrate-to-raw.js (one-time migration)',
      note: 'Awards from old players.js only. Run fetch-raw.js --awards-only to enrich from API.',
    },
    players,
  };

  writeFileSync(RAW_FILE, JSON.stringify(output, null, 2), 'utf8');
  const sizeMB = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(1);
  console.log(`\n✅ Written: players-raw.json (${Object.keys(players).length} players, ${sizeMB} MB)`);

  // Spot-check
  console.log('\n🔍 Spot-check:');
  const checks = ['Wayne Gretzky', 'Sidney Crosby', 'Kimmo Timonen', 'Mario Lemieux', 'Teemu Selanne'];
  for (const name of checks) {
    const key = normalizeName(name);
    const ids = nameToIds.get(key);
    if (ids) {
      for (const id of ids) {
        const p = players[id];
        const awards = Object.keys(p.awards);
        console.log(`  ${p.name} (${id}): teams=${p.teams.join(',')} awards=${awards.length > 0 ? awards.join(',') : 'NONE'}`);
      }
    } else {
      const synId = `old-${normalizeName(name).replace(/\s/g,'-')}`;
      const p = players[synId];
      if (p) {
        const awards = Object.keys(p.awards);
        console.log(`  ${p.name} (${synId}): teams=${p.teams.join(',')} awards=${awards.length > 0 ? awards.join(',') : 'NONE'}`);
      } else {
        console.log(`  ${name}: NOT FOUND`);
      }
    }
  }
}

main();
