// =====================================================================
// shared.js — Jaettu kategoriadata (TEAMS, NATS, AWARDS, SPECIALS)
// Käytetään: daily.html, index.html
// Ladataan <script src="shared.js"> ENNEN pelikohtaista logiikkaa
// =====================================================================

const TEAMS = {
  EDM:{name:"Edmonton Oilers",      icon:"🟠",group:"Joukkue",abbr:"EDM"},
  TOR:{name:"Toronto Maple Leafs",  icon:"🍁",group:"Joukkue",abbr:"TOR"},
  BOS:{name:"Boston Bruins",        icon:"🐻",group:"Joukkue",abbr:"BOS"},
  PIT:{name:"Pittsburgh Penguins",  icon:"🐧",group:"Joukkue",abbr:"PIT"},
  TBL:{name:"Tampa Bay Lightning",  icon:"⚡",group:"Joukkue",abbr:"TBL"},
  COL:{name:"Colorado Avalanche",   icon:"🏔️",group:"Joukkue",abbr:"COL"},
  WSH:{name:"Washington Capitals",  icon:"🦅",group:"Joukkue",abbr:"WSH"},
  CHI:{name:"Chicago Blackhawks",   icon:"🪶",group:"Joukkue",abbr:"CHI"},
  DET:{name:"Detroit Red Wings",    icon:"🔴",group:"Joukkue",abbr:"DET"},
  VAN:{name:"Vancouver Canucks",    icon:"🌊",group:"Joukkue",abbr:"VAN"},
  MTL:{name:"Montréal Canadiens",   icon:"🔵",group:"Joukkue",abbr:"MTL"},
  NYR:{name:"New York Rangers",     icon:"🗽",group:"Joukkue",abbr:"NYR"},
  WPG:{name:"Winnipeg Jets",        icon:"✈️",group:"Joukkue",abbr:"WPG"},
  FLA:{name:"Florida Panthers",     icon:"🐆",group:"Joukkue",abbr:"FLA"},
  CAR:{name:"Carolina Hurricanes",  icon:"🌀",group:"Joukkue",abbr:"CAR"},
  NSH:{name:"Nashville Predators",  icon:"🎸",group:"Joukkue",abbr:"NSH"},
  STL:{name:"St. Louis Blues",      icon:"🎵",group:"Joukkue",abbr:"STL"},
  VGK:{name:"Vegas Golden Knights", icon:"⚔️",group:"Joukkue",abbr:"VGK"},
  MIN:{name:"Minnesota Wild",       icon:"🌲",group:"Joukkue",abbr:"MIN"},
  NJD:{name:"New Jersey Devils",    icon:"😈",group:"Joukkue",abbr:"NJD"},
  NYI:{name:"New York Islanders",   icon:"🏝️",group:"Joukkue",abbr:"NYI"},
  PHI:{name:"Philadelphia Flyers",  icon:"🟠",group:"Joukkue",abbr:"PHI"},
  CGY:{name:"Calgary Flames",       icon:"🔥",group:"Joukkue",abbr:"CGY"},
  OTT:{name:"Ottawa Senators",      icon:"🏛️",group:"Joukkue",abbr:"OTT"},
  BUF:{name:"Buffalo Sabres",       icon:"🦬",group:"Joukkue",abbr:"BUF"},
  ARI:{name:"Arizona Coyotes",      icon:"🐺",group:"Joukkue",abbr:"ARI"},
  UTA:{name:"Utah Hockey Club",     icon:"🏔",group:"Joukkue",abbr:"UTA"},
  LAK:{name:"Los Angeles Kings",    icon:"👑",group:"Joukkue",abbr:"LAK"},
  SJS:{name:"San Jose Sharks",      icon:"🦈",group:"Joukkue",abbr:"SJS"},
  ANA:{name:"Anaheim Ducks",        icon:"🦆",group:"Joukkue",abbr:"ANA"},
  SEA:{name:"Seattle Kraken",       icon:"🐙",group:"Joukkue",abbr:"SEA"},
  CBJ:{name:"Columbus Blue Jackets",icon:"💙",group:"Joukkue",abbr:"CBJ"},
  DAL:{name:"Dallas Stars",         icon:"⭐",group:"Joukkue",abbr:"DAL"},
};

