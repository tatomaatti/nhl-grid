// =====================================================================
// grid-game.js — NHL Grid Ristinolla -pelilogiikka
// Riippuvuudet: players.js (DB), shared.js (TEAMS, NATS, AWARDS),
//               config.js (FIREBASE_CONFIG), Firebase SDK (compat)
// =====================================================================

// Check that players.js loaded correctly
if (typeof DB === 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    const _t = typeof t === 'function' ? t : function(k) { return k; };
    document.body.innerHTML = `
      <div style="font-family:sans-serif;max-width:480px;margin:60px auto;padding:24px;background:#1a1a2e;color:#eee;border-radius:12px;text-align:center">
        <div style="font-size:48px">❌</div>
        <h2 style="color:#ff6b6b">${_t('db_missing_title')}</h2>
        <p>${_t('db_missing_text')}</p>
        <p style="color:#aaa;font-size:14px">${_t('db_missing_hint')}</p>
        <pre style="background:#111;padding:12px;border-radius:8px;text-align:left;font-size:13px">📁 sama kansio/\n  ├── index.html\n  └── players.js</pre>
      </div>`;
  });
  throw new Error('players.js not loaded — DB is undefined');
}

// =====================================================================
// FIREBASE INITIALIZATION
// =====================================================================
const firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
const firebaseDb = firebase.database();

function catInfo(key) {
  return TEAMS[key] || NATS[key] || AWARDS[key] || {name:key,icon:"?",abbr:key};
}

function catHeaderHTML(key, info) {
  const loc = (typeof catLang === 'function') ? catLang(info) : info;
  const desc = loc.desc;
  const infoBtn = desc
    ? `<div class="cat-info-btn">ℹ︎<span class="cat-tooltip">${desc}</span></div>`
    : '';
  return `<div class="cat-info-wrap">
    <div class="cat-icon">${info.icon}</div>
    <div class="cat-abbr">${loc.abbr}</div>
    ${infoBtn}
  </div>`;
}

function playerMatchesCat(p, key) {
  if (TEAMS[key])  return p.t.includes(key);
  if (NATS[key])   return p.c === key;
  if (AWARDS[key]) return Array.isArray(p.a) && p.a.includes(key);
  return false;
}

function validPlayersForCell(rowKey, colKey) {
  return DB.filter(p => playerMatchesCat(p, rowKey) && playerMatchesCat(p, colKey));
}

// =====================================================================
// SETTINGS STATE
// =====================================================================
let CFG = {
  timeLimit: 60,
  allowReuse: false,
  stealEnabled: true,
  stealsPerPlayer: 1,
  useNat: false,
  useAwards: false,
  teamWeight: 4,
  natWeight: 3,
  awardWeight: 3,
  hintsEnabled: false,
  hintsPerPlayer: 1,
  bestOf: 0,         // 0=unlimited, 3, 5, 7
  onlineMode: false,
};

document.querySelectorAll('#time-options .option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#time-options .option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    CFG.timeLimit = parseInt(btn.dataset.value);
  });
});
document.querySelectorAll('#bestof-options .option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#bestof-options .option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    CFG.bestOf = parseInt(btn.dataset.value);
  });
});

function toggleOpt(key) {
  const map = {reuse:'tog-reuse', steal:'tog-steal', nat:'tog-nat', awards:'tog-awards', hints:'tog-hints'};
  if (key === 'reuse')  { CFG.allowReuse   = !CFG.allowReuse; }
  if (key === 'steal')  { CFG.stealEnabled = !CFG.stealEnabled; document.getElementById('steal-count-row').classList.toggle('visible', CFG.stealEnabled); }
  if (key === 'nat')    { CFG.useNat    = !CFG.useNat; document.getElementById('weight-row-nat').classList.toggle('visible', CFG.useNat); }
  if (key === 'awards') { CFG.useAwards = !CFG.useAwards; document.getElementById('weight-row-awards').classList.toggle('visible', CFG.useAwards); }
  if (key === 'hints')  { CFG.hintsEnabled = !CFG.hintsEnabled; document.getElementById('hint-count-row').classList.toggle('visible', CFG.hintsEnabled); }
  const states = {reuse:CFG.allowReuse, steal:CFG.stealEnabled, nat:CFG.useNat, awards:CFG.useAwards, hints:CFG.hintsEnabled};
  document.getElementById(map[key]).classList.toggle('on', states[key]);
}
function setStealCount(n) {
  CFG.stealsPerPlayer = n;
  [1,2,3].forEach(i => document.getElementById('sc-'+i).classList.toggle('active', i===n));
}
function setWeight(cat, val) {
  if (cat === 'team')   CFG.teamWeight   = val;
  if (cat === 'nat')    CFG.natWeight    = val;
  if (cat === 'awards') CFG.awardWeight  = val;
  const btns = document.getElementById('wb-' + cat).querySelectorAll('button');
  btns.forEach((b, i) => b.classList.toggle('active', i + 1 === val));
}
function setHintCount(n) {
  CFG.hintsPerPlayer = n;
  [1,2,3].forEach(i => document.getElementById('hc-'+i).classList.toggle('active', i===n));
  document.getElementById('hc-inf').classList.toggle('active', n===0);
}

// =====================================================================
// GRID GENERATION
// =====================================================================
const BASE_NAT_WEIGHTS   = {CAN:5, USA:5, SWE:4, FIN:4, RUS:4, CZE:2, SVK:1, GER:1};
const BASE_AWARD_WEIGHTS = {
  Hart:5, Vezina:5, Norris:5, RocketRichard:5, Calder:5, ConnSmythe:5,
  StanleyCup:4, ArtRoss:2, TedLindsay:2, Selke:2,
};

function buildWeightedPool() {
  const pool = [];
  const teamCopies = Math.max(1, Math.round(4 * CFG.teamWeight / 3));
  for (const k of Object.keys(TEAMS))
    for (let i = 0; i < teamCopies; i++) pool.push(k);
  if (CFG.useNat)
    for (const k of Object.keys(NATS)) {
      const copies = Math.max(1, Math.round((BASE_NAT_WEIGHTS[k] || 1) * CFG.natWeight / 3));
      for (let i = 0; i < copies; i++) pool.push(k);
    }
  if (CFG.useAwards)
    for (const k of Object.keys(AWARDS)) {
      const copies = Math.max(1, Math.round((BASE_AWARD_WEIGHTS[k] || 1) * CFG.awardWeight / 3));
      for (let i = 0; i < copies; i++) pool.push(k);
    }
  return pool;
}

