// =====================================================================
// daily-game.js — NHL Grid Daily -pelilogiikka
// Riippuvuudet: players.js (DB), shared.js (TEAMS, NATS, AWARDS, SPECIALS, PLAYABLE_AWARDS)
// =====================================================================

if (typeof DB === 'undefined') {
  throw new Error('players.js not loaded — DB is undefined');
}

// =====================================================================
// BUILD ELIGIBLE CATEGORY POOL
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
        abbr: info.abbr || info.name,
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
        abbr: info.abbr || info.name,
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
        abbr: info.abbr || info.name,
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
        abbr: info.name,
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
// SEEDED PRNG  (Mulberry32)
// =====================================================================
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getDailySeed() {
  const d = new Date();
  const s = `NHLGRID${d.getUTCFullYear()}${d.getUTCMonth()}${d.getUTCDate()}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function getDayNumber() {
  // Day #1 = 2026-03-15 (launch day), count from then
  const epoch = new Date(Date.UTC(2026, 2, 15)); // month is 0-indexed
  const now = new Date();
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(1, Math.floor((utcNow - epoch) / 86400000) + 1);
}

function getDailyDateLabel() {
  const d = new Date();
  return d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
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
// GRID GENERATION
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
// GAME STATE
// =====================================================================
const MAX_LIVES = 3;
const MAX_HINTS = 3;

let G = {
  players: [],      // 9 player objects, row-major
  rowCats: [],      // 3 correct row category objects
  colCats: [],      // 3 correct col category objects
  rowOptions: [],   // allCats matching each row (for validation)
  colOptions: [],   // allCats matching each col
  solved: [false, false, false, false, false, false], // [r0,r1,r2,c0,c1,c2]
  lives: MAX_LIVES,
  usedCatIds: new Set(),   // correctly guessed categories — globally blocked
  wrongGuesses: {},        // per-line wrong guesses: {"row_0": Set(["nat_CAN"]), ...}
  hints: MAX_HINTS,        // hints remaining
  hintedCells: new Set(),  // indices of cells that have been hinted (0-8)
  selectedLine: null,      // {type:'row'|'col', index:0-2}
  gameOver: false,
  won: false,
  isPractice: false,
  shareText: '',
  allCats: [],
};

// =====================================================================
// LOCALSTORAGE  (persist daily state)
// =====================================================================
function storageKey() {
  const d = new Date();
  return `nhl_daily_${d.getUTCFullYear()}_${d.getUTCMonth()}_${d.getUTCDate()}`;
}

function saveState() {
  if (G.isPractice) return; // Don't persist practice mode
  // Serialize wrongGuesses: {"row_0": ["nat_CAN",...], ...}
  const wg = {};
  Object.entries(G.wrongGuesses).forEach(([k, s]) => { wg[k] = [...s]; });
  const state = {
    solved: G.solved,
    lives: G.lives,
    hints: G.hints,
    hintedCells: [...G.hintedCells],
    usedCatIds: [...G.usedCatIds],
    wrongGuesses: wg,
    gameOver: G.gameOver,
    won: G.won,
    shareText: G.shareText,
  };
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

// =====================================================================
// MAIN INIT
// =====================================================================
window.addEventListener('DOMContentLoaded', function() {
  // Generate puzzle
  const rng = mulberry32(getDailySeed());
  const result = generateDailyGrid(rng);

  document.getElementById('loading-screen').classList.remove('active');

  if (!result) {
    // Extremely unlikely fallback
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('daily-status').textContent = '⚠️ Puzzle-generointi epäonnistui. Kokeile uudelleen.';
    document.getElementById('daily-status').style.color = '#e53935';
    return;
  }

  G.players  = result.players;
  G.rowCats  = result.rowCats;
  G.colCats  = result.colCats;
  G.rowOptions = result.validation.rowOptions;
  G.colOptions = result.validation.colOptions;
  G.allCats  = buildCategoryPool();

  // Labels
  document.getElementById('daily-date-label').textContent = getDailyDateLabel();
  document.getElementById('daily-number-label').textContent = '#' + getDayNumber();

  // Restore wrongGuesses from saved state
  function restoreWrongGuesses(saved) {
    if (saved.wrongGuesses) {
      Object.entries(saved.wrongGuesses).forEach(([k, arr]) => {
        G.wrongGuesses[k] = new Set(arr);
      });
    }
  }

  // Check if already played today
  const saved = loadState();
  if (saved && saved.gameOver) {
    G.solved      = saved.solved;
    G.lives       = saved.lives;
    G.hints       = saved.hints != null ? saved.hints : MAX_HINTS;
    G.hintedCells = new Set(saved.hintedCells || []);
    G.usedCatIds  = new Set(saved.usedCatIds);
    restoreWrongGuesses(saved);
    G.gameOver    = true;
    G.won         = saved.won;
    G.shareText   = saved.shareText;
    showAlreadyPlayed();
    startCountdown();
    return;
  }

  // Resume in-progress game
  if (saved) {
    G.solved     = saved.solved;
    G.lives      = saved.lives;
    G.hints      = saved.hints != null ? saved.hints : MAX_HINTS;
    G.hintedCells = new Set(saved.hintedCells || []);
    G.usedCatIds = new Set(saved.usedCatIds);
    restoreWrongGuesses(saved);
  }

  renderGame();
  startCountdown();
});

// =====================================================================
// RENDER GAME
// =====================================================================
function renderGame() {
  document.getElementById('game-screen').classList.add('active');
  renderLives();
  renderGrid();
  updateProgress();
}

function renderLives() {
  const bar = document.getElementById('lives-bar');
  bar.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const el = document.createElement('span');
    el.className = 'life' + (i >= G.lives ? ' lost' : '');
    el.textContent = '❤️';
    bar.appendChild(el);
  }
  renderHints();
}

function renderHints() {
  const bar = document.getElementById('hints-bar');
  bar.innerHTML = '';
  for (let i = 0; i < MAX_HINTS; i++) {
    const el = document.createElement('span');
    el.className = 'hint-icon' + (i >= G.hints ? ' used' : '');
    el.textContent = '💡';
    if (i < G.hints && !G.gameOver) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => enterHintMode());
    }
    bar.appendChild(el);
  }
}

let hintModeActive = false;

function enterHintMode() {
  if (G.hints <= 0 || G.gameOver || hintModeActive) return;
  hintModeActive = true;
  closeGuessPanel();
  document.getElementById('hint-mode-banner').style.display = 'block';
  // Re-render grid with hintable cells
  renderGrid();
}

function cancelHintMode() {
  hintModeActive = false;
  document.getElementById('hint-mode-banner').style.display = 'none';
  renderGrid();
}

function useHint(cellIdx) {
  if (!hintModeActive || G.hints <= 0) return;
  if (G.hintedCells.has(cellIdx)) return; // already hinted

  G.hints--;
  G.hintedCells.add(cellIdx);
  hintModeActive = false;
  document.getElementById('hint-mode-banner').style.display = 'none';

  renderLives();
  renderGrid();
  saveState();
}

function formatPlayerHint(p) {
  const parts = [];
  if (p.t && p.t.length > 0) {
    const teamNames = p.t.map(k => TEAMS[k] ? TEAMS[k].name : k);
    parts.push('<span class="hint-teams">🏒 ' + teamNames.join(', ') + '</span>');
  }
  if (p.c) {
    const natName = NATS[p.c] ? NATS[p.c].name : p.c;
    parts.push('<span class="hint-nat">🌍 ' + natName + '</span>');
  }
  if (p.a && p.a.length > 0) {
    const playable = p.a.filter(k => PLAYABLE_AWARDS.has(k));
    if (playable.length > 0) {
      const awardNames = playable.map(k => AWARDS[k] ? AWARDS[k].name : k);
      parts.push('<span class="hint-awards">🏆 ' + awardNames.join(', ') + '</span>');
    }
  }
  return parts.join('<br>');
}

function renderGrid() {
  const grid = document.getElementById('daily-grid');
  grid.innerHTML = '';

  // Corner
  const corner = document.createElement('div');
  corner.className = 'grid-corner';
  grid.appendChild(corner);

  // Column headers
  for (let c = 0; c < 3; c++) {
    const el = document.createElement('div');
    el.className = 'col-header' + (G.solved[3+c] ? ' solved' : '');
    el.dataset.type = 'col';
    el.dataset.idx = c;

    if (G.solved[3+c]) {
      const cat = G.colCats[c];
      el.innerHTML = `<div class="header-icon">${cat.icon}</div>
                      <div class="header-name">${cat.abbr}</div>`;
    } else {
      el.innerHTML = `<div class="header-question">?</div>
                      <div class="header-hint">Sarake ${c+1}</div>`;
      el.addEventListener('click', () => selectLine('col', c));
    }
    grid.appendChild(el);
  }

  // Rows
  for (let r = 0; r < 3; r++) {
    // Row header
    const rh = document.createElement('div');
    rh.className = 'row-header' + (G.solved[r] ? ' solved' : '');
    rh.dataset.type = 'row';
    rh.dataset.idx = r;

    if (G.solved[r]) {
      const cat = G.rowCats[r];
      rh.innerHTML = `<div class="header-icon">${cat.icon}</div>
                      <div class="header-name">${cat.abbr}</div>`;
    } else {
      rh.innerHTML = `<div class="header-question">?</div>
                      <div class="header-hint">Rivi ${r+1}</div>`;
      rh.addEventListener('click', () => selectLine('row', r));
    }
    grid.appendChild(rh);

    // 3 player cells
    for (let c = 0; c < 3; c++) {
      const cellIdx = r*3 + c;
      const p = G.players[cellIdx];
      const cell = document.createElement('div');
      const rSolved = G.solved[r];
      const cSolved = G.solved[3+c];
      if (rSolved && cSolved)    cell.className = 'player-cell both-solved';
      else if (rSolved)          cell.className = 'player-cell row-solved';
      else if (cSolved)          cell.className = 'player-cell col-solved';
      else                       cell.className = 'player-cell';

      // If hinted, show full info
      if (G.hintedCells.has(cellIdx)) {
        cell.innerHTML = `<div style="font-weight:700;margin-bottom:2px;">${p.n}</div>
                          <div class="hint-overlay">${formatPlayerHint(p)}</div>`;
      } else {
        cell.textContent = p.n;
      }

      // Hint mode: make unhinted cells clickable
      if (hintModeActive && !G.hintedCells.has(cellIdx)) {
        cell.classList.add('hintable');
        cell.addEventListener('click', ((idx) => () => useHint(idx))(cellIdx));
      }

      grid.appendChild(cell);
    }
  }
}

function updateProgress() {
  const cnt = G.solved.filter(Boolean).length;
  document.getElementById('solved-count').textContent = cnt;
}

// =====================================================================
// LINE SELECTION & GUESS PANEL
// =====================================================================
function selectLine(type, idx) {
  if (G.gameOver) return;
  const lineNum = type === 'row' ? idx : 3 + idx;
  if (G.solved[lineNum]) return;

  // Cancel hint mode if active
  if (hintModeActive) {
    hintModeActive = false;
    document.getElementById('hint-mode-banner').style.display = 'none';
  }

  G.selectedLine = { type, idx };

  // Highlight selected header
  document.querySelectorAll('.col-header, .row-header').forEach(el => {
    el.classList.remove('selected');
  });
  const header = document.querySelector(
    `.${type === 'row' ? 'row' : 'col'}-header[data-idx="${idx}"]`
  );
  if (header) header.classList.add('selected');

  // Show players in this line for context
  const players = type === 'row'
    ? [G.players[idx*3], G.players[idx*3+1], G.players[idx*3+2]]
    : [G.players[idx], G.players[idx+3], G.players[idx+6]];
  const names = players.map(p => p.n).join(', ');

  const panel = document.getElementById('guess-panel');
  const title = document.getElementById('guess-panel-title');
  title.textContent = `Mikä yhdistää: ${names}?`;
  panel.style.display = 'block';

  document.getElementById('guess-search').value = '';
  renderGuessList('');
  document.getElementById('guess-search').focus();
}

function closeGuessPanel() {
  G.selectedLine = null;
  document.getElementById('guess-panel').style.display = 'none';
  document.querySelectorAll('.col-header, .row-header').forEach(el => {
    el.classList.remove('selected');
  });
}

document.getElementById('guess-search').addEventListener('input', function() {
  renderGuessList(this.value.toLowerCase());
});

document.getElementById('guess-search').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    // Find first non-blocked visible item and select it
    const items = document.querySelectorAll('#guess-list .guess-item:not(.used)');
    if (items.length > 0) items[0].click();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeGuessPanel();
});

function renderGuessList(query) {
  const list = document.getElementById('guess-list');
  list.innerHTML = '';

  // Blocked status depends on current line
  const curLineKey = G.selectedLine ? `${G.selectedLine.type}_${G.selectedLine.idx}` : '';
  const curWrong = G.wrongGuesses[curLineKey] || new Set();

  // Filter and sort: available first, then wrong-here, then globally used
  const filtered = G.allCats
    .filter(cat => {
      if (query.length > 0) {
        return cat.name.toLowerCase().includes(query) ||
               cat.abbr.toLowerCase().includes(query) ||
               cat.group.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      // 0 = available, 1 = wrong here, 2 = globally used
      const aScore = G.usedCatIds.has(a.id) ? 2 : curWrong.has(a.id) ? 1 : 0;
      const bScore = G.usedCatIds.has(b.id) ? 2 : curWrong.has(b.id) ? 1 : 0;
      if (aScore !== bScore) return aScore - bScore;
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.name.localeCompare(b.name);
    });

  const shown = filtered.slice(0, 60); // cap at 60 for performance

  // Determine which categories are blocked for the current line
  const lineKey = G.selectedLine ? `${G.selectedLine.type}_${G.selectedLine.idx}` : '';
  const wrongForLine = G.wrongGuesses[lineKey] || new Set();

  shown.forEach(cat => {
    const el = document.createElement('div');
    const isGloballyUsed = G.usedCatIds.has(cat.id);  // correct guess elsewhere
    const isWrongHere = wrongForLine.has(cat.id);      // already tried wrong here
    const isBlocked = isGloballyUsed || isWrongHere;
    el.className = 'guess-item' + (isBlocked ? ' used' : '');
    el.innerHTML = `<span class="gi-icon">${cat.icon}</span>
                    <span>${cat.abbr}</span>
                    <span class="gi-group">${isGloballyUsed ? '✓ Käytetty' : isWrongHere ? '✗ Kokeiltu' : cat.group}</span>`;
    if (!isBlocked) {
      el.addEventListener('click', () => makeGuess(cat));
    }
    list.appendChild(el);
  });

  if (shown.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#555;padding:12px;font-size:13px;">Ei tuloksia</div>';
  }
}

// =====================================================================
// GUESS LOGIC
// =====================================================================
function makeGuess(cat) {
  if (!G.selectedLine || G.gameOver) return;
  // Block if globally used (correct elsewhere) or already wrong for this line
  if (G.usedCatIds.has(cat.id)) return;
  const lineKey = `${G.selectedLine.type}_${G.selectedLine.idx}`;
  if (G.wrongGuesses[lineKey] && G.wrongGuesses[lineKey].has(cat.id)) return;

  const { type, idx } = G.selectedLine;

  // Find which line's options to check
  let options;
  if (type === 'row') {
    options = G.rowOptions[idx];
  } else {
    options = G.colOptions[idx];
  }

  // Is this category valid for the selected line?
  const isValid = options.some(opt => opt.id === cat.id);

  if (isValid) {
    // Correct!
    const lineNum = type === 'row' ? idx : 3 + idx;
    G.solved[lineNum] = true;
    G.usedCatIds.add(cat.id);

    // Replace the "intended" category with the player's actual correct guess
    // (they might have guessed a different valid category)
    if (type === 'row') G.rowCats[idx] = cat;
    else G.colCats[idx] = cat;

    showStatus(`✓ ${cat.icon} ${cat.abbr}`, 'correct');

    // Flash header green
    const headerSel = `.${type === 'row' ? 'row' : 'col'}-header[data-idx="${idx}"]`;
    const header = document.querySelector(headerSel);
    if (header) {
      header.classList.remove('selected', 'wrong-flash');
      header.classList.add('pop-in');
    }

    closeGuessPanel();
    renderGrid();
    updateProgress();
    renderLives();
    saveState();

    // Check win
    const solvedCount = G.solved.filter(Boolean).length;
    if (solvedCount === 6) {
      G.gameOver = true;
      G.won = true;
      buildShareText();
      saveState();
      setTimeout(showEndScreen, 700);
    }

  } else {
    // Wrong — block this category only for THIS line, not globally
    G.lives--;
    const lineKey = `${type}_${idx}`;
    if (!G.wrongGuesses[lineKey]) G.wrongGuesses[lineKey] = new Set();
    G.wrongGuesses[lineKey].add(cat.id);

    showStatus(`✗ ${cat.icon} ${cat.abbr} — ei sovi kaikkiin kolmeen`, 'wrong');

    // Flash header red
    const headerSel = `.${type === 'row' ? 'row' : 'col'}-header[data-idx="${idx}"]`;
    const header = document.querySelector(headerSel);
    if (header) {
      header.classList.remove('selected');
      header.classList.add('wrong-flash');
      setTimeout(() => header.classList.remove('wrong-flash'), 600);
    }

    renderLives();
    renderGuessList(document.getElementById('guess-search').value.toLowerCase());
    saveState();

    // Close guess panel after wrong guess so player can't submit to deselected line
    setTimeout(() => {
      if (!G.gameOver) closeGuessPanel();
    }, 600);

    // Check game over
    if (G.lives <= 0) {
      G.gameOver = true;
      G.won = false;
      buildShareText();
      saveState();
      setTimeout(() => {
        closeGuessPanel();
        showEndScreen();
      }, 800);
    }
  }
}

function showStatus(msg, cls) {
  const el = document.getElementById('daily-status');
  el.textContent = msg;
  el.className = 'daily-status ' + (cls || '');
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => { el.textContent = ''; el.className = 'daily-status'; }, 3500);
}

// =====================================================================
// END / SHARE
// =====================================================================
function buildShareText() {
  const dayNum = getDayNumber();
  const livesLeft = G.lives;
  const solvedCount = G.solved.filter(Boolean).length;

  // Emoji grid: row symbols + col symbols
  const rowEmoji  = G.solved.slice(0, 3).map(s => s ? '✅' : '❌').join('');
  const colEmoji  = G.solved.slice(3, 6).map(s => s ? '✅' : '❌').join('');

  const hintsUsed = MAX_HINTS - G.hints;
  const result = G.won ? '🏆' : '💔';
  G.shareText =
    `NHL Grid Daily #${dayNum} ${result}\n` +
    `Rivit:    ${rowEmoji}\n` +
    `Sarakkeet: ${colEmoji}\n` +
    `${solvedCount}/6 | ${'❤️'.repeat(livesLeft)} | 💡${hintsUsed}/${MAX_HINTS}\n` +
    `https://tatomaatti.github.io/nhl-grid/daily.html`;
}

