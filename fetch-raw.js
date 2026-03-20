#!/usr/bin/env node
/**
 * fetch-raw.js  —  NHL Raw Data Fetcher (v2 Pipeline Stage 1)
 * =============================================================
 * Fetches ALL available data from NHL APIs into players-raw.json.
 * This is the "data lake" — append-only, never loses data.
 *
 * Data sources:
 *   1. api.nhle.com/stats/rest/en  → bios (name, nat, birthDate, position, shoots)
 *   2. api.nhle.com/stats/rest/en  → summaries (teams per season)
 *   3. api-web.nhle.com/v1/player/{id}/awards  → individual player awards
 *   4. Cup-winning team rosters per season      → StanleyCup attribution
 *
 * Usage:
 *   node fetch-raw.js                    # full fetch (bios + teams + awards + cup)
 *   node fetch-raw.js --awards-only      # only fetch player awards (Phase 3)
 *   node fetch-raw.js --cup-only         # only fetch Cup rosters (Phase 4)
 *   node fetch-raw.js --assemble-only    # skip API, build raw.json from cache
 *   node fetch-raw.js --from 2005        # start bios/teams from 2005-06 season
 *
 * Output:  players-raw.json
 * Cache:   .player-cache/   (one file per season × endpoint + awards cache)
 *
 * RUN THIS LOCALLY — the Cowork VM cannot reach NHL APIs.
 * Requires: Node.js 18+ (built-in fetch)
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '.player-cache');
const AWARDS_CACHE = join(CACHE_DIR, '_awards');
const CUP_CACHE = join(CACHE_DIR, '_cup-rosters');
const RAW_FILE = join(__dirname, 'players-raw.json');

// ── CLI flags ────────────────────────────────────────────────────────────────
const AWARDS_ONLY   = process.argv.includes('--awards-only');
const CUP_ONLY      = process.argv.includes('--cup-only');
const ASSEMBLE_ONLY = process.argv.includes('--assemble-only');
const FROM_IDX      = process.argv.indexOf('--from');
const FROM_YEAR     = FROM_IDX !== -1 ? parseInt(process.argv[FROM_IDX + 1]) : null;

// ── Configuration ────────────────────────────────────────────────────────────
const DELAY_MS     = 2000;
const MAX_RETRIES  = 4;
const RETRY_BASE   = 5000;
const FIRST_SEASON = 1987;
const LAST_SEASON  = 2025;

const STATS_API = 'https://api.nhle.com/stats/rest/en';
const WEB_API   = 'https://api-web.nhle.com/v1';

// ── Team alias & validation ──────────────────────────────────────────────────
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

// ── Award name normalization ─────────────────────────────────────────────────
// Maps API trophy names to our short keys.
// This will need expanding when we see the actual API response.
// Run with --awards-only on a few players first to see the format.
const AWARD_NORMALIZE = {
  // ── From API: trophy.default field (exact values seen from nhl.com) ──
  'stanley cup': 'StanleyCup',
  'hart memorial trophy': 'Hart',
  'art ross trophy': 'ArtRoss',
  'conn smythe trophy': 'ConnSmythe',
  'maurice "rocket" richard trophy': 'RocketRichard',   // API uses smart quotes
  "maurice 'rocket' richard trophy": 'RocketRichard',   // fallback
  'maurice richard trophy': 'RocketRichard',
  'rocket richard trophy': 'RocketRichard',
  'ted lindsay award': 'TedLindsay',
  'lester b. pearson award': 'TedLindsay',               // old name
  'james norris memorial trophy': 'Norris',
  'calder memorial trophy': 'Calder',
  'frank j. selke trophy': 'Selke',
  'vezina trophy': 'Vezina',
  'jack adams award': 'JackAdams',
  'lady byng memorial trophy': 'LadyByng',
  'bill masterton memorial trophy': 'Masterton',
  'william m. jennings trophy': 'Jennings',
  'king clancy memorial trophy': 'KingClancy',
  'mark messier nhl leadership award': 'MessierLeadership',
  'mark messier leadership award': 'MessierLeadership',
  // ── Shorter aliases as fallback ──
  'hart trophy': 'Hart',
  'hart': 'Hart',
  'vezina': 'Vezina',
  'norris trophy': 'Norris',
  'norris': 'Norris',
  'calder trophy': 'Calder',
  'calder': 'Calder',
  'conn smythe': 'ConnSmythe',
  'art ross': 'ArtRoss',
  'rocket richard': 'RocketRichard',
  'ted lindsay': 'TedLindsay',
  'selke trophy': 'Selke',
  'selke': 'Selke',
  'lady byng trophy': 'LadyByng',
  'jennings trophy': 'Jennings',
};

function normalizeAwardName(raw) {
  if (!raw) return null;
  // Normalize smart quotes to ASCII before comparison
  const lower = raw.replace(/[\u201C\u201D\u201E\u201F]/g, '"')
                    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
                    .toLowerCase().trim();
  if (AWARD_NORMALIZE[lower]) return AWARD_NORMALIZE[lower];
  // Partial matching fallback
  for (const [key, val] of Object.entries(AWARD_NORMALIZE)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  // Unknown award — return as-is but log it
  return raw;
}

// ── Nationality normalization ────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function ensureDir(dir) { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); }

function buildSeasonList() {
  const seasons = [];
  for (let y = FIRST_SEASON; y <= LAST_SEASON; y++) {
    if (FROM_YEAR && y < FROM_YEAR) continue;
    seasons.push({ id: `${y}${y + 1}`, label: `${y}-${String(y + 1).slice(2)}`, year: y });
  }
  return seasons;
}

// ── Cache helpers ────────────────────────────────────────────────────────────
function cacheFile(seasonId, type) { return join(CACHE_DIR, `${seasonId}-${type}.json`); }
function hasCached(seasonId, type) { return existsSync(cacheFile(seasonId, type)); }
function readCacheFile(seasonId, type) { return JSON.parse(readFileSync(cacheFile(seasonId, type), 'utf8')); }
function writeCacheFile(seasonId, type, data) { writeFileSync(cacheFile(seasonId, type), JSON.stringify(data), 'utf8'); }

function awardsFile(playerId) { return join(AWARDS_CACHE, `${playerId}.json`); }
function hasAwardsCached(playerId) { return existsSync(awardsFile(playerId)); }
function readAwardsCache(playerId) { return JSON.parse(readFileSync(awardsFile(playerId), 'utf8')); }
function writeAwardsCache(playerId, data) { writeFileSync(awardsFile(playerId), JSON.stringify(data), 'utf8'); }

function cupFile(seasonId) { return join(CUP_CACHE, `${seasonId}.json`); }
function hasCupCached(seasonId) { return existsSync(cupFile(seasonId)); }
function readCupCache(seasonId) { return JSON.parse(readFileSync(cupFile(seasonId), 'utf8')); }
function writeCupCache(seasonId, data) { writeFileSync(cupFile(seasonId), JSON.stringify(data), 'utf8'); }

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
// PHASE 1: BIOS (name, nat, birthDate, position, shoots, playerId)
// ══════════════════════════════════════════════════════════════════════════════
async function fetchSeasonBios(season) {
  for (const type of ['skater', 'goalie']) {
    const key = `${type}`;
    if (hasCached(season.id, key)) continue;
    console.log(`  📋 ${season.label} ${type} bios...`);
    const url = `${STATS_API}/${type}/bios?isAggregate=false&isGame=false&cayenneExp=seasonId=${season.id}`;
    const data = await fetchJSON(url);
    if (data?.data) {
      const players = data.data.map(p => ({
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        playerId: p.playerId,
        nat: natCode(p.nationalityCode || ''),
        birthDate: p.birthDate || null,
        position: p.positionCode || null,
        shoots: p.shootsCatchesCode || null,
      }));
      writeCacheFile(season.id, key, players);
      console.log(`    ✓ ${players.length} ${type}s`);
    } else {
      writeCacheFile(season.id, key, []);
      console.log(`    ⚠ empty`);
    }
    await sleep(DELAY_MS);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2: TEAM SUMMARIES (playerId → teams per season)
// ══════════════════════════════════════════════════════════════════════════════
async function fetchSeasonSummaries(season) {
  for (const type of ['skater', 'goalie']) {
    const key = `${type}-summary`;
    if (hasCached(season.id, key)) continue;
    console.log(`  📊 ${season.label} ${type} summaries...`);
    const url = `${STATS_API}/${type}/summary?isAggregate=false&isGame=false&cayenneExp=seasonId=${season.id}`;
    const data = await fetchJSON(url);
    if (data?.data) {
      const players = data.data.map(p => ({
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        playerId: p.playerId,
        teams: (p.teamAbbrevs || '').split(',').map(t => resolveTeam(t.trim())).filter(Boolean),
      }));
      writeCacheFile(season.id, key, players);
      console.log(`    ✓ ${players.length} ${type}s`);
    } else {
      writeCacheFile(season.id, key, []);
      console.log(`    ⚠ empty`);
    }
    await sleep(DELAY_MS);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3: PLAYER LANDING (awards + bio enrichment, one API call per player)
// ══════════════════════════════════════════════════════════════════════════════
// Endpoint: /v1/player/{id}/landing
// Returns full player page data including:
//   - awards[]: { trophy: { default: "Hart Memorial Trophy" }, seasons: [...] }
//   - birthDate, position, shootsCatches, firstName, lastName
// This is the same endpoint nhl.com uses for player pages.
//
async function fetchPlayerLanding(playerIds) {
  ensureDir(AWARDS_CACHE);
  const total = playerIds.length;
  let done = 0;
  let found = 0;
  let skipped = 0;
  let errors = 0;
  let unknownAwards = new Set();

  console.log(`\n🏆 Phase 3: Fetching player landing pages for ${total} players...`);
  console.log(`   (Already cached: ${playerIds.filter(id => hasAwardsCached(id)).length})`);

  for (const id of playerIds) {
    if (hasAwardsCached(id)) { skipped++; done++; continue; }

    const url = `${WEB_API}/player/${id}/landing`;
    const data = await fetchJSON(url);

    if (data) {
      // Log first successful response for format discovery
      if (done === skipped && data.awards) {
        console.log('\n  📝 First awards sample:');
        const sample = (data.awards || []).slice(0, 3).map(a => a.trophy?.default);
        console.log('    Trophies:', sample.join(', '));
        console.log('');
      }

      // Parse awards from landing response
      // Format: { awards: [ { trophy: { default: "Stanley Cup" }, seasons: [...] }, ... ] }
      let awards = [];
      if (Array.isArray(data.awards)) {
        for (const a of data.awards) {
          const rawName = a.trophy?.default || '';
          const normalized = normalizeAwardName(rawName);
          if (normalized) {
            awards.push(normalized);
            // Track unknown awards for later normalization
            if (normalized === rawName && !AWARD_NORMALIZE[rawName.toLowerCase().trim()]) {
              unknownAwards.add(rawName);
            }
          }
        }
      }

      awards = [...new Set(awards)]; // deduplicate

      // Cache: awards + any bonus bio data from landing page
      writeAwardsCache(id, {
        awards,
        // Bonus data from landing page (enrichment)
        birthDate: data.birthDate || null,
        position: data.position || null,
        shootsCatches: data.shootsCatches || null,
        inHHOF: data.inHHOF || false,
        inTop100: data.inTop100AllTime || false,
        fetchedAt: new Date().toISOString(),
      });
      if (awards.length > 0) found++;
    } else {
      // API returned nothing — cache empty result to avoid re-fetching
      errors++;
      writeAwardsCache(id, { awards: [], fetchedAt: new Date().toISOString() });
    }

    done++;
    if (done % 100 === 0 || done === total) {
      const elapsed = done - skipped;
      const eta = elapsed > 0 ? Math.round((total - done) * DELAY_MS / 60000) : '?';
      console.log(`  [${done}/${total}] ${found} with awards, ${errors} errors, ~${eta} min remaining`);
    }
    await sleep(DELAY_MS);
  }

  if (unknownAwards.size > 0) {
    console.log(`\n  ⚠ Unknown award names (add to AWARD_NORMALIZE):`);
    for (const name of unknownAwards) {
      console.log(`    - "${name}"`);
    }
  }

  console.log(`\n  ✅ Phase 3 done: ${found} players with awards, ${errors} errors`);
  return { found, total };
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 4: STANLEY CUP ROSTERS (one call per champion team per season)
// ══════════════════════════════════════════════════════════════════════════════

// Historical Stanley Cup champions (team code + season)
// Source: https://en.wikipedia.org/wiki/List_of_Stanley_Cup_champions
const CUP_CHAMPIONS = [
  { season: '19871988', team: 'EDM' },
  { season: '19881989', team: 'CGY' },
  { season: '19891990', team: 'EDM' },
  { season: '19901991', team: 'PIT' },
  { season: '19911992', team: 'PIT' },
  { season: '19921993', team: 'MTL' },
  { season: '19931994', team: 'NYR' },
  { season: '19941995', team: 'NJD' },
  { season: '19951996', team: 'COL' },
  { season: '19961997', team: 'DET' },
  { season: '19971998', team: 'DET' },
  { season: '19981999', team: 'DAL' },
  { season: '19992000', team: 'NJD' },
  { season: '20002001', team: 'COL' },
  { season: '20012002', team: 'DET' },
  { season: '20022003', team: 'NJD' },
  { season: '20032004', team: 'TBL' },
  // 2004-05: lockout, no Cup
  { season: '20052006', team: 'CAR' },
  { season: '20062007', team: 'ANA' },
  { season: '20072008', team: 'DET' },
  { season: '20082009', team: 'PIT' },
  { season: '20092010', team: 'CHI' },
  { season: '20102011', team: 'BOS' },
  { season: '20112012', team: 'LAK' },
  { season: '20122013', team: 'CHI' },
  { season: '20132014', team: 'LAK' },
  { season: '20142015', team: 'CHI' },
  { season: '20152016', team: 'PIT' },
  { season: '20162017', team: 'PIT' },
  { season: '20172018', team: 'WSH' },
  { season: '20182019', team: 'STL' },
  { season: '20192020', team: 'TBL' },
  { season: '20202021', team: 'TBL' },
  { season: '20212022', team: 'COL' },
  { season: '20222023', team: 'VGK' },
  { season: '20232024', team: 'FLA' },
  { season: '20242025', team: 'TBD' },  // placeholder — update when known
];

async function fetchCupRosters() {
  ensureDir(CUP_CACHE);
  console.log(`\n🏆 Phase 4: Fetching Stanley Cup winning rosters...`);

  for (const { season, team } of CUP_CHAMPIONS) {
    if (team === 'TBD') continue;
    if (hasCupCached(season)) { continue; }

    const seasonLabel = `${season.substring(0, 4)}-${season.substring(6)}`;
    console.log(`  🏆 ${seasonLabel} ${team}...`);

    // Try roster endpoint
    const url = `${WEB_API}/roster/${team}/${season}`;
    const data = await fetchJSON(url);

    if (data) {
      // Parse roster — try different shapes
      let playerIds = [];
      const categories = ['forwards', 'defensemen', 'goalies'];
      for (const cat of categories) {
        if (Array.isArray(data[cat])) {
          for (const p of data[cat]) {
            if (p.id) playerIds.push(p.id);
            else if (p.playerId) playerIds.push(p.playerId);
          }
        }
      }
      // Fallback: if response is flat array
      if (playerIds.length === 0 && Array.isArray(data)) {
        playerIds = data.map(p => p.id || p.playerId).filter(Boolean);
      }

      writeCupCache(season, {
        team,
        season,
        playerIds,
        raw: data,
        fetchedAt: new Date().toISOString(),
      });
      console.log(`    ✓ ${playerIds.length} players on roster`);
    } else {
      writeCupCache(season, { team, season, playerIds: [], raw: null, fetchedAt: new Date().toISOString() });
      console.log(`    ⚠ failed`);
    }
    await sleep(DELAY_MS);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ASSEMBLY: Combine all cached data into players-raw.json
// ══════════════════════════════════════════════════════════════════════════════
function assembleRawData() {
  console.log('\n📦 Assembling players-raw.json...');
  const seasons = buildSeasonList();

  // Start with existing raw data if present (append-only merge)
  let players = {};
  if (existsSync(RAW_FILE)) {
    try {
      const existing = JSON.parse(readFileSync(RAW_FILE, 'utf8'));
      players = existing.players || {};
      console.log(`  Loaded existing raw data: ${Object.keys(players).length} players`);
    } catch (e) {
      console.log(`  ⚠ Could not read existing raw data: ${e.message}`);
    }
  }

  // Phase 1+2: Bios and team summaries from season caches
  for (const season of seasons) {
    for (const type of ['skater', 'goalie']) {
      // Bios
      if (hasCached(season.id, type)) {
        const bios = readCacheFile(season.id, type);
        for (const p of bios) {
          if (!p.playerId) continue;
          const id = String(p.playerId);
          if (!players[id]) {
            players[id] = {
              name: p.name,
              birthDate: p.birthDate || null,
              nationality: p.nat || '',
              position: p.position || null,
              shoots: p.shoots || null,
              teams: [],
              seasons: [],
              awards: {},
            };
          }
          // Append-only: update fields if we have better data
          const rec = players[id];
          if (p.birthDate && !rec.birthDate) rec.birthDate = p.birthDate;
          if (p.nat && !rec.nationality) rec.nationality = p.nat;
          if (p.position && !rec.position) rec.position = p.position;
          if (p.shoots && !rec.shoots) rec.shoots = p.shoots;
          if (!rec.seasons.includes(season.label)) rec.seasons.push(season.label);
        }
      }

      // Summaries (teams)
      const sumKey = `${type}-summary`;
      if (hasCached(season.id, sumKey)) {
        const sums = readCacheFile(season.id, sumKey);
        for (const p of sums) {
          if (!p.playerId) continue;
          const id = String(p.playerId);
          if (!players[id]) continue; // bio not found, skip
          const rec = players[id];
          for (const t of (p.teams || [])) {
            if (t && !rec.teams.includes(t)) rec.teams.push(t);
          }
        }
      }
    }
  }

  console.log(`  After bios+teams: ${Object.keys(players).length} players`);

  // Phase 3: Player awards + bio enrichment from landing page cache
  let awardsCount = 0;
  let positionCount = 0;
  let shootsCount = 0;
  let birthDateCount = 0;
  if (existsSync(AWARDS_CACHE)) {
    for (const id of Object.keys(players)) {
      if (hasAwardsCached(id)) {
        const cached = readAwardsCache(id);
        const rec = players[id];

        // Awards extraction
        if (cached.awards && cached.awards.length > 0) {
          for (const award of cached.awards) {
            // Append-only: add source "player-awards-api"
            if (!rec.awards[award]) rec.awards[award] = { sources: [] };
            if (!rec.awards[award].sources.includes('player-awards-api')) {
              rec.awards[award].sources.push('player-awards-api');
            }
          }
          awardsCount++;
        }

        // Bio enrichment from landing page cache (position, shoots, birthDate)
        if (cached.position && !rec.position) {
          rec.position = cached.position;
          positionCount++;
        }
        if (cached.shootsCatches && !rec.shoots) {
          rec.shoots = cached.shootsCatches;
          shootsCount++;
        }
        if (cached.birthDate && !rec.birthDate) {
          rec.birthDate = cached.birthDate;
          birthDateCount++;
        }
      }
    }
  }
  console.log(`  After player awards: ${awardsCount} players have awards from API`);
  console.log(`  Bio enrichment from landing pages: ${positionCount} position, ${shootsCount} shoots, ${birthDateCount} birthDate`);

  // Phase 4: Cup rosters — give StanleyCup to all players on winning roster
  let cupCount = 0;
  for (const { season, team } of CUP_CHAMPIONS) {
    if (team === 'TBD') continue;
    if (!hasCupCached(season)) continue;
    const cached = readCupCache(season);
    const seasonLabel = `${season.substring(0, 4)}-${season.substring(6)}`;
    for (const pid of (cached.playerIds || [])) {
      const id = String(pid);
      if (!players[id]) continue;
      const rec = players[id];
      if (!rec.awards['StanleyCup']) rec.awards['StanleyCup'] = { sources: [] };
      const src = `roster-${seasonLabel}-${team}`;
      if (!rec.awards['StanleyCup'].sources.includes(src)) {
        rec.awards['StanleyCup'].sources.push(src);
        cupCount++;
      }
    }
  }
  console.log(`  After Cup rosters: +${cupCount} StanleyCup attributions`);

  // Write output
  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      seasons: seasons.map(s => s.label),
      playerCount: Object.keys(players).length,
      pipeline: 'fetch-raw.js v2',
    },
    players,
  };

  writeFileSync(RAW_FILE, JSON.stringify(output, null, 2), 'utf8');
  const sizeMB = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(1);
  console.log(`\n✅ Written: players-raw.json (${Object.keys(players).length} players, ${sizeMB} MB)`);

  // Spot-check
  const spotCheck = [
    '8471675',  // Sidney Crosby
    '8471214',  // Alex Ovechkin
    '8447400',  // Wayne Gretzky (likely ID)
  ];
  console.log('\n🔍 Spot-check:');
  for (const id of spotCheck) {
    const p = players[id];
    if (p) {
      const awards = Object.keys(p.awards);
      console.log(`  ${p.name}: ${p.teams.join(',')} | awards: ${awards.length > 0 ? awards.join(', ') : 'NONE'}`);
    }
  }

  // Stats
  const withAwards = Object.values(players).filter(p => Object.keys(p.awards).length > 0).length;
  const withCup = Object.values(players).filter(p => p.awards['StanleyCup']).length;
  console.log(`\n📊 Stats:`);
  console.log(`   Total players: ${Object.keys(players).length}`);
  console.log(`   With any award: ${withAwards}`);
  console.log(`   With StanleyCup: ${withCup}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  ensureDir(CACHE_DIR);

  console.log('🏒 NHL Raw Data Fetcher v2');
  console.log('═══════════════════════════\n');

  if (!ASSEMBLE_ONLY && !AWARDS_ONLY && !CUP_ONLY) {
    // Phase 1+2: Bios and summaries per season
    const seasons = buildSeasonList();
    console.log(`📅 Seasons: ${seasons[0].label} → ${seasons[seasons.length - 1].label} (${seasons.length} seasons)\n`);

    for (const season of seasons) {
      console.log(`Season ${season.label}:`);
      await fetchSeasonBios(season);
      await fetchSeasonSummaries(season);
    }
  }

  // Assemble first pass to know all player IDs (needed for awards fetch)
  if (!AWARDS_ONLY && !CUP_ONLY) {
    assembleRawData();
  }

  // Phase 3: Awards (if requested or full run)
  if (AWARDS_ONLY || (!ASSEMBLE_ONLY && !CUP_ONLY)) {
    // Load raw data to get player IDs
    let playerIds = [];
    if (existsSync(RAW_FILE)) {
      const raw = JSON.parse(readFileSync(RAW_FILE, 'utf8'));
      playerIds = Object.keys(raw.players || {});
    }
    if (playerIds.length > 0) {
      await fetchPlayerLanding(playerIds);
    } else {
      console.log('⚠ No players found. Run full fetch first.');
    }
  }

  // Phase 4: Cup rosters
  if (CUP_ONLY || (!ASSEMBLE_ONLY && !AWARDS_ONLY)) {
    await fetchCupRosters();
  }

  // Final assembly
  assembleRawData();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