function weightedPick6(pool) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = [];
  for (const k of shuffled) {
    if (!picked.includes(k)) picked.push(k);
    if (picked.length === 6) break;
  }
  return picked.length === 6 ? picked : null;
}

function compatible(a, b) {
  return !(NATS[a] && NATS[b] && a !== b);
}

function generateGrid() {
  const pool = buildWeightedPool();
  let best = null;
  const MAX = 1200;
  for (let attempt = 0; attempt < MAX; attempt++) {
    const picked = weightedPick6(pool);
    if (!picked) continue;
    const rows = picked.slice(0, 3);
    const cols = picked.slice(3, 6);
    let ok = true, minCount = Infinity;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!compatible(rows[r], cols[c])) { ok = false; break; }
        const count = validPlayersForCell(rows[r], cols[c]).length;
        if (count === 0) { ok = false; break; }
        minCount = Math.min(minCount, count);
      }
      if (!ok) break;
    }
    if (ok) {
      if (!best || minCount > best.minCount) {
        best = { cols, rows, minCount };
        if (minCount >= 2) break;
      }
    }
  }
  return best;
}

// =====================================================================
// GAME STATE
// =====================================================================
let G = {};
let sugHighlightIdx = -1;

// =====================================================================
// ONLINE STATE
// =====================================================================
let NET = {
  roomRef: null,       // Firebase database reference to /rooms/{code}
  unsubscribe: null,   // onValue listener cleanup function
  isHost: false,
  roomCode: null,
  seriesScores: [0, 0],  // [p1 wins, p2 wins]
  currentRound: 1,
  myPlayerNum: 0,         // 1 = host, 2 = guest
  moveCounter: 0,         // monotonic counter to detect new moves
  lastProcessed: 0,       // last moveCounter we handled
};

// =====================================================================
// SCREEN MANAGEMENT
// =====================================================================
function showScreen(id) {
  ['settings-screen','lobby-screen','game-screen','win-screen','disconnect-screen'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById('round-overlay').classList.remove('visible');
  const el = document.getElementById(id);
  if (el) el.style.display = (id === 'game-screen') ? 'flex' : (id === 'win-screen') ? 'flex' : (id === 'lobby-screen') ? 'flex' : (id === 'disconnect-screen') ? 'flex' : 'block';
}

// =====================================================================
// START GAME (local)
// =====================================================================
function startGame() {
  CFG.onlineMode = false;
  NET.seriesScores = [0, 0];
  NET.currentRound = 1;
  launchRound();
}

function launchRound() {
  const grid = generateGrid();
  if (!grid) {
    alert(t('grid_gen_fail'));
    return;
  }
  initGameState(grid);
  showScreen('game-screen');
  clearGameUI();
  updatePlayerLabels();
  updateSeriesBar();
  if (CFG.stealEnabled) document.getElementById('steal-bar').classList.add('visible');
  else document.getElementById('steal-bar').classList.remove('visible');
  renderGrid();
  refreshUI();
  startTimer();
}

function initGameState(grid) {
  // Alternating start: odd rounds → P1, even rounds → P2
  const startingPlayer = (NET.currentRound % 2 === 1) ? 1 : 2;
  G = {
    grid,
    cells: Array(9).fill(null).map(() => ({ owner: 0, player: null })),
    turn: startingPlayer,
    selected: null,
    usedPlayers: new Set(),
    stealsLeft: { 1: CFG.stealsPerPlayer, 2: CFG.stealsPerPlayer },
    timerInterval: null,
    timeLeft: CFG.timeLimit,
    stealMode: false,
    hintsLeft: { 1: CFG.hintsPerPlayer, 2: CFG.hintsPerPlayer },
  };
}

function clearGameUI() {
  setStatus('', '');
  document.getElementById('hint-display').textContent = '';
  const inp = document.getElementById('search-input');
  inp.value = '';
  inp.disabled = true;
  inp.placeholder = t('select_cell_first');
  document.getElementById('suggestions').style.display = 'none';
  document.querySelector('.win-trophy').textContent = '🏆';
  document.querySelector('.win-title').textContent = t('winner');
}

function updatePlayerLabels() {
  const p1 = document.getElementById('p1-label');
  const p2 = document.getElementById('p2-label');
  if (CFG.onlineMode) {
    if (NET.myPlayerNum === 1) {
      p1.textContent = t('you_label');
      p2.textContent = t('opponent');
    } else {
      p1.textContent = t('opponent');
      p2.textContent = t('you_label');
    }
  } else {
    p1.textContent = t('player_1');
    p2.textContent = t('player_2');
  }
}

function updateSeriesBar() {
  const bar = document.getElementById('series-bar');
  if (CFG.bestOf === 0 && NET.currentRound === 1 && !CFG.onlineMode) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'block';
  const label = CFG.bestOf > 0 ? `Best of ${CFG.bestOf}` : t('free_series');
  bar.textContent = t('round_format', NET.currentRound, label, NET.seriesScores[0], NET.seriesScores[1]);
}

function goMenu() {
  stopTimer();
  cleanupRoom();
  CFG.onlineMode = false;
  NET.seriesScores = [0, 0];
  NET.currentRound = 1;
  showScreen('settings-screen');
  // Clean URL params
  if (window.location.search) history.replaceState({}, '', window.location.pathname);
}

function openSurrenderModal() {
  document.getElementById('surrender-modal').classList.add('visible');
}
function closeSurrenderModal() {
  document.getElementById('surrender-modal').classList.remove('visible');
}
function confirmSurrender() {
  closeSurrenderModal();
  if (CFG.onlineMode && NET.roomRef) {
    sendMsg({ type: 'SURRENDER' });
  }
  goMenu();
}

// =====================================================================
// GRID RENDER
// =====================================================================
function renderGrid() {
  const {cols, rows} = G.grid;
  const el = document.getElementById('grid');
  el.innerHTML = '';
  el.innerHTML += `<div class="corner"></div>`;
  cols.forEach(k => {
    const i = catInfo(k);
    el.innerHTML += `<div class="col-header">${catHeaderHTML(k, i)}</div>`;
  });
  for (let r = 0; r < 3; r++) {
    const ri = catInfo(rows[r]);
    el.innerHTML += `<div class="row-header">${catHeaderHTML(rows[r], ri)}</div>`;
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      el.innerHTML += `<div class="cell" id="cell-${idx}" onclick="clickCell(${idx})">
        <span class="cell-plus">+</span>
        <span class="cell-find">${t('find_player')}</span>
      </div>`;
    }
  }
}

