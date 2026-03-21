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
