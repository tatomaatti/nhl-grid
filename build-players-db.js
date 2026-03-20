#!/usr/bin/env node
/**
 * build-players-db.js  —  NHL Game Database Builder (v2 Pipeline Stage 2)
 * =========================================================================
 * Reads players-raw.json + overrides.json → produces players.js
 *
 * This is a pure transformation — no API calls, runs anywhere (VM or local).
 *
 * Features:
 *   - Namesake disambiguation (birth year suffix, full date if years collide)
 *   - Team alias normalization (PHX→UTA, ATL→WPG, etc.)
 *   - Award flattening (from source-tracked → simple array)
 *   - Override application (append-only: overrides only ADD data)
 *   - Audit report (before/after diff, missing data warnings)
 *
 * Usage:
 *   node build-players-db.js                  # build from players-raw.json
 *   node build-players-db.js --audit-only     # just show audit, don't write
 *   node build-players-db.js --include-extra  # include position, shoots in output
 *
 * Input:  players-raw.json, overrides.json (optional)
 * Output: players.js
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_FILE       = join(__dirname, 'players-raw.json');
const OVERRIDES_FILE = join(__dirname, 'overrides.json');
const OUTPUT_FILE    = join(__dirname, 'players.js');

const AUDIT_ONLY    = process.argv.includes('--audit-only');
const INCLUDE_EXTRA = process.argv.includes('--include-extra');

// ── Team validation ──────────────────────────────────────────────────────────
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
function resolveTeam(code) {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  const resolved = TEAM_ALIAS[upper] || upper;
  return VALID_TEAMS.has(resolved) ? resolved : null;
}

// ── Name normalization ───────────────────────────────────────────────────────
function normalizeName(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u2032\u0060\u00B4]/g, "'")
    .toLowerCase().trim();
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1: Load raw data
// ══════════════════════════════════════════════════════════════════════════════
function loadRawData() {
  if (!existsSync(RAW_FILE)) {
    console.error(`❌ ${RAW_FILE} not found. Run fetch-raw.js first.`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(RAW_FILE, 'utf8'));
  console.log(`📦 Loaded raw data: ${Object.keys(raw.players).length} players`);
  console.log(`   Last updated: ${raw.meta?.lastUpdated || 'unknown'}`);
  return raw.players;
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2: Load overrides (append-only)
// ══════════════════════════════════════════════════════════════════════════════
function loadOverrides() {
  if (!existsSync(OVERRIDES_FILE)) {
    console.log('📝 No overrides.json found (optional)');
    return { byId: {}, byName: {} };
  }
  const data = JSON.parse(readFileSync(OVERRIDES_FILE, 'utf8'));
  console.log(`📝 Loaded overrides: ${Object.keys(data.byId || {}).length} by ID, ${Object.keys(data.byName || {}).length} by name`);
  return {
    byId: data.byId || {},
    byName: data.byName || {},
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 3: Apply overrides (append-only — never remove data)
// ══════════════════════════════════════════════════════════════════════════════
function applyOverrides(players, overrides) {
  let applied = 0;

  // By ID
  for (const [id, ov] of Object.entries(overrides.byId)) {
    if (!players[id]) continue;
    const rec = players[id];

    if (ov.awards) {
      for (const award of ov.awards) {
        if (!rec.awards[award]) rec.awards[award] = { sources: [] };
        if (!rec.awards[award].sources.includes('override')) {
          rec.awards[award].sources.push('override');
        }
      }
      applied++;
    }
    if (ov.teams) {
      for (const t of ov.teams) {
        const resolved = resolveTeam(t);
        if (resolved && !rec.teams.includes(resolved)) rec.teams.push(resolved);
      }
    }
    if (ov.nationality && !rec.nationality) rec.nationality = ov.nationality;
  }

  // By name (fuzzy match)
  const nameIndex = new Map();
  for (const [id, rec] of Object.entries(players)) {
    nameIndex.set(normalizeName(rec.name), id);
  }

  for (const [name, ov] of Object.entries(overrides.byName)) {
    const id = nameIndex.get(normalizeName(name));
    if (!id) {
      console.log(`    ⚠ Override by name "${name}" — player not found`);
      continue;
    }
    const rec = players[id];
    if (ov.awards) {
      for (const award of ov.awards) {
        if (!rec.awards[award]) rec.awards[award] = { sources: [] };
        if (!rec.awards[award].sources.includes('override')) {
          rec.awards[award].sources.push('override');
        }
      }
      applied++;
    }
    if (ov.teams) {
      for (const t of ov.teams) {
        const resolved = resolveTeam(t);
        if (resolved && !rec.teams.includes(resolved)) rec.teams.push(resolved);
      }
    }
  }

  console.log(`  Applied ${applied} overrides`);
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 4: Namesake disambiguation
// ══════════════════════════════════════════════════════════════════════════════
function disambiguateNamesakes(players) {
  // Group by normalized name
  const nameGroups = new Map();
  for (const [id, rec] of Object.entries(players)) {
    const key = normalizeName(rec.name);
    if (!nameGroups.has(key)) nameGroups.set(key, []);
    nameGroups.get(key).push({ id, ...rec });
  }

  const displayNames = new Map(); // id → display name
  let namesakeCount = 0;

  for (const [key, group] of nameGroups.entries()) {
    if (group.length === 1) {
      // Unique name — use as-is
      displayNames.set(group[0].id, group[0].name);
      continue;
    }

    namesakeCount++;

    // Multiple players with same name — disambiguate
    const birthYears = group.map(p => p.birthDate ? p.birthDate.substring(0, 4) : null);
    const uniqueYears = new Set(birthYears.filter(Boolean));

    if (uniqueYears.size === group.length && birthYears.every(Boolean)) {
      // All have unique birth years
      for (const p of group) {
        displayNames.set(p.id, `${p.name} (${p.birthDate.substring(0, 4)})`);
      }
    } else {
      // Birth years collide or missing — use full date or ID fallback
      for (const p of group) {
        if (p.birthDate) {
          displayNames.set(p.id, `${p.name} (${p.birthDate})`);
        } else {
          displayNames.set(p.id, `${p.name} (#${p.id})`);
        }
      }
    }
  }

  console.log(`  Namesake groups: ${namesakeCount} (${displayNames.size} total players)`);
  return displayNames;
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 5: Build output
// ══════════════════════════════════════════════════════════════════════════════
function buildOutput(players, displayNames) {
  const result = [];

  for (const [id, rec] of Object.entries(players)) {
    const teams = rec.teams
      .map(t => resolveTeam(t))
      .filter(Boolean);
    const uniqueTeams = [...new Set(teams)].sort();

    if (uniqueTeams.length === 0) continue; // No valid NHL teams

    // Flatten awards (source-tracked → simple array)
    const awards = Object.keys(rec.awards || {}).sort();

    const entry = {
      n: displayNames.get(id) || rec.name,
      t: uniqueTeams,
      c: rec.nationality || '',
    };

    if (awards.length > 0) entry.a = awards;

    // Optional extra fields
    if (INCLUDE_EXTRA) {
      if (rec.position) entry.p = rec.position;
      if (rec.shoots) entry.h = rec.shoots;
    }

    result.push(entry);
  }

  result.sort((a, b) => a.n.localeCompare(b.n));
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 6: Write output file
// ══════════════════════════════════════════════════════════════════════════════
function writeOutput(entries) {
  const lines = entries.map(p => {
    let parts = `n:${JSON.stringify(p.n)}, t:${JSON.stringify(p.t)}, c:${JSON.stringify(p.c)}`;
    if (p.a) parts += `, a:${JSON.stringify(p.a)}`;
    if (p.p) parts += `, p:${JSON.stringify(p.p)}`;
    if (p.h) parts += `, h:${JSON.stringify(p.h)}`;
    return `  { ${parts} }`;
  });

  const header = [
    `// players.js — NHL Player Database`,
    `// Built by build-players-db.js on ${new Date().toISOString().split('T')[0]}`,
    `// ${entries.length} players | Source: players-raw.json + overrides.json`,
    `//`,
    `// Format: { n:"Name", t:["TEAM",...], c:"NAT", a:["Award",...] }`,
    `// Optional: p:"Position", h:"Handedness"`,
    ``,
    `const DB = [`,
  ].join('\n');

  const footer = `\n];\n`;
  const content = header + lines.join(',\n') + footer;

  writeFileSync(OUTPUT_FILE, content, 'utf8');
  const sizeMB = (Buffer.byteLength(content) / 1024 / 1024).toFixed(1);
  console.log(`\n✅ Written: players.js (${entries.length} players, ${sizeMB} MB)`);
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 7: Audit — compare with existing players.js (if present)
// ══════════════════════════════════════════════════════════════════════════════
function audit(newEntries) {
  console.log('\n🔍 AUDIT REPORT');
  console.log('═══════════════\n');

  // Stats for new DB
  const newWithAwards = newEntries.filter(p => p.a && p.a.length > 0);
  const awardCounts = {};
  for (const p of newEntries) {
    if (p.a) for (const a of p.a) awardCounts[a] = (awardCounts[a] || 0) + 1;
  }

  console.log(`New DB: ${newEntries.length} players, ${newWithAwards.length} with awards`);
  console.log('Award counts:');
  for (const [a, c] of Object.entries(awardCounts).sort((x, y) => y[1] - x[1])) {
    console.log(`  ${a}: ${c}`);
  }

  // Compare with existing players.js
  if (existsSync(OUTPUT_FILE)) {
    try {
      const oldSrc = readFileSync(OUTPUT_FILE, 'utf8').replace(/^const DB/m, 'var DB');
      const ctx = {};
      vm.runInNewContext(oldSrc, ctx);
      const oldDB = Array.isArray(ctx.DB) ? ctx.DB : [];

      const oldWithAwards = oldDB.filter(p => p.a && p.a.length > 0);
      console.log(`\nOld DB: ${oldDB.length} players, ${oldWithAwards.length} with awards`);

      // Check for data LOSS (old had it, new doesn't)
      const newNames = new Set(newEntries.map(p => p.n));
      const oldNames = new Set(oldDB.map(p => p.n));

      const lost = oldDB.filter(p => !newNames.has(p.n));
      const gained = newEntries.filter(p => !oldNames.has(p.n));

      if (lost.length > 0) {
        console.log(`\n⚠ PLAYERS LOST (${lost.length}):`);
        for (const p of lost.slice(0, 20)) {
          console.log(`  - ${p.n} (${p.t.join(',')}) ${p.a ? 'awards:' + p.a.join(',') : ''}`);
        }
        if (lost.length > 20) console.log(`  ... and ${lost.length - 20} more`);
      }

      if (gained.length > 0) {
        console.log(`\n✓ PLAYERS GAINED: +${gained.length}`);
      }

      // Check for AWARD loss
      const oldAwardMap = new Map();
      for (const p of oldDB) {
        if (p.a) oldAwardMap.set(p.n, new Set(p.a));
      }
      const newAwardMap = new Map();
      for (const p of newEntries) {
        if (p.a) newAwardMap.set(p.n, new Set(p.a));
      }

      let awardsLost = 0;
      const awardLossDetails = [];
      for (const [name, oldAwards] of oldAwardMap) {
        const newAwards = newAwardMap.get(name);
        if (!newAwards) {
          awardsLost += oldAwards.size;
          awardLossDetails.push(`  - ${name}: lost ALL (${[...oldAwards].join(', ')})`);
          continue;
        }
        for (const a of oldAwards) {
          if (!newAwards.has(a)) {
            awardsLost++;
            awardLossDetails.push(`  - ${name}: lost ${a}`);
          }
        }
      }

      if (awardsLost > 0) {
        console.log(`\n⚠ AWARDS LOST (${awardsLost}):`);
        for (const d of awardLossDetails.slice(0, 30)) console.log(d);
        if (awardLossDetails.length > 30) console.log(`  ... and ${awardLossDetails.length - 30} more`);
      } else {
        console.log('\n✅ No awards lost!');
      }

    } catch (e) {
      console.log(`  ⚠ Could not compare with old DB: ${e.message}`);
    }
  }

  // Spot-check
  const spotCheck = [
    'Wayne Gretzky', 'Mario Lemieux', 'Sidney Crosby', 'Alex Ovechkin',
    'Kimmo Timonen', 'Teemu Selanne', 'Connor McDavid',
    'Patrick Roy', 'Martin Brodeur', 'Nicklas Lidstrom',
  ];
  console.log('\n🔍 Spot-check:');
  for (const name of spotCheck) {
    const p = newEntries.find(e => e.n.startsWith(name));
    if (p) {
      console.log(`  ${p.n}: ${p.t.join(',')} | ${p.a ? p.a.join(', ') : 'NO AWARDS'}`);
    } else {
      console.log(`  ${name}: NOT FOUND`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
function main() {
  console.log('🏒 NHL Game Database Builder v2');
  console.log('════════════════════════════════\n');

  // Step 1: Load raw data
  const players = loadRawData();

  // Step 2: Load overrides
  const overrides = loadOverrides();

  // Step 3: Apply overrides (append-only)
  applyOverrides(players, overrides);

  // Step 4: Namesake disambiguation
  const displayNames = disambiguateNamesakes(players);

  // Step 5: Build output entries
  const entries = buildOutput(players, displayNames);

  // Step 7: Audit
  audit(entries);

  // Step 6: Write output (unless audit-only)
  if (!AUDIT_ONLY) {
    writeOutput(entries);
  } else {
    console.log('\n(--audit-only mode: players.js not written)');
  }
}

main();