function refreshCells() {
  for (let i = 0; i < 9; i++) {
    const cell = G.cells[i];
    const el = document.getElementById('cell-' + i);
    if (!el) continue;
    el.className = 'cell';
    el.innerHTML = '';

    if (cell.owner) {
      el.classList.add(cell.owner === 1 ? 'p1' : 'p2');
      el.innerHTML = `<div class="cell-owner-dot" style="background:${cell.owner===1?'#4fc3f7':'#ff6b6b'}"></div>
        <div class="cell-player">${cell.player}</div>`;
      if (CFG.stealEnabled && cell.owner !== G.turn && G.stealsLeft[G.turn] > 0 && isMyTurn()) {
        el.innerHTML += `<div class="steal-tag">${t('steal_tag')}</div>`;
      }
    } else {
      el.innerHTML = `<span class="cell-plus">+</span><span class="cell-find">${t('find_player')}</span>`;
    }

    if (i === G.selected) el.classList.add('selected');

    // No-action: own cell, opp cell with no steals, or not my turn
    if (!isMyTurn()) {
      el.classList.add('no-action');
    } else {
      if (cell.owner === G.turn) el.classList.add('no-action');
      if (cell.owner && cell.owner !== G.turn && (!CFG.stealEnabled || G.stealsLeft[G.turn] <= 0)) el.classList.add('no-action');
    }
  }
}

function refreshUI() {
  const cp = G.turn;
  document.getElementById('p1-info').classList.toggle('active', cp === 1);
  document.getElementById('p2-info').classList.toggle('active', cp === 2);
  const p1c = G.cells.filter(c => c.owner === 1).length;
  const p2c = G.cells.filter(c => c.owner === 2).length;
  document.getElementById('p1-score').textContent = p1c;
  document.getElementById('p2-score').textContent = p2c;

  // Turn name
  const tn = document.getElementById('turn-name');
  if (CFG.onlineMode) {
    if (isMyTurn()) {
      tn.textContent = t('your_turn');
      tn.style.color = '#4fc3f7';
    } else {
      tn.textContent = t('opponent_turn');
      tn.style.color = '#ff6b6b';
    }
  } else {
    tn.textContent = t('player_turn', cp);
    tn.style.color = cp === 1 ? '#4fc3f7' : '#ff6b6b';
  }

  if (CFG.stealEnabled) {
    document.getElementById('p1-steals').textContent = G.stealsLeft[1];
    document.getElementById('p2-steals').textContent = G.stealsLeft[2];
  }

  // Disable search when not my turn (online)
  if (CFG.onlineMode && !isMyTurn()) {
    const inp = document.getElementById('search-input');
    inp.disabled = true;
    inp.placeholder = t('opponent_turn');
  }

  refreshCells();
  updateTimerDisplay();
  updateHintBar();
  updateSeriesBar();
}

// =====================================================================
// ONLINE HELPER: is it my turn?
// =====================================================================
function isMyTurn() {
  if (!CFG.onlineMode) return true;  // local = always your turn
  return G.turn === NET.myPlayerNum;
}

// =====================================================================
// CELL INTERACTION
// =====================================================================
function clickCell(idx) {
  if (!isMyTurn()) return;
  const cell = G.cells[idx];
  if (cell.owner === G.turn) return;
  if (cell.owner && cell.owner !== G.turn) {
    if (!CFG.stealEnabled || G.stealsLeft[G.turn] <= 0) return;
    G.stealMode = true;
    setStatus(t('steal_status', cell.owner === 1 ? '1' : '2'), '');
  } else {
    G.stealMode = false;
    setStatus('', '');
  }

  const prevSelected = G.selected;
  G.selected = idx;
  sugHighlightIdx = -1;
  if (prevSelected !== idx) {
    document.getElementById('hint-display').textContent = '';
  }
  refreshUI();

  const inp = document.getElementById('search-input');
  inp.disabled = false;
  inp.placeholder = t('search_placeholder');
  inp.value = '';
  inp.focus();
  document.getElementById('suggestions').style.display = 'none';
}

// =====================================================================
// SEARCH & AUTOCOMPLETE
// =====================================================================
document.getElementById('search-input').addEventListener('input', function () {
  if (!isMyTurn()) { this.value = ''; return; }
  const val = this.value.trim().toLowerCase();
  const sug = document.getElementById('suggestions');
  if (!val || G.selected === null) { sug.style.display = 'none'; sugHighlightIdx = -1; return; }

  const matches = DB.filter(p => p.n.toLowerCase().includes(val)).slice(0, 8);
  if (!matches.length) { sug.style.display = 'none'; sugHighlightIdx = -1; return; }

  sug.innerHTML = matches.map((p, i) => {
    const isUsed = !CFG.allowReuse && G.usedPlayers.has(p.n);
    const esc    = p.n.replace(/'/g, "\\'");
    return `<div class="sug-item${i === 0 ? ' highlighted' : ''}" data-name="${p.n}" onclick="submitPlayer('${esc}')">
      <span>${p.n}${isUsed ? ' <span class="sug-used">' + t('used_label') + '</span>' : ''}</span>
    </div>`;
  }).join('');
  sugHighlightIdx = 0;
  sug.style.display = 'block';
});

document.getElementById('search-input').addEventListener('keydown', function (e) {
  const sug  = document.getElementById('suggestions');
  const items = Array.from(sug.querySelectorAll('.sug-item'));
  const open  = sug.style.display !== 'none' && items.length > 0;

  if (e.key === 'ArrowDown') {
    if (!open) return;
    e.preventDefault();
    sugHighlightIdx = Math.min(sugHighlightIdx + 1, items.length - 1);
    updateSugHighlight(items);
  } else if (e.key === 'ArrowUp') {
    if (!open) return;
    e.preventDefault();
    sugHighlightIdx = Math.max(sugHighlightIdx - 1, -1);
    updateSugHighlight(items);
  } else if (e.key === 'Enter') {
    if (open) {
      const target = sugHighlightIdx >= 0 ? items[sugHighlightIdx] : items[0];
      if (target) submitPlayer(target.dataset.name);
    } else {
      const v = this.value.trim();
      if (v) submitPlayer(v);
    }
  } else if (e.key === 'Escape') {
    sug.style.display = 'none';
    sugHighlightIdx = -1;
  }
});

function updateSugHighlight(items) {
  items.forEach((el, i) => el.classList.toggle('highlighted', i === sugHighlightIdx));
  if (sugHighlightIdx >= 0 && items[sugHighlightIdx]) {
    items[sugHighlightIdx].scrollIntoView({ block: 'nearest' });
  }
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    document.getElementById('suggestions').style.display = 'none';
    sugHighlightIdx = -1;
  }
});

