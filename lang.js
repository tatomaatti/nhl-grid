// =====================================================================
// lang.js — Lokalisaatiojärjestelmä (FI/EN)
// Ladataan shared.js:n jälkeen, ennen game-tiedostoja
// =====================================================================

const STRINGS = {
  fi: {
    // Daily — loading
    loading:             'Generoidaan päivän puzzlea...',

    // Daily — header & progress
    daily_title:         '🏒 NHL GRID DAILY',
    daily_subtitle:      '',           // filled dynamically with date
    hint_mode_banner:    '💡 Klikkaa pelaajaa käyttääksesi vihjeen',
    hint_mode_cancel:    'Peruuta',
    progress_format:     '{0}/6 kategoriaa arvattu',
    progress_suffix:     'kategoriaa arvattu',

    // Daily — guess panel
    guess_panel_title:   'Arvaa kategoria',
    guess_search_placeholder: 'Hae kategoriaa...',
    guess_panel_hint:    'Klikkaa kategoriaa arvataksesi',
    guess_panel_what_connects: 'Mikä yhdistää: {0}?',

    // Daily — navigation
    nav_back:            '← Takaisin ristinollapeliin',

    // Daily — end screen
    end_correct:         'Oikein',
    end_lives_left:      'Elämää jäi',
    end_hints_used:      'Vihjettä käytetty',
    share_btn:           '📋 Jaa tulos',
    practice_btn:        '🔄 Harjoittelu',
    tomorrow_msg:        'Seuraava puzzle:',

    // Daily — already played
    already_played:      'Olet jo pelannut tänään! 🏒',
    already_played_sub:  'Tule huomenna uudelleen uuden puzzlen kera.',

    // Daily — status messages
    daily_status_correct: '✓ {0} {1}',
    daily_status_wrong:   '✗ {0} {1} — ei sovi kaikkiin kolmeen',
    daily_status_already: 'Käytetty',

    // Daily — end screen text
    practice_label:      'Harjoittelu',
    great_job:           'Loistava suoritus!',
    try_again:           'Kokeile uudelleen!',
    come_back_tomorrow:  'Ei tällä kertaa. Tule huomenna takaisin!',

    // Daily — errors & misc
    puzzle_gen_fail:     '⚠️ Puzzle-generointi epäonnistui. Kokeile uudelleen.',
    no_match:            'Ei tuloksia',
    used_already:        '✓ Käytetty',
    tried_already:       '✗ Kokeiltu',
    copied:              '✓ Kopioitu!',

    // Grid headers
    column_n:            'Sarake {0}',
    row_n:               'Rivi {0}',

    // Category groups (shared.js)
    group_team:          'Joukkue',
    group_nationality:   'Kansallisuus',
    group_award:         'Palkinto',
    group_special:       'Erityinen',

    // Nationality names
    nat_CAN:             'Kanada',
    nat_USA:             'USA',
    nat_SWE:             'Ruotsi',
    nat_FIN:             'Suomi',
    nat_RUS:             'Venäjä',
    nat_CZE:             'Tsekki',
    nat_SVK:             'Slovakia',
    nat_GER:             'Saksa',
    nat_SUI:             'Sveitsi',
    nat_AUT:             'Itävalta',
    nat_LVA:             'Latvia',

    // Award descriptions
    award_desc_Hart:          'NHL:n paras pelaaja (kauden MVP)',
    award_desc_Vezina:        'NHL:n paras maalivahti',
    award_desc_Norris:        'NHL:n paras puolustaja',
    award_desc_StanleyCup:    'Stanley Cup -mestari',
    award_desc_Calder:        'NHL:n paras rookie (ensimmäinen kausi)',
    award_desc_RocketRichard: 'Kauden maalipisteiden paras (maaleja)',
    award_desc_ConnSmythe:    'Pudotuspelien paras pelaaja (playoff MVP)',
    award_desc_ArtRoss:       'Kauden pistepörssin voittaja',
    award_desc_TedLindsay:    'Pelaajien valitsema kauden paras pelaaja',
    award_desc_Selke:         'NHL:n paras puolustava hyökkääjä',

    // Special category names
    special_one_club:    'Pelannut vain yhdessä joukkueessa',
    special_multi_cup:   'Voittanut Stanley Cupin vähintään 3×',
    special_five_teams:  'Pelannut vähintään 5 joukkueessa',

    // ── Grid Ristinolla ─────────────────────────────────────────────
    // Settings
    grid_title:          '🏒 NHL Hockey Grid',
    grid_subtitle:       'Löydä oikea pelaaja jokaiseen ruutuun — 3 peräkkäin voittaa',
    time_limit:          'Vuoron aikaraja',
    settings_label:      'Peliasetukset',
    reuse_label:         'Sama pelaaja useampaan ruutuun',
    steal_label:         'Ruudun varastaminen',
    steal_count_label:   'Varastuksia per pelaaja',
    hints_label:         '💡 Vihjeet',
    hint_count_label:    'Vihjeitä per pelaaja',
    categories_label:    'Kategoriat',
    teams_always_on:     '🏒 NHL-joukkueet (aina päällä)',
    nats_label:          '🌍 Kansallisuudet',
    awards_label:        '🏆 Palkinnot',
    weight_label:        'Painotus',
    bestof_label:        'Pelimuoto (Best-of)',
    btn_local:           '▶ PAIKALLINEN',
    btn_online:          '🌐 NETTIPELI',
    btn_daily:           '📅 DAILY PUZZLE',

    // Lobby
    waiting_opponent:    'Odotetaan vastustajaa...',
    copy_link:           '📋 Kopioi linkki',
    share_code:          'Jaa koodi tai linkki kaverille',
    join_by_code:        'Liity peliin koodilla',
    join_btn:            'Liity',
    back_menu:           '← Valikko',
    connecting:          'Yhdistetään...',
    room_label:          'Huone: {0}',
    connected_ready:     'Vastustaja valmis! Peli alkaa...',
    connected_waiting:   'Yhteys muodostettu! Odotetaan vastustajaa...',
    opponent_connected:  'Vastustaja yhdistyi!',
    connected_guest:     'Yhdistetty! Odotetaan pelin alkua...',
    connection_failed_nat: 'Yhteys epäonnistui (NAT/palomuuri). Kokeile toista verkkoa tai mobiilihotspotia.',
    connection_failed_check: 'Yhteys epäonnistui. Tarkista koodi.',
    connection_error:    'Yhteysvirhe: {0}',

    // Game
    player_1:            'Pelaaja 1',
    player_2:            'Pelaaja 2',
    you_label:           'Sinä',
    opponent:            'Vastustaja',
    your_turn:           'Sinun vuorosi!',
    opponent_turn:       'Vastustajan vuoro...',
    player_turn:         'Pelaaja {0}',
    select_cell_first:   'Valitse ensin ruutu...',
    search_placeholder:  'Hae NHL-pelaajaa...',
    waiting_label:       'Odotetaan...',
    find_player:         'FIND PLAYER',
    surrender_title:     '🏳️ Luovuta?',
    surrender_text:      'Peli loppuu ja palataan valikkoon.\nTulos ei tallennu.',
    surrender_confirm:   'Luovuta',
    cancel:              'Peruuta',
    turn_label:          'Vuorossa:',

    // Steal/hints
    steal_tag:           '⚡STEAL',
    steal_status:        '⚡ Varastetaan pelaaja {0}:n ruutu! Löydä eri pelaaja.',
    steal_p1:            '⚡ P1 varastuksia:',
    steal_p2:            '⚡ P2 varastuksia:',
    steal_need_different:'Varastukseen tarvitaan eri pelaaja!',
    hint_btn_label:      '💡 Vihje',
    hint_no_players:     'Ei sopivia pelaajia jäljellä!',
    hint_unlimited:      '(rajaton)',
    hint_remaining:      '({0} jäljellä)',
    used_label:          '(käytetty)',

    // Grid generation
    grid_gen_fail:       'Ei löydy sopivaa ruudukkoa. Kokeile lisätä kategorioita asetuksista.',

    // Validation errors
    player_not_found:    'Pelaajaa "{0}" ei löydy tietokannasta.',
    player_already_used: '{0} on jo käytetty!',
    wrong_guess:         'Väärin! {0} ei sovi: {1} × {2}.',

    // Results
    winner:              'Voittaja',
    you_won_round:       'Voitit erän!',
    you_lost_round:      'Vastustaja voitti erän',
    player_won_round:    'Pelaaja {0} voitti erän!',
    draw:                'Tasapeli!',
    series_format:       'Sarja: {0} – {1}  ·  {2} seuraavan erän',
    you_start:           'Sinä aloitat',
    opponent_starts:     'Vastustaja aloittaa',
    player_starts:       'Pelaaja {0} aloittaa',
    next_round:          'Seuraava erä',
    menu:                'Valikko',
    waiting_host:        'Odotetaan hostia...',
    free_series:         'Vapaa sarja',
    round_format:        'Erä {0} | {1} — {2} – {3}',

    // Series end
    you_won_series:      'Voitit sarjan!',
    you_lost_series:     'Hävisit sarjan',
    bestof_winner:       'Best of {0} — Voittaja',
    player_label:        'Pelaaja {0}',
    new_series:          'Uusi sarja',

    // Online misc
    opponent_played:     'Vastustaja pelasi: {0}',
    opponent_time_up:    'Vastustajan aika loppui! Sinun vuorosi.',
    time_up:             'Aika loppui! Vuoro siirtyi.',
    opponent_wrong:      'Vastustaja arvasi väärin. Sinun vuorosi!',
    wrong_opp_turn:      'Väärin. Vastustajan vuoro.',
    opponent_surrendered:'Vastustaja luovutti!',
    you_won:             'Voitit!',
    code_copied:         '✓ Kopioitu!',
    code_only_copied:    '✓ Koodi kopioitu!',

    // Disconnect
    disconnected_title:  '❌ Yhteys katkesi',
    disconnected_text:   'Verkkoyhteys vastustajaan on katkennut.',

    // DB error
    db_missing_title:    'players.js puuttuu!',
    db_missing_text:     'Tiedostoa players.js ei löydy.',
    db_missing_hint:     'Varmista että molemmat tiedostot ovat samassa kansiossa:',
  },

  en: {
    // Daily — loading
    loading:             'Generating daily puzzle...',

    // Daily — header & progress
    daily_title:         '🏒 NHL GRID DAILY',
    daily_subtitle:      '',
    hint_mode_banner:    '💡 Click a player to use a hint',
    hint_mode_cancel:    'Cancel',
    progress_format:     '{0}/6 categories guessed',
    progress_suffix:     'categories guessed',

    // Daily — guess panel
    guess_panel_title:   'Guess the category',
    guess_search_placeholder: 'Search categories...',
    guess_panel_hint:    'Click a category to guess',
    guess_panel_what_connects: 'What connects: {0}?',

    // Daily — navigation
    nav_back:            '← Back to Tic Tac Toe',

    // Daily — end screen
    end_correct:         'Correct',
    end_lives_left:      'Lives left',
    end_hints_used:      'Hints used',
    share_btn:           '📋 Share result',
    practice_btn:        '🔄 Practice',
    tomorrow_msg:        'Next puzzle:',

    // Daily — already played
    already_played:      'Already played today! 🏒',
    already_played_sub:  'Come back tomorrow for a new puzzle.',

    // Daily — status messages
    daily_status_correct: '✓ {0} {1}',
    daily_status_wrong:   '✗ {0} {1} — doesn\'t fit all three',
    daily_status_already: 'Used',

    // Daily — end screen text
    practice_label:      'Practice',
    great_job:           'Great job!',
    try_again:           'Try again!',
    come_back_tomorrow:  'Not this time. Come back tomorrow!',

    // Daily — errors & misc
    puzzle_gen_fail:     '⚠️ Puzzle generation failed. Try again.',
    no_match:            'No results',
    used_already:        '✓ Used',
    tried_already:       '✗ Tried',
    copied:              '✓ Copied!',

    // Grid headers
    column_n:            'Column {0}',
    row_n:               'Row {0}',

    // Category groups (shared.js)
    group_team:          'Team',
    group_nationality:   'Nationality',
    group_award:         'Award',
    group_special:       'Special',

    // Nationality names
    nat_CAN:             'Canada',
    nat_USA:             'USA',
    nat_SWE:             'Sweden',
    nat_FIN:             'Finland',
    nat_RUS:             'Russia',
    nat_CZE:             'Czech Republic',
    nat_SVK:             'Slovakia',
    nat_GER:             'Germany',
    nat_SUI:             'Switzerland',
    nat_AUT:             'Austria',
    nat_LVA:             'Latvia',

    // Award descriptions
    award_desc_Hart:          'Best player in the NHL (season MVP)',
    award_desc_Vezina:        'Best goaltender in the NHL',
    award_desc_Norris:        'Best defenseman in the NHL',
    award_desc_StanleyCup:    'Stanley Cup champion',
    award_desc_Calder:        'Best rookie in the NHL',
    award_desc_RocketRichard: 'Most goals in the season',
    award_desc_ConnSmythe:    'Playoff MVP',
    award_desc_ArtRoss:       'Season points leader',
    award_desc_TedLindsay:    'Best player voted by players',
    award_desc_Selke:         'Best defensive forward in the NHL',

    // Special category names
    special_one_club:    'Played for only one team',
    special_multi_cup:   'Won Stanley Cup 3+ times',
    special_five_teams:  'Played for 5+ teams',

    // ── Grid Ristinolla ─────────────────────────────────────────────
    // Settings
    grid_title:          '🏒 NHL Hockey Grid',
    grid_subtitle:       'Find the right player for each cell — 3 in a row wins',
    time_limit:          'Turn time limit',
    settings_label:      'Game settings',
    reuse_label:         'Same player in multiple cells',
    steal_label:         'Cell stealing',
    steal_count_label:   'Steals per player',
    hints_label:         '💡 Hints',
    hint_count_label:    'Hints per player',
    categories_label:    'Categories',
    teams_always_on:     '🏒 NHL Teams (always on)',
    nats_label:          '🌍 Nationalities',
    awards_label:        '🏆 Awards',
    weight_label:        'Weight',
    bestof_label:        'Game mode (Best-of)',
    btn_local:           '▶ LOCAL',
    btn_online:          '🌐 ONLINE',
    btn_daily:           '📅 DAILY PUZZLE',

    // Lobby
    waiting_opponent:    'Waiting for opponent...',
    copy_link:           '📋 Copy link',
    share_code:          'Share code or link with a friend',
    join_by_code:        'Join game with code',
    join_btn:            'Join',
    back_menu:           '← Menu',
    connecting:          'Connecting...',
    room_label:          'Room: {0}',
    connected_ready:     'Opponent ready! Game starting...',
    connected_waiting:   'Connected! Waiting for opponent...',
    opponent_connected:  'Opponent connected!',
    connected_guest:     'Connected! Waiting for game to start...',
    connection_failed_nat: 'Connection failed (NAT/firewall). Try another network or mobile hotspot.',
    connection_failed_check: 'Connection failed. Check the code.',
    connection_error:    'Connection error: {0}',

    // Game
    player_1:            'Player 1',
    player_2:            'Player 2',
    you_label:           'You',
    opponent:            'Opponent',
    your_turn:           'Your turn!',
    opponent_turn:       'Opponent\'s turn...',
    player_turn:         'Player {0}',
    select_cell_first:   'Select a cell first...',
    search_placeholder:  'Search NHL player...',
    waiting_label:       'Waiting...',
    find_player:         'FIND PLAYER',
    surrender_title:     '🏳️ Surrender?',
    surrender_text:      'The game will end and return to menu.\nResult will not be saved.',
    surrender_confirm:   'Surrender',
    cancel:              'Cancel',
    turn_label:          'Turn:',

    // Steal/hints
    steal_tag:           '⚡STEAL',
    steal_status:        '⚡ Stealing player {0}\'s cell! Find a different player.',
    steal_p1:            '⚡ P1 steals:',
    steal_p2:            '⚡ P2 steals:',
    steal_need_different:'A different player is needed for stealing!',
    hint_btn_label:      '💡 Hint',
    hint_no_players:     'No valid players remaining!',
    hint_unlimited:      '(unlimited)',
    hint_remaining:      '({0} left)',
    used_label:          '(used)',

    // Grid generation
    grid_gen_fail:       'No valid grid found. Try adding more categories in settings.',

    // Validation errors
    player_not_found:    'Player "{0}" not found in database.',
    player_already_used: '{0} has already been used!',
    wrong_guess:         'Wrong! {0} doesn\'t fit: {1} × {2}.',

    // Results
    winner:              'Winner',
    you_won_round:       'You won the round!',
    you_lost_round:      'Opponent won the round',
    player_won_round:    'Player {0} won the round!',
    draw:                'Draw!',
    series_format:       'Series: {0} – {1}  ·  {2} starts next round',
    you_start:           'You start',
    opponent_starts:     'Opponent starts',
    player_starts:       'Player {0} starts',
    next_round:          'Next round',
    menu:                'Menu',
    waiting_host:        'Waiting for host...',
    free_series:         'Free series',
    round_format:        'Round {0} | {1} — {2} – {3}',

    // Series end
    you_won_series:      'You won the series!',
    you_lost_series:     'You lost the series',
    bestof_winner:       'Best of {0} — Winner',
    player_label:        'Player {0}',
    new_series:          'New series',

    // Online misc
    opponent_played:     'Opponent played: {0}',
    opponent_time_up:    'Opponent\'s time is up! Your turn.',
    time_up:             'Time\'s up! Turn switched.',
    opponent_wrong:      'Opponent guessed wrong. Your turn!',
    wrong_opp_turn:      'Wrong. Opponent\'s turn.',
    opponent_surrendered:'Opponent surrendered!',
    you_won:             'You won!',
    code_copied:         '✓ Copied!',
    code_only_copied:    '✓ Code copied!',

    // Disconnect
    disconnected_title:  '❌ Disconnected',
    disconnected_text:   'Connection to opponent has been lost.',

    // DB error
    db_missing_title:    'players.js is missing!',
    db_missing_text:     'File players.js not found.',
    db_missing_hint:     'Make sure both files are in the same folder:',
  },
};