function shareResult() {
  if (!G.shareText) buildShareText();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(G.shareText).then(() => {
      const btn = document.querySelector('.share-btn');
      const orig = btn.textContent;
      btn.textContent = '✓ Kopioitu!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  }
}

function buildSolutionGrid(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  // Corner
  const corner = document.createElement('div');
  corner.className = 'sol-corner';
  container.appendChild(corner);

  // Col headers
  for (let c = 0; c < 3; c++) {
    const el = document.createElement('div');
    el.className = 'sol-col-header';
    const cat = G.colCats[c];
    el.innerHTML = `<div>${cat.icon}</div><div style="font-size:9px;line-height:1.2;">${cat.abbr}</div>`;
    container.appendChild(el);
  }

  // Rows
  for (let r = 0; r < 3; r++) {
    const rh = document.createElement('div');
    rh.className = 'sol-row-header';
    const cat = G.rowCats[r];
    rh.innerHTML = `<div>${cat.icon}</div><div style="font-size:9px;line-height:1.2;">${cat.abbr}</div>`;
    container.appendChild(rh);

    for (let c = 0; c < 3; c++) {
      const cell = document.createElement('div');
      cell.className = 'sol-cell';
      cell.textContent = G.players[r*3+c].n;
      container.appendChild(cell);
    }
  }
}

function showEndScreen() {
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('end-screen').classList.add('active');

  const solvedCount = G.solved.filter(Boolean).length;
  document.getElementById('end-emoji').textContent = G.won ? '🏆' : '💔';
  document.getElementById('end-subtitle').textContent = G.won
    ? 'Loistava suoritus!'
    : G.isPractice ? 'Kokeile uudelleen!' : 'Ei tällä kertaa. Tule huomenna takaisin!';
  document.getElementById('end-solved').textContent = solvedCount + '/6';
  document.getElementById('end-lives').textContent = G.lives;
  document.getElementById('end-hints').textContent = (MAX_HINTS - G.hints);

  buildSolutionGrid('solution-grid');
}

function showAlreadyPlayed() {
  document.getElementById('played-screen').classList.add('active');
  buildSolutionGrid('played-solution-grid');
}

// =====================================================================
// COUNTDOWN TO NEXT PUZZLE
// =====================================================================
function startCountdown() {
  function tick() {
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1
    ));
    const diff = nextMidnight - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const str = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    ['next-timer', 'played-next-timer'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = str;
    });
  }
  tick();
  setInterval(tick, 1000);
}