// =====================================================================
// SUBMIT PLAYER
// =====================================================================
function submitPlayer(name) {
  document.getElementById('suggestions').style.display = 'none';
  document.getElementById('search-input').value = '';
  if (G.selected === null) return;

  // ONLINE GUEST: send move to host, don't validate locally
  if (CFG.onlineMode && !NET.isHost) {
    sendMsg({ type: 'MOVE', cell: G.selected, playerName: name });
    // Disable input while waiting for host response
    const inp = document.getElementById('search-input');
    inp.disabled = true;
    inp.placeholder = t('waiting_label');
    return;
  }

  // HOST or LOCAL: validate locally
  validateAndApplyMove(G.selected, name, G.turn);
}

function validateAndApplyMove(idx, name, turn) {
  const r = Math.floor(idx / 3), c = idx % 3;
  const rowKey = G.grid.rows[r], colKey = G.grid.cols[c];

  const player = DB.find(p => p.n.toLowerCase() === name.toLowerCase());
  if (!player) {
    handleWrongGuess(t('player_not_found', name), turn);
    return;
  }

  if (!CFG.allowReuse && G.usedPlayers.has(player.n)) {
    handleWrongGuess(t('player_already_used', player.n), turn);
    return;
  }

  if (!playerMatchesCat(player, rowKey) || !playerMatchesCat(player, colKey)) {
    const ri = catInfo(rowKey), ci = catInfo(colKey);
    const rLoc = (typeof catLang === 'function') ? catLang(ri) : ri;
    const cLoc = (typeof catLang === 'function') ? catLang(ci) : ci;
    handleWrongGuess(t('wrong_guess', player.n, rLoc.abbr, cLoc.abbr), turn);
    return;
  }

  if (G.stealMode && G.cells[idx].player === player.n) {
    handleWrongGuess(t('steal_need_different'), turn);
    return;
  }

  // ✅ Valid!
  const wasSteal = G.stealMode;
  if (G.stealMode) G.stealsLeft[turn]--;
  G.cells[idx] = { owner: turn, player: player.n };
  G.usedPlayers.add(player.n);

  // Broadcast to peer if online host
  if (CFG.onlineMode && NET.isHost) {
    sendMsg({
      type: 'CELL_CLAIMED', cell: idx, playerName: player.n, owner: turn,
      wasSteal, stealsLeft: G.stealsLeft[turn],
    });
  }

  setStatus(`✓ ${player.n}`, 'correct');
  G.selected = null;
  G.stealMode = false;

  const winner = checkWin();
  if (winner) {
    refreshUI();
    setTimeout(() => handleRoundEnd(winner), 900);
    return;
  }
  if (isBoardFull()) {
    refreshUI();
    setTimeout(() => handleRoundEnd(0), 900);  // 0 = draw
    return;
  }

  endTurn();
}

function handleWrongGuess(msg, turn) {
  // Only show message to the current player (in online, only local)
  if (CFG.onlineMode) {
    if (turn === NET.myPlayerNum) {
      setStatus(msg, 'wrong');
    }
    // Host broadcasts turn change (no details — privacy!)
    if (NET.isHost) {
      const nextTurn = turn === 1 ? 2 : 1;
      sendMsg({ type: 'TURN_CHANGE', turn: nextTurn, reason: 'wrong' });
    }
  } else {
    setStatus(msg, 'wrong');
  }
  endTurn();
}

// =====================================================================
// TURN & TIMER
// =====================================================================
function endTurn() {
  const inp = document.getElementById('search-input');
  inp.disabled = true;
  inp.placeholder = t('select_cell_first');
  inp.value = '';
  G.selected = null;
  G.stealMode = false;
  document.getElementById('hint-display').textContent = '';
  G.turn = G.turn === 1 ? 2 : 1;
  refreshUI();
  resetTimer();
}

