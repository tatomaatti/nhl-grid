#!/usr/bin/env node
// test-grid-gen.js — Grid generation quality tester
// Usage: node test-grid-gen.js [N] [--verbose]
// Generates N grids with sequential seeds and validates each one.
// Exit code 0 = all OK, 1 = any failure.

import { readFileSync } from 'fs';
import { createContext, runInContext } from 'vm';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Parse CLI args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const countArg = args.find(a => !a.startsWith('--'));
const N = countArg ? parseInt(countArg, 10) : 30;

if (isNaN(N) || N < 1) {
  console.error('Usage: node test-grid-gen.js [N] [--verbose]');
  process.exit(1);
}

// ─── Load players.js via vm sandbox ────────────────────────────────
const playersPath = join(__dirname, 'players.js');
let playersSource = readFileSync(playersPath, 'utf8');
// Replace `const DB` with `var DB` so it leaks into the sandbox context
playersSource = playersSource.replace(/^const DB\b/m, 'var DB');

const sandbox = {};
createContext(sandbox);
runInContext(playersSource, sandbox);

if (!sandbox.DB || !Array.isArray(sandbox.DB)) {
  console.error('ERROR: Failed to load players.js — DB is not an array');
  process.exit(1);
}
const DB = sandbox.DB;
console.log(`Loaded ${DB.length} players from players.js`);

// =====================================================================
// CATEGORY DEFINITIONS (extracted from daily.html — DO NOT MODIFY)
// =====================================================================
const TEAMS = {
  EDM:{name:"Edmonton Oilers",     icon:"🟠",group:"Joukkue"},
  TOR:{name:"Toronto Maple Leafs", icon:"🍁",group:"Joukkue"},
  BOS:{name:"Boston Bruins",       icon:"🐻",group:"Joukkue"},
  PIT:{name:"Pittsburgh Penguins", icon:"🐧",group:"Joukkue"},
  TBL:{name:"Tampa Bay Lightning", icon:"⚡",group:"Joukkue"},
  COL:{name:"Colorado Avalanche",  icon:"🏔️",group:"Joukkue"},
  WSH:{name:"Washington Capitals", icon:"🦅",group:"Joukkue"},
  CHI:{name:"Chicago Blackhawks",  icon:"🪶",group:"Joukkue"},
  DET:{name:"Detroit Red Wings",   icon:"🔴",group:"Joukkue"},
  VAN:{name:"Vancouver Canucks",   icon:"🌊",group:"Joukkue"},
  MTL:{name:"Montréal Canadiens",  icon:"🔵",group:"Joukkue"},
  NYR:{name:"New York Rangers",    icon:"🗽",group:"Joukkue"},
  WPG:{name:"Winnipeg Jets",       icon:"✈️",group:"Joukkue"},
  FLA:{name:"Florida Panthers",    icon:"🐆",group:"Joukkue"},
  CAR:{name:"Carolina Hurricanes", icon:"🌀",group:"Joukkue"},
  NSH:{name:"Nashville Predators", icon:"🎸",group:"Joukkue"},
  STL:{name:"St. Louis Blues",     icon:"🎵",group:"Joukkue"},
  VGK:{name:"Vegas Golden Knights",icon:"⚔️",group:"Joukkue"},
  MIN:{name:"Minnesota Wild",      icon:"🌲",group:"Joukkue"},
  NJD:{name:"New Jersey Devils",   icon:"😈",group:"Joukkue"},
  NYI:{name:"New York Islanders",  icon:"🏝️",group:"Joukkue"},
  PHI:{name:"Philadelphia Flyers", icon:"🟠",group:"Joukkue"},
  CGY:{name:"Calgary Flames",      icon:"🔥",group:"Joukkue"},
  OTT:{name:"Ottawa Senators",     icon:"🏛️",group:"Joukkue"},
  BUF:{name:"Buffalo Sabres",      icon:"🦬",group:"Joukkue"},
  ARI:{name:"Arizona Coyotes",     icon:"🐺",group:"Joukkue"},
  UTA:{name:"Utah Hockey Club",    icon:"🏔",group:"Joukkue"},
  LAK:{name:"Los Angeles Kings",   icon:"👑",group:"Joukkue"},
  SJS:{name:"San Jose Sharks",     icon:"🦈",group:"Joukkue"},
  ANA:{name:"Anaheim Ducks",       icon:"🦆",group:"Joukkue"},
  SEA:{name:"Seattle Kraken",      icon:"🐙",group:"Joukkue"},
  CBJ:{name:"Columbus Blue Jackets",icon:"💙",group:"Joukkue"},
  DAL:{name:"Dallas Stars",        icon:"⭐",group:"Joukkue"},
};

