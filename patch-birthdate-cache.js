#!/usr/bin/env node
/**
 * patch-birthdate-cache.js — Add birthDate to bios cache for NAMESAKES only
 *
 * 1. Scans all bios cache files to find playerIds that share a name
 * 2. Fetches birthDate only for those players (minimal API calls)
 * 3. Updates the cache files
 * 4. Then you run: node fetch-all-players.js --merge-only
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '.player-cache');
const WEB_API   = 'https://api-web.nhle.com/v1';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url) {
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'NHL-Grid-Game/2.0', 'Accept': 'application/json' },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(3000 * Math.pow(2, attempt));
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (attempt < 3) { await sleep(3000 * Math.pow(2, attempt)); continue; }
      return null;
    }
  }
  return null;
}

async function main() {
  console.log('Scanning bios cache for namesakes...\n');

  const biosFiles = readdirSync(CACHE_DIR).filter(f => f.match(/^\d+-(?:skater|goalie)\.json$/));
  console.log(`Found ${biosFiles.length} bios cache files`);

  // Collect all unique players (playerId → name)
  const playerNames = new Map();
  for (const file of biosFiles) {
    const data = JSON.parse(readFileSync(join(CACHE_DIR, file), 'utf8'));
    for (const p of data) {
      if (p.playerId && !playerNames.has(p.playerId)) {
        playerNames.set(p.playerId, p.name);
      }
    }
  }
  console.log(`Total unique playerIds: ${playerNames.size}`);

  // Group by normalized name to find namesakes
  const nameGroups = new Map();
  for (const [id, name] of playerNames) {
    const key = name.toLowerCase().trim();
    if (!nameGroups.has(key)) nameGroups.set(key, []);
    nameGroups.get(key).push(id);
  }

  const namesakes = [...nameGroups.entries()].filter(([, ids]) => ids.length > 1);
  console.log(`Namesake groups: ${namesakes.length}`);

  if (namesakes.length === 0) {
    console.log('No namesakes found! Nothing to patch.');
    return;
  }

  // Collect all playerIds that need birthDate
  const needBirthDate = new Set();
  for (const [name, ids] of namesakes) {
    console.log(`  ${playerNames.get(ids[0])}: ${ids.length} players (IDs: ${ids.join(', ')})`);
    for (const id of ids) needBirthDate.add(id);
  }

  console.log(`\nFetching birthDate for ${needBirthDate.size} players...\n`);

  // Fetch birthDate from individual player API
  const birthDateMap = new Map();
  let count = 0;
  for (const pid of needBirthDate) {
    const data = await fetchJSON(`${WEB_API}/player/${pid}/landing`);
    if (data && data.birthDate) {
      birthDateMap.set(pid, data.birthDate);
      console.log(`  ${playerNames.get(pid)} (#${pid}): ${data.birthDate}`);
    } else {
      console.log(`  ${playerNames.get(pid)} (#${pid}): FAILED`);
    }
    count++;
    await sleep(500);
  }

  console.log(`\nResolved ${birthDateMap.size}/${needBirthDate.size} birthDates`);

  // Update cache files
  let filesUpdated = 0, entriesUpdated = 0;
  for (const file of biosFiles) {
    const path = join(CACHE_DIR, file);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    let changed = false;
    for (const p of data) {
      if (p.playerId && birthDateMap.has(p.playerId)) {
        p.birthDate = birthDateMap.get(p.playerId);
        changed = true;
        entriesUpdated++;
      }
    }
    if (changed) {
      writeFileSync(path, JSON.stringify(data), 'utf8');
      filesUpdated++;
    }
  }

  console.log(`Updated ${entriesUpdated} entries across ${filesUpdated} cache files`);
  console.log('\nDone! Now run:\n  node fetch-all-players.js --merge-only');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