// =====================================================================
// PRACTICE MODE — random puzzle, no localStorage, unlimited replays
// =====================================================================
let practiceCounter = 0;

function startPractice() {
  practiceCounter++;

  // Generate a random puzzle using a unique seed
  const seed = Date.now() ^ (practiceCounter * 0xDEADBEEF);
  const rng = mulberry32(seed);
  const result = generateDailyGrid(rng);

  if (!result) {
    alert('Puzzle-generointi epäonnistui. Kokeile uudelleen.');
    return;
  }

  // Reset game state
  G.players    = result.players;
  G.rowCats    = result.rowCats;
  G.colCats    = result.colCats;
  G.rowOptions = result.validation.rowOptions;
  G.colOptions = result.validation.colOptions;
  G.allCats    = buildCategoryPool();
  G.solved     = [false, false, false, false, false, false];
  G.lives      = MAX_LIVES;
  G.hints      = MAX_HINTS;
  G.hintedCells = new Set();
  G.usedCatIds = new Set();
  G.wrongGuesses = {};
  G.selectedLine = null;
  hintModeActive = false;
  G.gameOver   = false;
  G.won        = false;
  G.shareText  = '';
  G.isPractice = true;

  // Update header
  document.getElementById('daily-date-label').textContent = 'Harjoittelu';
  document.getElementById('daily-number-label').textContent = '#' + practiceCounter;

  // Hide other screens, show game
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('game-screen').classList.add('active');
  document.getElementById('guess-panel').style.display = 'none';
  document.getElementById('hint-mode-banner').style.display = 'none';
  document.getElementById('daily-status').textContent = '';
  document.getElementById('daily-status').className = 'daily-status';

  renderLives();
  renderGrid();
  updateProgress();
}