const NATS = {
  CAN:{name:"Kanada",    icon:"🇨🇦",group:"Kansallisuus",abbr:"Kanada"},
  USA:{name:"USA",       icon:"🇺🇸",group:"Kansallisuus",abbr:"USA"},
  SWE:{name:"Ruotsi",    icon:"🇸🇪",group:"Kansallisuus",abbr:"Ruotsi"},
  FIN:{name:"Suomi",     icon:"🇫🇮",group:"Kansallisuus",abbr:"Suomi"},
  RUS:{name:"Venäjä",    icon:"🇷🇺",group:"Kansallisuus",abbr:"Venäjä"},
  CZE:{name:"Tsekki",    icon:"🇨🇿",group:"Kansallisuus",abbr:"Tsekki"},
  SVK:{name:"Slovakia",  icon:"🇸🇰",group:"Kansallisuus",abbr:"Slovakia"},
  GER:{name:"Saksa",     icon:"🇩🇪",group:"Kansallisuus",abbr:"Saksa"},
  SUI:{name:"Sveitsi",   icon:"🇨🇭",group:"Kansallisuus",abbr:"Sveitsi"},
  AUT:{name:"Itävalta",  icon:"🇦🇹",group:"Kansallisuus",abbr:"Itävalta"},
  LVA:{name:"Latvia",    icon:"🇱🇻",group:"Kansallisuus",abbr:"Latvia"},
};

const AWARDS = {
  Hart:         {name:"Hart Trophy",           icon:"🥇",group:"Palkinto",abbr:"Hart Trophy",     desc:"NHL:n paras pelaaja (kauden MVP)"},
  Vezina:       {name:"Vezina Trophy",         icon:"🧤",group:"Palkinto",abbr:"Vezina Trophy",   desc:"NHL:n paras maalivahti"},
  Norris:       {name:"Norris Trophy",         icon:"🛡️",group:"Palkinto",abbr:"Norris Trophy",   desc:"NHL:n paras puolustaja"},
  StanleyCup:   {name:"Stanley Cup",           icon:"🏆",group:"Palkinto",abbr:"Stanley Cup",     desc:"Stanley Cup -mestari"},
  Calder:       {name:"Calder Trophy",         icon:"⭐",group:"Palkinto",abbr:"Calder Trophy",   desc:"NHL:n paras rookie (ensimmäinen kausi)"},
  RocketRichard:{name:"Rocket Richard Trophy", icon:"🚀",group:"Palkinto",abbr:"Rocket Richard",  desc:"Kauden maalipisteiden paras (maaleja)"},
  ConnSmythe:   {name:"Conn Smythe Trophy",    icon:"🎖️",group:"Palkinto",abbr:"Conn Smythe",    desc:"Pudotuspelien paras pelaaja (playoff MVP)"},
  ArtRoss:      {name:"Art Ross Trophy",       icon:"🎯",group:"Palkinto",abbr:"Art Ross Trophy", desc:"Kauden pistepörssin voittaja"},
  TedLindsay:   {name:"Ted Lindsay Award",     icon:"💪",group:"Palkinto",abbr:"Ted Lindsay",     desc:"Pelaajien valitsema kauden paras pelaaja"},
  Selke:        {name:"Selke Trophy",          icon:"🔒",group:"Palkinto",abbr:"Selke Trophy",    desc:"NHL:n paras puolustava hyökkääjä"},
};

// Erityiskategoriat (vain daily.html käyttää näitä)
const SPECIALS = {
  one_club:  {name:"Pelannut vain yhdessä joukkueessa", icon:"💎",      group:"Erityinen",
              match: p => p.t && p.t.length === 1},
  multi_cup: {name:"Voittanut Stanley Cupin vähintään 3×", icon:"🏆🏆🏆", group:"Erityinen",
              match: p => p.a && p.a.filter(a => a === 'StanleyCup').length >= 3},
  five_teams:{name:"Pelannut vähintään 5 joukkueessa", icon:"🎒",       group:"Erityinen",
              match: p => p.t && p.t.length >= 5},
};

// =====================================================================
// PLAYABLE AWARDS — vain nämä näkyvät pelissä kategorioina (synkronissa AWARDS:n kanssa)
// =====================================================================
const PLAYABLE_AWARDS = new Set(Object.keys(AWARDS));