function startTimer() {
  stopTimer();
  if (CFG.timeLimit === 0) return;
  G.timerInterval = setInterval(() => {
    G.timeLeft--;
    updateTimerDisplay();
    if (G.timeLeft <= 0) {
      if (CFG.onlineMode) {
        if (NET.isHost) {
          // Host is authoritative for timer
          setStatus(t('time_up'), 'wrong');
          const nextTurn = G.turn === 1 ? 2 : 1;
          sendMsg({ type: 'TURN_CHANGE', turn: nextTurn, reason: 'timeout' });
          endTurn();
        }
        // Guest: host will send TURN_CHANGE, don't do anything
      } else {
        setStatus(t('time_up'), 'wrong');
        endTurn();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (G.timerInterval) { clearInterval(G.timerInterval); G.timerInterval = null; }
}

function resetTimer() {
  stopTimer();
  G.timeLeft = CFG.timeLimit;
  updateTimerDisplay();
  startTimer();
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-val');
  el.textContent = CFG.timeLimit === 0 ? '∞' : G.timeLeft;
  el.classList.toggle('urgent', CFG.timeLimit > 0 && G.timeLeft <= 10);
}

// =====================================================================
// WIN CHECK
// =====================================================================
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkWin() {
  for (const [a,b,c] of LINES) {
    const oa = G.cells[a].owner, ob = G.cells[b].owner, oc = G.cells[c].owner;
    if (oa && oa === ob && ob === oc) {
      [a,b,c].forEach(i => document.getElementById('cell-'+i)?.classList.add('win-flash'));
      return oa;
    }
  }
  return null;
}

function isBoardFull() {
  return G.cells.every(c => c.owner !== 0);
}

// =====================================================================
// ROUND END / SERIES MANAGEMENT
// =====================================================================
function handleRoundEnd(winner) {
  stopTimer();
  if (winner > 0) {
    NET.seriesScores[winner - 1]++;
  }

  // Broadcast round result if host
  if (CFG.onlineMode && NET.isHost) {
    if (winner > 0) {
      sendMsg({ type: 'ROUND_WON', winner, scores: [...NET.seriesScores] });
    } else {
      sendMsg({ type: 'DRAW', scores: [...NET.seriesScores] });
    }
  }

  // Check if series is decided
  const seriesWinner = checkSeriesWinner();
  if (seriesWinner) {
    showSeriesEnd(seriesWinner);
    if (CFG.onlineMode && NET.isHost) {
      sendMsg({ type: 'SERIES_END', winner: seriesWinner, scores: [...NET.seriesScores] });
    }
    return;
  }

  // Show round overlay
  showRoundOverlay(winner);
}

function checkSeriesWinner() {
  if (CFG.bestOf === 0) return null;  // unlimited = never ends
  const needed = Math.ceil(CFG.bestOf / 2);
  if (NET.seriesScores[0] >= needed) return 1;
  if (NET.seriesScores[1] >= needed) return 2;
  return null;
}

function showRoundOverlay(winner) {
  const overlay = document.getElementById('round-overlay');
  const icon = document.getElementById('round-icon');
  const text = document.getElementById('round-result-text');
  const series = document.getElementById('round-series-text');
  const nextBtn = document.getElementById('round-next-btn');

  if (winner > 0) {
    icon.textContent = '🏆';
    if (CFG.onlineMode) {
      text.textContent = winner === NET.myPlayerNum ? t('you_won_round') : t('you_lost_round');
      text.style.color = winner === NET.myPlayerNum ? '#66bb6a' : '#ff6b6b';
    } else {
      text.textContent = t('player_won_round', winner);
      text.style.color = winner === 1 ? '#4fc3f7' : '#ff6b6b';
    }
  } else {
    icon.textContent = '🤝';
    text.textContent = t('draw');
    text.style.color = '#ffd700';
  }

  const nextStarter = ((NET.currentRound + 1) % 2 === 1) ? 1 : 2;
  const starterLabel = CFG.onlineMode
    ? (nextStarter === NET.myPlayerNum ? t('you_start') : t('opponent_starts'))
    : t('player_starts', nextStarter);
  series.textContent = t('series_format', NET.seriesScores[0], NET.seriesScores[1], starterLabel);

  // Only host (or local player) can advance to next round
  if (CFG.onlineMode && !NET.isHost) {
    nextBtn.textContent = t('waiting_host');
    nextBtn.disabled = true;
  } else {
    nextBtn.textContent = t('next_round');
    nextBtn.disabled = false;
  }

  overlay.classList.add('visible');
}

function showSeriesEnd(winner) {
  stopTimer();
  showScreen('win-screen');
  const wp = document.getElementById('win-player');
  document.querySelector('.win-trophy').textContent = '🏆';

  if (CFG.onlineMode) {
    if (winner === NET.myPlayerNum) {
      document.querySelector('.win-title').textContent = t('you_won_series');
      wp.textContent = `${NET.seriesScores[0]} – ${NET.seriesScores[1]}`;
      wp.style.color = '#66bb6a';
    } else {
      document.querySelector('.win-title').textContent = t('you_lost_series');
      wp.textContent = `${NET.seriesScores[0]} – ${NET.seriesScores[1]}`;
      wp.style.color = '#ff6b6b';
    }
  } else {
    document.querySelector('.win-title').textContent = t('bestof_winner', CFG.bestOf);
    wp.textContent = t('player_label', winner);
    wp.style.color = winner === 1 ? '#4fc3f7' : '#ff6b6b';
  }

  // Change button to "Uusi sarja"
  document.getElementById('btn-next-round').textContent = t('new_series');
  document.getElementById('btn-next-round').onclick = function() {
    NET.seriesScores = [0, 0];
    NET.currentRound = 1;
    if (CFG.onlineMode && NET.isHost) {
      startOnlineRound();
    } else if (!CFG.onlineMode) {
      launchRound();
    }
  };
}

function nextRound() {
  document.getElementById('round-overlay').classList.remove('visible');
  NET.currentRound++;

  if (CFG.onlineMode && NET.isHost) {
    startOnlineRound();
  } else if (!CFG.onlineMode) {
    launchRound();
  }
  // Guest: waits for NEW_ROUND from host
}

// =====================================================================
// STATUS HELPER
// =====================================================================
function setStatus(msg, type) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.className = 'status-msg' + (type ? ' ' + type : '');
}

// =====================================================================
// HINT SYSTEM
// =====================================================================
function censorName(name) {
  return name.split(' ').map(w => w.charAt(0) + '·'.repeat(w.length - 1)).join('  ');
}

function useHint() {
  if (G.selected === null || !isMyTurn()) return;

  // Online guest: request hint from host
  if (CFG.onlineMode && !NET.isHost) {
    sendMsg({ type: 'HINT_REQ', cell: G.selected });
    return;
  }

  // Host or local: generate hint
  generateAndShowHint(G.selected, G.turn);
}

function generateAndShowHint(idx, forPlayer) {
  if (CFG.hintsPerPlayer !== 0 && G.hintsLeft[forPlayer] <= 0) return;

  const r = Math.floor(idx / 3), c = idx % 3;
  const rowKey = G.grid.rows[r], colKey = G.grid.cols[c];

  let valid = validPlayersForCell(rowKey, colKey);
  if (!CFG.allowReuse) valid = valid.filter(p => !G.usedPlayers.has(p.n));
  if (G.stealMode && G.cells[idx].player) {
    valid = valid.filter(p => p.n !== G.cells[idx].player);
  }

  if (valid.length === 0) {
    const hints = t('hint_no_players');
    if (CFG.onlineMode && NET.isHost && forPlayer !== NET.myPlayerNum) {
      sendMsg({ type: 'HINT_RESULT', hints });
    } else {
      document.getElementById('hint-display').textContent = hints;
    }
    return;
  }

  const shuffled = valid.sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, Math.min(3, shuffled.length));
  const hintsText = picks.map(p => censorName(p.n)).join('  │  ');

  if (CFG.hintsPerPlayer !== 0) {
    G.hintsLeft[forPlayer]--;
  }

  if (CFG.onlineMode && NET.isHost && forPlayer !== NET.myPlayerNum) {
    sendMsg({ type: 'HINT_RESULT', hints: hintsText, hintsLeft: G.hintsLeft[forPlayer] });
  } else {
    document.getElementById('hint-display').textContent = hintsText;
  }

  updateHintBar();
}

function updateHintBar() {
  if (!CFG.hintsEnabled) {
    document.getElementById('hint-bar').style.display = 'none';
    document.getElementById('hint-display').textContent = '';
    return;
  }
  const show = G.selected !== null && isMyTurn();
  document.getElementById('hint-bar').style.display = show ? 'flex' : 'none';
  if (!show) return;

  const cp = CFG.onlineMode ? NET.myPlayerNum : G.turn;
  const left = G.hintsLeft[cp];
  const btn = document.getElementById('hint-btn');
  const rem = document.getElementById('hint-remaining');

  if (CFG.hintsPerPlayer === 0) {
    rem.textContent = t('hint_unlimited');
    btn.disabled = false;
  } else {
    rem.textContent = t('hint_remaining', left);
    btn.disabled = left <= 0;
  }
}

// =====================================================================
// ONLINE: FIREBASE CONNECTION
// =====================================================================
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createOnlineGame() {
  CFG.onlineMode = true;
  NET.isHost = true;
  NET.myPlayerNum = 1;
  NET.seriesScores = [0, 0];
  NET.currentRound = 1;
  NET.moveCounter = 0;
  NET.lastProcessed = 0;
  NET.roomCode = generateRoomCode();

  showScreen('lobby-screen');
  document.getElementById('lobby-title').textContent = t('waiting_opponent');
  document.getElementById('room-code-display').textContent = NET.roomCode;
  document.getElementById('copy-btn').style.display = 'inline-block';
  document.getElementById('lobby-status').textContent = t('share_code');
  document.getElementById('lobby-spinner').style.display = 'block';
  document.getElementById('lobby-join-section').style.display = 'none';

  const roomPath = 'rooms/' + NET.roomCode;
  NET.roomRef = firebaseDb.ref(roomPath);

  // Check if room code is already taken
  NET.roomRef.get().then(function(snap) {
    if (snap.exists()) {
      console.log('[Firebase] Room code taken, regenerating');
      NET.roomCode = generateRoomCode();
      document.getElementById('room-code-display').textContent = NET.roomCode;
      createOnlineGame();
      return;
    }

    // Create room in Firebase
    const roomData = {
      host: true,
      guest: false,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      state: 'waiting', // waiting → playing → finished
    };

    NET.roomRef = firebaseDb.ref('rooms/' + NET.roomCode);
    NET.roomRef.set(roomData).then(function() {
      console.log('[Firebase] Room created:', NET.roomCode);

      // Auto-cleanup when host disconnects
      NET.roomRef.onDisconnect().remove();

      // Listen for guest joining
      NET.roomRef.child('guest').on('value', function(snap) {
        if (snap.val() === true) {
          console.log('[Firebase] Guest joined room');
          document.getElementById('lobby-status').textContent = t('opponent_connected');
          document.getElementById('lobby-spinner').style.display = 'none';

          // Start listening for guest actions
          listenForGuestActions();

          // Start first round
          startOnlineRound();
        }
      });
    }).catch(function(err) {
      console.error('[Firebase] Room creation failed:', err);
      document.getElementById('lobby-status').textContent = t('connection_error', err.message);
      document.getElementById('lobby-spinner').style.display = 'none';
    });
  }).catch(function(err) {
    console.error('[Firebase] Room check failed:', err);
    document.getElementById('lobby-status').textContent = t('connection_error', err.message);
    document.getElementById('lobby-spinner').style.display = 'none';
  });
}

function joinOnlineGame(code) {
  CFG.onlineMode = true;
  NET.isHost = false;
  NET.myPlayerNum = 2;
  NET.roomCode = code.toUpperCase();
  NET.seriesScores = [0, 0];
  NET.currentRound = 1;
  NET.moveCounter = 0;
  NET.lastProcessed = 0;

  showScreen('lobby-screen');
  document.getElementById('lobby-title').textContent = t('connecting');
  document.getElementById('room-code-display').textContent = '';
  document.getElementById('copy-btn').style.display = 'none';
  document.getElementById('lobby-status').textContent = t('room_label', NET.roomCode);
  document.getElementById('lobby-spinner').style.display = 'block';
  document.getElementById('lobby-join-section').style.display = 'none';

  NET.roomRef = firebaseDb.ref('rooms/' + NET.roomCode);

  // Check if room exists
  NET.roomRef.get().then(function(snap) {
    if (!snap.exists()) {
      console.warn('[Firebase] Room not found:', NET.roomCode);
      document.getElementById('lobby-status').textContent = t('connection_failed_check');
      document.getElementById('lobby-spinner').style.display = 'none';
      return;
    }

    const room = snap.val();
    if (room.guest === true) {
      console.warn('[Firebase] Room already full:', NET.roomCode);
      document.getElementById('lobby-status').textContent = t('room_full');
      document.getElementById('lobby-spinner').style.display = 'none';
      return;
    }

    // Join room
    NET.roomRef.child('guest').set(true).then(function() {
      console.log('[Firebase] Joined room:', NET.roomCode);
      document.getElementById('lobby-status').textContent = t('connected_guest');
      document.getElementById('lobby-spinner').style.display = 'none';

      // Auto-cleanup guest flag when guest disconnects
      NET.roomRef.child('guest').onDisconnect().set(false);

      // Listen for host messages (game state changes)
      listenForHostMessages();
    }).catch(function(err) {
      console.error('[Firebase] Join failed:', err);
      document.getElementById('lobby-status').textContent = t('connection_error', err.message);
      document.getElementById('lobby-spinner').style.display = 'none';
    });
  }).catch(function(err) {
    console.error('[Firebase] Room check failed:', err);
    document.getElementById('lobby-status').textContent = t('connection_error', err.message);
    document.getElementById('lobby-spinner').style.display = 'none';
  });
}

// =====================================================================
// FIREBASE: Message passing via database updates
// =====================================================================

// Host writes game state to /rooms/{code}/hostMsg
// Guest writes actions to /rooms/{code}/guestAction
// Both use a monotonic counter to detect new messages

function sendMsg(data) {
  if (!NET.roomRef) {
    console.warn('[Firebase] sendMsg failed - no room ref');
    return;
  }

  if (NET.isHost) {
    // Host writes to hostMsg
    NET.moveCounter++;
    const msg = Object.assign({}, data, { _mc: NET.moveCounter });
    NET.roomRef.child('hostMsg').set(msg).then(function() {
      console.log('[Firebase] Host sent:', data.type, 'mc:', NET.moveCounter);
    }).catch(function(err) {
      console.error('[Firebase] Host send failed:', err);
    });
  } else {
    // Guest writes to guestAction
    NET.moveCounter++;
    const msg = Object.assign({}, data, { _mc: NET.moveCounter });
    NET.roomRef.child('guestAction').set(msg).then(function() {
      console.log('[Firebase] Guest sent:', data.type, 'mc:', NET.moveCounter);
    }).catch(function(err) {
      console.error('[Firebase] Guest send failed:', err);
    });
  }
}

// Host listens for guest actions
function listenForGuestActions() {
  NET.roomRef.child('guestAction').on('value', function(snap) {
    const data = snap.val();
    if (!data || !data._mc) return;
    if (data._mc <= NET.lastProcessed) return; // Already handled
    NET.lastProcessed = data._mc;
    console.log('[Firebase] Host received guest action:', data.type);
    handleGuestMessage(data);
  });

  // Detect guest disconnect
  NET.roomRef.child('guest').on('value', function(snap) {
    if (snap.val() === false && CFG.onlineMode && G.cells) {
      console.log('[Firebase] Guest disconnected');
      handleDisconnect();
    }
  });
}

// Guest listens for host messages
function listenForHostMessages() {
  NET.roomRef.child('hostMsg').on('value', function(snap) {
    const data = snap.val();
    if (!data || !data._mc) return;
    if (data._mc <= NET.lastProcessed) return; // Already handled
    NET.lastProcessed = data._mc;
    console.log('[Firebase] Guest received host message:', data.type);
    handleHostMessage(data);
  });

  // Detect host disconnect (room removed)
  NET.roomRef.on('value', function(snap) {
    if (!snap.exists() && CFG.onlineMode) {
      console.log('[Firebase] Host disconnected (room removed)');
      handleDisconnect();
    }
  });
}

function copyRoomCode() {
  const url = window.location.origin + window.location.pathname + '?room=' + NET.roomCode;
  navigator.clipboard.writeText(url).then(function() {
    document.getElementById('copy-btn').textContent = t('code_copied');
    setTimeout(function() { document.getElementById('copy-btn').textContent = t('copy_link'); }, 2000);
  }).catch(function() {
    // Fallback: copy just the code
    navigator.clipboard.writeText(NET.roomCode);
    document.getElementById('copy-btn').textContent = t('code_only_copied');
    setTimeout(function() { document.getElementById('copy-btn').textContent = t('copy_link'); }, 2000);
  });
}

function joinFromInput() {
  const code = document.getElementById('join-code-input').value.trim().toUpperCase();
  if (code.length === 5) {
    joinOnlineGame(code);
  }
}

function cleanupRoom() {
  if (NET.roomRef) {
    NET.roomRef.off(); // Remove all listeners
    if (NET.isHost) {
      NET.roomRef.remove().catch(function() {}); // Delete room data
    }
    NET.roomRef.onDisconnect().cancel(); // Cancel onDisconnect handlers
    NET.roomRef = null;
  }
  NET.moveCounter = 0;
  NET.lastProcessed = 0;
}

function handleDisconnect() {
  stopTimer();
  showScreen('disconnect-screen');
}

// =====================================================================
// ONLINE: HOST starts a round
// =====================================================================
function startOnlineRound() {
  const grid = generateGrid();
  if (!grid) {
    sendMsg({ type: 'ERROR', msg: 'Grid generation failed' });
    return;
  }

  initGameState(grid);
  // initGameState already alternates: odd rounds → P1, even rounds → P2

  // Send INIT to guest
  sendMsg({
    type: 'INIT',
    cfg: {
      timeLimit: CFG.timeLimit,
      allowReuse: CFG.allowReuse,
      stealEnabled: CFG.stealEnabled,
      stealsPerPlayer: CFG.stealsPerPlayer,
      hintsEnabled: CFG.hintsEnabled,
      hintsPerPlayer: CFG.hintsPerPlayer,
      bestOf: CFG.bestOf,
    },
    grid: grid,
    startTurn: G.turn,
    round: NET.currentRound,
    scores: NET.seriesScores,
  });

  // Show game locally
  showScreen('game-screen');
  clearGameUI();
  updatePlayerLabels();
  updateSeriesBar();
  if (CFG.stealEnabled) document.getElementById('steal-bar').classList.add('visible');
  else document.getElementById('steal-bar').classList.remove('visible');
  renderGrid();
  refreshUI();
  startTimer();
}

// =====================================================================
// ONLINE: GUEST handles messages from host
// =====================================================================
function handleHostMessage(data) {
  switch (data.type) {
    case 'INIT': {
      // Apply host's settings
      CFG.timeLimit = data.cfg.timeLimit;
      CFG.allowReuse = data.cfg.allowReuse;
      CFG.stealEnabled = data.cfg.stealEnabled;
      CFG.stealsPerPlayer = data.cfg.stealsPerPlayer;
      CFG.hintsEnabled = data.cfg.hintsEnabled;
      CFG.hintsPerPlayer = data.cfg.hintsPerPlayer;
      CFG.bestOf = data.cfg.bestOf;
      NET.currentRound = data.round;
      NET.seriesScores = data.scores;

      initGameState(data.grid);
      G.turn = data.startTurn;

      showScreen('game-screen');
      clearGameUI();
      updatePlayerLabels();
      updateSeriesBar();
      if (CFG.stealEnabled) document.getElementById('steal-bar').classList.add('visible');
      else document.getElementById('steal-bar').classList.remove('visible');
      renderGrid();
      refreshUI();
      startTimer();
      break;
    }

    case 'CELL_CLAIMED': {
      G.cells[data.cell] = { owner: data.owner, player: data.playerName };
      G.usedPlayers.add(data.playerName);
      if (data.owner === NET.myPlayerNum) {
        setStatus(`✓ ${data.playerName}`, 'correct');
      } else {
        setStatus(t('opponent_played', data.playerName), '');
      }
      G.selected = null;
      G.stealMode = false;
      document.getElementById('hint-display').textContent = '';

      // Update steal count if it was a steal
      if (data.wasSteal && data.stealsLeft !== undefined) {
        G.stealsLeft[data.owner] = data.stealsLeft;
      }

      const winner = checkWin();
      if (winner) {
        refreshUI();
        // Don't handle round end — wait for host's ROUND_WON
        return;
      }

      // Switch turn after successful claim (owner played → other player's turn)
      G.turn = data.owner === 1 ? 2 : 1;

      // Disable input & reset for the next turn
      const inp = document.getElementById('search-input');
      inp.disabled = true;
      inp.value = '';
      inp.placeholder = isMyTurn() ? t('select_cell_first') : t('opponent_turn');

      refreshUI();
      resetTimer();
      break;
    }

    case 'TURN_CHANGE': {
      G.turn = data.turn;
      G.selected = null;
      G.stealMode = false;
      document.getElementById('hint-display').textContent = '';
      if (data.reason === 'timeout' && data.turn === NET.myPlayerNum) {
        setStatus(t('opponent_time_up'), '');
      } else if (data.reason === 'timeout') {
        setStatus(t('time_up'), 'wrong');
      } else if (data.turn === NET.myPlayerNum) {
        setStatus(t('opponent_wrong'), '');
      } else {
        setStatus(t('wrong_opp_turn'), 'wrong');
      }
      refreshUI();
      resetTimer();
      break;
    }

    case 'HINT_RESULT': {
      document.getElementById('hint-display').textContent = data.hints;
      if (data.hintsLeft !== undefined) {
        G.hintsLeft[NET.myPlayerNum] = data.hintsLeft;
      }
      updateHintBar();
      break;
    }

    case 'ROUND_WON': {
      NET.seriesScores = data.scores;
      stopTimer();
      showRoundOverlay(data.winner);
      break;
    }

    case 'DRAW': {
      NET.seriesScores = data.scores;
      stopTimer();
      showRoundOverlay(0);
      break;
    }

    case 'NEW_ROUND': {
      document.getElementById('round-overlay').classList.remove('visible');
      NET.currentRound = data.round;
      initGameState(data.grid);
      G.turn = data.startTurn;
      clearGameUI();
      updatePlayerLabels();
      updateSeriesBar();
      renderGrid();
      refreshUI();
      startTimer();
      break;
    }

    case 'SERIES_END': {
      NET.seriesScores = data.scores;
      stopTimer();
      showSeriesEnd(data.winner);
      break;
    }

    case 'SURRENDER': {
      stopTimer();
      document.querySelector('.win-trophy').textContent = '🏳️';
      document.querySelector('.win-title').textContent = t('opponent_surrendered');
      showScreen('win-screen');
      const wp = document.getElementById('win-player');
      wp.textContent = t('you_won');
      wp.style.color = '#66bb6a';
      document.getElementById('btn-next-round').style.display = 'none';
      break;
    }
  }
}

// =====================================================================
// ONLINE: HOST handles messages from guest
// =====================================================================
function handleGuestMessage(data) {
  switch (data.type) {
    case 'MOVE': {
      // Guest is trying to play — validate on host side
      if (G.turn !== 2) return;  // not guest's turn
      // Infer steal mode from cell ownership — host doesn't know guest's UI state
      G.stealMode = (G.cells[data.cell].owner !== 0 && G.cells[data.cell].owner !== 2);
      validateAndApplyMove(data.cell, data.playerName, 2);
      break;
    }

    case 'HINT_REQ': {
      if (G.turn !== 2) return;
      generateAndShowHint(data.cell, 2);
      break;
    }

    case 'SURRENDER': {
      stopTimer();
      document.querySelector('.win-trophy').textContent = '🏳️';
      document.querySelector('.win-title').textContent = t('opponent_surrendered');
      showScreen('win-screen');
      const wp = document.getElementById('win-player');
      wp.textContent = t('you_won');
      wp.style.color = '#66bb6a';
      document.getElementById('btn-next-round').style.display = 'none';
      break;
    }

    default:
      console.warn('[Firebase] Unknown guest message type:', data.type);
  }
}

// =====================================================================
// URL AUTO-JOIN
// =====================================================================
document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get('room');
  if (roomCode && roomCode.length === 5) {
    joinOnlineGame(roomCode);
  }
});