// =====================================================================
// MOBILE UX — visualViewport keyboard handling
// =====================================================================
if (window.visualViewport) {
  let lastKeyboardHeight = 0;

  window.visualViewport.addEventListener('resize', () => {
    const keyboardHeight = Math.round(window.innerHeight - window.visualViewport.height);
    const guessPanel = document.getElementById('guess-panel');
    const isPanelOpen = guessPanel && guessPanel.style.display !== 'none';

    console.log('[MobileUX] keyboard height:', keyboardHeight, 'panel open:', isPanelOpen);

    if (isPanelOpen && keyboardHeight > 50) {
      // Shift guess panel up so search input stays visible above keyboard
      const shift = Math.min(keyboardHeight, window.innerHeight * 0.5);
      guessPanel.style.transform = `translateY(-${shift}px)`;
      guessPanel.style.transition = 'transform 0.15s ease-out';
      console.log('[MobileUX] panel shift:', shift);
    } else if (keyboardHeight <= 50 && lastKeyboardHeight > 50) {
      // Keyboard closed — reset position
      if (guessPanel) {
        guessPanel.style.transform = '';
        guessPanel.style.transition = 'transform 0.15s ease-out';
      }
      console.log('[MobileUX] panel reset');
    }

    lastKeyboardHeight = keyboardHeight;
  });
}