const NATS = {
  CAN:{name:"Kanada",       icon:"🇨🇦",group:"Kansallisuus"},
  USA:{name:"USA",          icon:"🇺🇸",group:"Kansallisuus"},
  SWE:{name:"Ruotsi",       icon:"🇸🇪",group:"Kansallisuus"},
  FIN:{name:"Suomi",        icon:"🇫🇮",group:"Kansallisuus"},
  RUS:{name:"Venäjä",       icon:"🇷🇺",group:"Kansallisuus"},
  CZE:{name:"Tsekki",       icon:"🇨🇿",group:"Kansallisuus"},
  SVK:{name:"Slovakia",     icon:"🇸🇰",group:"Kansallisuus"},
  GER:{name:"Saksa",        icon:"🇩🇪",group:"Kansallisuus"},
  SUI:{name:"Sveitsi",      icon:"🇨🇭",group:"Kansallisuus"},
  AUT:{name:"Itävalta",     icon:"🇦🇹",group:"Kansallisuus"},
  LVA:{name:"Latvia",       icon:"🇱🇻",group:"Kansallisuus"},
};

const AWARDS = {
  Hart:         {name:"Hart Trophy",           icon:"🥇",group:"Palkinto"},
  Vezina:       {name:"Vezina Trophy",         icon:"🧤",group:"Palkinto"},
  Norris:       {name:"Norris Trophy",         icon:"🛡️",group:"Palkinto"},
  StanleyCup:   {name:"Stanley Cup",           icon:"🏆",group:"Palkinto"},
  Calder:       {name:"Calder Trophy",         icon:"⭐",group:"Palkinto"},
  RocketRichard:{name:"Rocket Richard Trophy", icon:"🚀",group:"Palkinto"},
  ConnSmythe:   {name:"Conn Smythe Trophy",    icon:"🎖️",group:"Palkinto"},
  ArtRoss:      {name:"Art Ross Trophy",       icon:"🎯",group:"Palkinto"},
  TedLindsay:   {name:"Ted Lindsay Award",     icon:"💪",group:"Palkinto"},
  Selke:        {name:"Selke Trophy",          icon:"🔒",group:"Palkinto"},
};

// Special derived categories
const SPECIALS = {
  one_club: {name:"Pelannut vain yhdessä joukkueessa", icon:"💎", group:"Erityinen",
             match: p => p.t && p.t.length === 1},
  multi_cup: {name:"Voittanut Stanley Cupin vähintään 3×", icon:"🏆🏆🏆", group:"Erityinen",
              match: p => p.a && p.a.filter(a => a === 'StanleyCup').length >= 3},
  five_teams: {name:"Pelannut vähintään 5 joukkueessa", icon:"🎒", group:"Erityinen",
               match: p => p.t && p.t.length >= 5},
};

// =====================================================================
// BUILD ELIGIBLE CATEGORY POOL (extracted from daily.html — DO NOT MODIFY)
// =====================================================================
function buildCategoryPool() {
  const pool = [];

  // Teams: require >= 20 players. Pre-compute player list for fast intersection.
  Object.entries(TEAMS).forEach(([key, info]) => {
    const players = DB.filter(p => p.t && p.t.includes(key));
    if (players.length >= 20) {
      pool.push({
        id: 'team_' + key, key, type: 'team',
        name: info.name, icon: info.icon, group: info.group,
        players,
        match: p => p.t && p.t.includes(key),
      });
    }
  });

  // Nationalities: require >= 15 players
  Object.entries(NATS).forEach(([key, info]) => {
    const players = DB.filter(p => p.c === key);
    if (players.length >= 15) {
      pool.push({
        id: 'nat_' + key, key, type: 'nat',
        name: info.name, icon: info.icon, group: info.group,
        players,
        match: p => p.c === key,
      });
    }
  });

  // Awards: require >= 6 winners
  Object.entries(AWARDS).forEach(([key, info]) => {
    const players = DB.filter(p => p.a && p.a.includes(key));
    if (players.length >= 6) {
      pool.push({
        id: 'award_' + key, key, type: 'award',
        name: info.name, icon: info.icon, group: info.group,
        players,
        match: p => p.a && p.a.includes(key),
      });
    }
  });

  // Specials
  Object.entries(SPECIALS).forEach(([key, info]) => {
    const players = DB.filter(info.match);
    if (players.length >= 12) {
      pool.push({
        id: 'special_' + key, key, type: 'special',
        name: info.name, icon: info.icon, group: info.group,
        players,
        match: info.match,
      });
    }
  });

  return pool;
}