// =====================================================================
// LANGUAGE CHANGE — re-render UI when language switches
// =====================================================================
document.addEventListener('langChanged', function() {
  // Re-render grid headers with localized category names
  if (G.grid) {
    renderGrid();
    refreshCells();
  }
  // Update player labels and turn text when game is active
  if (G.cells && document.getElementById('game-screen').offsetParent !== null) {
    updatePlayerLabels();
    refreshUI();
  }
});

// =====================================================================
// MOBILE UX — visualViewport keyboard handler
// =====================================================================
if (window.visualViewport) {
  let lastKeyboardHeight = 0;
  window.visualViewport.addEventListener('resize', function () {
    const keyboardHeight = Math.round(window.innerHeight - window.visualViewport.height);
    const isOpen = keyboardHeight > 50;

    // Only log on state change
    if (Math.abs(keyboardHeight - lastKeyboardHeight) > 10) {
      const activeEl = document.activeElement;
      const context = activeEl ? (activeEl.id || activeEl.className || activeEl.tagName) : 'none';
      console.log('[MobileUX] keyboard height:', keyboardHeight, 'open:', isOpen, 'context:', context);
      lastKeyboardHeight = keyboardHeight;
    }

    // Shift search-wrap when keyboard opens during player search
    const searchWrap = document.querySelector('.search-wrap');
    if (searchWrap && searchWrap.offsetParent !== null) {
      if (isOpen) {
        searchWrap.style.transform = 'translateY(-' + Math.min(keyboardHeight * 0.4, 120) + 'px)';
        searchWrap.style.transition = 'transform 0.15s ease-out';
      } else {
        searchWrap.style.transform = '';
        searchWrap.style.transition = '';
      }
    }

    // Shift lobby join section when keyboard opens during code entry
    const joinSection = document.getElementById('lobby-join-section');
    if (joinSection && joinSection.style.display !== 'none') {
      if (isOpen) {
        joinSection.style.transform = 'translateY(-' + Math.min(keyboardHeight * 0.3, 80) + 'px)';
        joinSection.style.transition = 'transform 0.15s ease-out';
      } else {
        joinSection.style.transform = '';
        joinSection.style.transition = '';
      }
    }
  });
}