// ── Current language state ──────────────────────────────────────────
let _currentLang = 'fi';

/**
 * Initialize language from localStorage or browser preference.
 */
function _initLang() {
  const stored = localStorage.getItem('nhl-grid-lang');
  if (stored && STRINGS[stored]) {
    _currentLang = stored;
  } else {
    _currentLang = (navigator.language && navigator.language.startsWith('fi')) ? 'fi' : 'en';
  }
  console.log('[Lang] Initialized:', _currentLang);
}

/**
 * Get the current language code.
 * @returns {'fi'|'en'}
 */
function getCurrentLang() {
  return _currentLang;
}

/**
 * Set the language and apply it to the DOM.
 * @param {'fi'|'en'} code
 */
function setLang(code) {
  if (!STRINGS[code]) {
    console.warn('[Lang] Unknown language code:', code);
    return;
  }
  _currentLang = code;
  localStorage.setItem('nhl-grid-lang', code);
  console.log('[Lang] Language set:', code);
  applyLanguage();
  document.dispatchEvent(new Event('langChanged'));
}

/**
 * Translate a key with optional parameter substitution.
 * Supports {0}, {1}, ... placeholders.
 * @param {string} key
 * @param {...*} args
 * @returns {string}
 */
function t(key, ...args) {
  const dict = STRINGS[_currentLang] || STRINGS.fi;
  let val = dict[key];
  if (val === undefined) {
    console.warn('[Lang] Missing key:', key);
    return key;
  }
  // Substitute {0}, {1}, ...
  for (let i = 0; i < args.length; i++) {
    val = val.replace(new RegExp('\\{' + i + '\\}', 'g'), args[i]);
  }
  return val;
}

/**
 * Apply the current language to all DOM elements with data-i18n attributes.
 * Also updates data-i18n-placeholder for input elements.
 */
function applyLanguage() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // Update lang-switch button label
  const langBtn = document.getElementById('lang-switch');
  if (langBtn) {
    langBtn.textContent = _currentLang === 'fi' ? '🇬🇧 EN' : '🇫🇮 FI';
    langBtn.setAttribute('aria-label', _currentLang === 'fi' ? 'Switch to English' : 'Vaihda suomeksi');
  }

  console.log('[Lang] Applied language to', elements.length + placeholders.length, 'elements');
}

// ── Auto-init on DOMContentLoaded ───────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  _initLang();
  applyLanguage();
});