// Fast intersection using pre-computed player lists
function intersectCats(catA, catB) {
  // Start from the smaller player list for efficiency
  const [small, large] = catA.players.length <= catB.players.length
    ? [catA, catB] : [catB, catA];
  return small.players.filter(large.match);
}

// =====================================================================
// SEEDED PRNG (Mulberry32) (extracted from daily.html — DO NOT MODIFY)
// =====================================================================
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getSeedForDate(year, month, date) {
  // Identical to daily.html getDailySeed() but with explicit date params
  const s = `NHLGRID${year}${month}${date}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function shuffleArray(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// =====================================================================
// GRID GENERATION (extracted from daily.html — DO NOT MODIFY)
// =====================================================================

// Min players per intersection
const MIN_POOL = 3;
// Max attempts
const MAX_ATTEMPTS = 5000;
// Type limits: max 2 awards to avoid sparse intersections
const TYPE_LIMITS = { team: 4, nat: 2, award: 2, special: 1 };
// At least this many of 6 lines must have 2+ valid categories (tactical depth)
const MIN_LINES_WITH_OPTIONS = 4;

function generateDailyGrid(rng) {
  const CAT_POOL = buildCategoryPool();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shuffled = shuffleArray(CAT_POOL, rng);

    // Pick 6 diverse categories
    const chosen = [];
    const typeCounts = {};
    for (const cat of shuffled) {
      if (chosen.length === 6) break;
      const lim = TYPE_LIMITS[cat.type] || 2;
      if ((typeCounts[cat.type] || 0) < lim) {
        chosen.push(cat);
        typeCounts[cat.type] = (typeCounts[cat.type] || 0) + 1;
      }
    }
    if (chosen.length < 6) continue;

    const rowCats = chosen.slice(0, 3);
    const colCats = chosen.slice(3, 6);

    // Check all 9 intersections using fast pre-computed lists
    let valid = true;
    const candidatePools = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const pool = intersectCats(rowCats[r], colCats[c]);
        if (pool.length < MIN_POOL) { valid = false; break; }
        candidatePools.push(pool);
      }
      if (!valid) break;
    }
    if (!valid) continue;

    // Fill grid without duplicate players
    const players = fillGridBacktrack(candidatePools, rng);
    if (!players) continue;

    // Validate puzzle quality
    const validation = validatePuzzle(players, rowCats, colCats, CAT_POOL);
    if (!validation.ok) continue;

    return { players, rowCats, colCats, validation };
  }

  // Fallback: relax to just solvability
  return generateFallbackGrid(rng);
}

// Fame score: prefer well-known players (award winners, widely-traded)
function fameScore(p) {
  let s = 0;
  if (p.a && p.a.length > 0) s += p.a.length * 10;
  if (p.t) s += Math.min(p.t.length, 4); // more teams = more exposure
  return s;
}

// Sort by fame (descending), shuffle within same tier for variety
function sortByFame(players, rng) {
  const scored = players.map(p => ({ p, score: fameScore(p) }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return rng() - 0.5;
  });
  return scored.map(s => s.p);
}

function fillGridBacktrack(candidatePools, rng) {
  const chosen = new Array(9).fill(null);
  const used = new Set();

  function bt(idx) {
    if (idx === 9) return true;
    // Prefer famous players, shuffle within same fame tier
    const pool = sortByFame(
      candidatePools[idx].filter(p => !used.has(p.n)),
      rng
    );
    for (const p of pool) {
      chosen[idx] = p;
      used.add(p.n);
      if (bt(idx + 1)) return true;
      used.delete(p.n);
      chosen[idx] = null;
    }
    return false;
  }

  return bt(0) ? chosen : null;
}

// For each line of 3 players, find ALL matching categories from the pool
function findMatchingCats(players, allCats) {
  return allCats.filter(cat => players.every(p => cat.match(p)));
}

function validatePuzzle(players, rowCats, colCats, allCats) {
  // For each row and col, find ALL matching categories
  const rowOptions = [0, 1, 2].map(r => {
    const rp = [players[r*3], players[r*3+1], players[r*3+2]];
    return findMatchingCats(rp, allCats);
  });
  const colOptions = [0, 1, 2].map(c => {
    const cp = [players[c], players[c+3], players[c+6]];
    return findMatchingCats(cp, allCats);
  });

  // Intended categories must appear in options
  for (let r = 0; r < 3; r++) {
    if (!rowOptions[r].find(o => o.id === rowCats[r].id)) return { ok: false };
  }
  for (let c = 0; c < 3; c++) {
    if (!colOptions[c].find(o => o.id === colCats[c].id)) return { ok: false };
  }

  // At least MIN_LINES_WITH_OPTIONS of 6 lines must have 2+ options (tactical depth)
  const linesWithMultiple = [...rowOptions, ...colOptions].filter(o => o.length >= 2).length;
  if (linesWithMultiple < MIN_LINES_WITH_OPTIONS) return { ok: false };

  // Must have at least 2 valid full solutions (unique 6-category assignments)
  const solutions = countValidAssignments(rowOptions, colOptions, 2);
  if (solutions < 2) return { ok: false };

  return { ok: true, rowOptions, colOptions };
}

// Count valid 6-unique-category assignments (stop after target reached)
function countValidAssignments(rowOptions, colOptions, target) {
  let count = 0;

  function bt(line, used) {
    if (line === 6) { count++; return; }
    const opts = line < 3 ? rowOptions[line] : colOptions[line - 3];
    for (const cat of opts) {
      if (used.has(cat.id)) continue;
      used.add(cat.id);
      bt(line + 1, used);
      used.delete(cat.id);
      if (count >= target) return;
    }
  }

  bt(0, new Set());
  return count;
}

// Fallback: no diversity/multi-solution requirements — just solvable
function generateFallbackGrid(rng) {
  const CAT_POOL = buildCategoryPool();
  for (let attempt = 0; attempt < 8000; attempt++) {
    const shuffled = shuffleArray(CAT_POOL, rng);
    const rowCats = shuffled.slice(0, 3);
    const colCats = shuffled.slice(3, 6);

    const ids = [...rowCats, ...colCats].map(c => c.id);
    if (new Set(ids).size < 6) continue;

    let valid = true;
    const candidatePools = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const pool = intersectCats(rowCats[r], colCats[c]);
        if (pool.length < 1) { valid = false; break; }
        candidatePools.push(pool);
      }
      if (!valid) break;
    }
    if (!valid) continue;

    const players = fillGridBacktrack(candidatePools, rng);
    if (!players) continue;

    const rowOptions = [0,1,2].map(r => {
      const rp = [players[r*3], players[r*3+1], players[r*3+2]];
      return findMatchingCats(rp, CAT_POOL);
    });
    const colOptions = [0,1,2].map(c => {
      const cp = [players[c], players[c+3], players[c+6]];
      return findMatchingCats(cp, CAT_POOL);
    });

    let intendedOk = true;
    for (let r = 0; r < 3; r++) {
      if (!rowOptions[r].find(c => c.id === rowCats[r].id)) { intendedOk = false; break; }
    }
    for (let c = 0; c < 3; c++) {
      if (!colOptions[c].find(c => c.id === colCats[c].id)) { intendedOk = false; break; }
    }
    if (!intendedOk) continue;

    return { players, rowCats, colCats, validation: { ok: true, rowOptions, colOptions } };
  }
  return null;
}

// =====================================================================
// TEST RUNNER
// =====================================================================

const epoch = new Date(Date.UTC(2026, 2, 15)); // 2026-03-15, month is 0-indexed

let okCount = 0;
let fallbackCount = 0;
let failCount = 0;
const failures = [];
const typeStats = { team: 0, nat: 0, award: 0, special: 0 };
const allIntersectionSizes = [];

for (let i = 0; i < N; i++) {
  // Compute the date for grid i (epoch + i days)
  const gridDate = new Date(epoch.getTime() + i * 86400000);
  const year = gridDate.getUTCFullYear();
  const month = gridDate.getUTCMonth(); // 0-indexed, matching getDailySeed
  const date = gridDate.getUTCDate();
  const seed = getSeedForDate(year, month, date);
  const rng = mulberry32(seed);

  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

  const startTime = Date.now();
  const result = generateDailyGrid(rng);
  const elapsed = Date.now() - startTime;

  if (!result) {
    failCount++;
    const msg = `FAIL  Grid #${i + 1} (${dateStr}, seed=${seed}): generation returned null — no valid grid found`;
    failures.push(msg);
    console.error(msg);
    continue;
  }

  // Detect fallback: fallback grids may lack validation.rowOptions/colOptions or
  // fail the full quality check — we detect by re-checking quality criteria
  const { players, rowCats, colCats, validation } = result;

  // Check 9 unique players
  const names = players.map(p => p.n);
  const uniqueNames = new Set(names);
  if (uniqueNames.size < 9) {
    failCount++;
    const msg = `FAIL  Grid #${i + 1} (${dateStr}, seed=${seed}): only ${uniqueNames.size}/9 unique players`;
    failures.push(msg);
    console.error(msg);
    continue;
  }

  // Check intersection sizes
  const intersectionSizes = [];
  let intersectionOk = true;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const pool = intersectCats(rowCats[r], colCats[c]);
      intersectionSizes.push(pool.length);
      if (pool.length < MIN_POOL) intersectionOk = false;
    }
  }
  allIntersectionSizes.push(...intersectionSizes);

  if (!intersectionOk) {
    failCount++;
    const minSize = Math.min(...intersectionSizes);
    const msg = `FAIL  Grid #${i + 1} (${dateStr}, seed=${seed}): intersection too small (min=${minSize}, need >=${MIN_POOL})`;
    failures.push(msg);
    console.error(msg);
    continue;
  }

  // Detect fallback usage: check if the quality criteria would pass
  // (The generateDailyGrid function falls back to generateFallbackGrid which doesn't
  // enforce MIN_LINES_WITH_OPTIONS or multi-solution requirement)
  let isFallback = false;
  if (validation && validation.rowOptions && validation.colOptions) {
    const linesWithMultiple = [...validation.rowOptions, ...validation.colOptions]
      .filter(o => o.length >= 2).length;
    const solutions = countValidAssignments(validation.rowOptions, validation.colOptions, 2);
    if (linesWithMultiple < MIN_LINES_WITH_OPTIONS || solutions < 2) {
      isFallback = true;
    }
  }

  if (isFallback) {
    fallbackCount++;
  }

  okCount++;

  // Count category types
  const cats = [...rowCats, ...colCats];
  for (const cat of cats) {
    typeStats[cat.type] = (typeStats[cat.type] || 0) + 1;
  }

  const minInt = Math.min(...intersectionSizes);
  const catTypes = cats.map(c => c.type).join(',');

  // Per-grid summary line
  console.log(`  OK  Grid #${i + 1} (${dateStr}) seed=${seed} cats=[${catTypes}] min-int=${minInt} ${isFallback ? 'FALLBACK' : ''} ${elapsed}ms`);

  // Verbose output for single grid
  if (verbose) {
    console.log('\n  ── VERBOSE: Grid Details ──');
    console.log('  Categories:');
    cats.forEach((cat, idx) => {
      const role = idx < 3 ? `Row ${idx + 1}` : `Col ${idx - 2}`;
      console.log(`    ${role}: [${cat.type}] ${cat.id} "${cat.name}" (${cat.players.length} players in pool)`);
    });

    console.log('  Players:');
    players.forEach((p, idx) => {
      const r = Math.floor(idx / 3);
      const c = idx % 3;
      const awards = p.a && p.a.length > 0 ? p.a.join(', ') : 'none';
      console.log(`    [${r},${c}] ${p.n} — teams: [${(p.t || []).join(',')}] nat: ${p.c} awards: [${awards}]`);
    });

    console.log('  Intersection sizes:');
    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let c = 0; c < 3; c++) {
        row.push(intersectionSizes[r * 3 + c]);
      }
      console.log(`    Row ${r + 1}: ${row.join(', ')}`);
    }

    if (validation && validation.rowOptions && validation.colOptions) {
      console.log('  Validation:');
      validation.rowOptions.forEach((opts, r) => {
        console.log(`    Row ${r + 1} options (${opts.length}): ${opts.map(o => o.id).join(', ')}`);
      });
      validation.colOptions.forEach((opts, c) => {
        console.log(`    Col ${c + 1} options (${opts.length}): ${opts.map(o => o.id).join(', ')}`);
      });
    }
    console.log('  ── END VERBOSE ──\n');
  }
}

// =====================================================================
// SUMMARY REPORT
// =====================================================================
console.log('\n═══════════════════════════════════════════════════');
console.log(`Generated: ${okCount}/${N} OK, ${fallbackCount} fallbacks, ${failCount} failures`);

if (allIntersectionSizes.length > 0) {
  const min = Math.min(...allIntersectionSizes);
  const max = Math.max(...allIntersectionSizes);
  const avg = (allIntersectionSizes.reduce((a, b) => a + b, 0) / allIntersectionSizes.length).toFixed(1);
  console.log(`Intersection sizes: min=${min} avg=${avg} max=${max}`);
}

console.log('Category type distribution:');
for (const [type, count] of Object.entries(typeStats)) {
  console.log(`  ${type}: ${count} (${((count / (okCount * 6)) * 100).toFixed(1)}%)`);
}

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  ${f}`));
}
console.log('═══════════════════════════════════════════════════');

process.exit(failCount > 0 ? 1 : 0);
