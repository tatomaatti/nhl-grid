// =====================================================================
// shared.js — Jaettu kategoriadata (TEAMS, NATS, AWARDS, SPECIALS)
// Käytetään: daily.html, index.html
// Ladataan <script src="shared.js"> ENNEN pelikohtaista logiikkaa
// =====================================================================

const TEAMS = {
  EDM:{name:"Edmonton Oilers",      icon:"🟠",group:"Joukkue",group_en:"Team",abbr:"EDM"},
  TOR:{name:"Toronto Maple Leafs",  icon:"🍁",group:"Joukkue",group_en:"Team",abbr:"TOR"},
  BOS:{name:"Boston Bruins",        icon:"🐻",group:"Joukkue",group_en:"Team",abbr:"BOS"},
  PIT:{name:"Pittsburgh Penguins",  icon:"🐧",group:"Joukkue",group_en:"Team",abbr:"PIT"},
  TBL:{name:"Tampa Bay Lightning",  icon:"⚡",group:"Joukkue",group_en:"Team",abbr:"TBL"},
  COL:{name:"Colorado Avalanche",   icon:"🏔️",group:"Joukkue",group_en:"Team",abbr:"COL"},
  WSH:{name:"Washington Capitals",  icon:"🦅",group:"Joukkue",group_en:"Team",abbr:"WSH"},
  CHI:{name:"Chicago Blackhawks",   icon:"🪶",group:"Joukkue",group_en:"Team",abbr:"CHI"},
  DET:{name:"Detroit Red Wings",    icon:"🔴",group:"Joukkue",group_en:"Team",abbr:"DET"},
  VAN:{name:"Vancouver Canucks",    icon:"🌊",group:"Joukkue",group_en:"Team",abbr:"VAN"},
  MTL:{name:"Montréal Canadiens",   icon:"🔵",group:"Joukkue",group_en:"Team",abbr:"MTL"},
  NYR:{name:"New York Rangers",     icon:"🗽",group:"Joukkue",group_en:"Team",abbr:"NYR"},
  WPG:{name:"Winnipeg Jets",        icon:"✈️",group:"Joukkue",group_en:"Team",abbr:"WPG"},
  FLA:{name:"Florida Panthers",     icon:"🐆",group:"Joukkue",group_en:"Team",abbr:"FLA"},
  CAR:{name:"Carolina Hurricanes",  icon:"🌀",group:"Joukkue",group_en:"Team",abbr:"CAR"},
  NSH:{name:"Nashville Predators",  icon:"🎸",group:"Joukkue",group_en:"Team",abbr:"NSH"},
  STL:{name:"St. Louis Blues",      icon:"🎵",group:"Joukkue",group_en:"Team",abbr:"STL"},
  VGK:{name:"Vegas Golden Knights", icon:"⚔️",group:"Joukkue",group_en:"Team",abbr:"VGK"},
  MIN:{name:"Minnesota Wild",       icon:"🌲",group:"Joukkue",group_en:"Team",abbr:"MIN"},
  NJD:{name:"New Jersey Devils",    icon:"😈",group:"Joukkue",group_en:"Team",abbr:"NJD"},
  NYI:{name:"New York Islanders",   icon:"🏝️",group:"Joukkue",group_en:"Team",abbr:"NYI"},
  PHI:{name:"Philadelphia Flyers",  icon:"🟠",group:"Joukkue",group_en:"Team",abbr:"PHI"},
  CGY:{name:"Calgary Flames",       icon:"🔥",group:"Joukkue",group_en:"Team",abbr:"CGY"},
  OTT:{name:"Ottawa Senators",      icon:"🏛️",group:"Joukkue",group_en:"Team",abbr:"OTT"},
  BUF:{name:"Buffalo Sabres",       icon:"🦬",group:"Joukkue",group_en:"Team",abbr:"BUF"},
  ARI:{name:"Arizona Coyotes",      icon:"🐺",group:"Joukkue",group_en:"Team",abbr:"ARI"},
  UTA:{name:"Utah Hockey Club",     icon:"🏔",group:"Joukkue",group_en:"Team",abbr:"UTA"},
  LAK:{name:"Los Angeles Kings",    icon:"👑",group:"Joukkue",group_en:"Team",abbr:"LAK"},
  SJS:{name:"San Jose Sharks",      icon:"🦈",group:"Joukkue",group_en:"Team",abbr:"SJS"},
  ANA:{name:"Anaheim Ducks",        icon:"🦆",group:"Joukkue",group_en:"Team",abbr:"ANA"},
  SEA:{name:"Seattle Kraken",       icon:"🐙",group:"Joukkue",group_en:"Team",abbr:"SEA"},
  CBJ:{name:"Columbus Blue Jackets",icon:"💙",group:"Joukkue",group_en:"Team",abbr:"CBJ"},
  DAL:{name:"Dallas Stars",         icon:"⭐",group:"Joukkue",group_en:"Team",abbr:"DAL"},
};

const NATS = {
  CAN:{name:"Kanada",    name_en:"Canada",          icon:"🇨🇦",group:"Kansallisuus",group_en:"Nationality",abbr:"Kanada",    abbr_en:"Canada"},
  USA:{name:"USA",       name_en:"USA",              icon:"🇺🇸",group:"Kansallisuus",group_en:"Nationality",abbr:"USA",       abbr_en:"USA"},
  SWE:{name:"Ruotsi",    name_en:"Sweden",           icon:"🇸🇪",group:"Kansallisuus",group_en:"Nationality",abbr:"Ruotsi",    abbr_en:"Sweden"},
  FIN:{name:"Suomi",     name_en:"Finland",          icon:"🇫🇮",group:"Kansallisuus",group_en:"Nationality",abbr:"Suomi",     abbr_en:"Finland"},
  RUS:{name:"Venäjä",    name_en:"Russia",           icon:"🇷🇺",group:"Kansallisuus",group_en:"Nationality",abbr:"Venäjä",    abbr_en:"Russia"},
  CZE:{name:"Tsekki",    name_en:"Czech Republic",   icon:"🇨🇿",group:"Kansallisuus",group_en:"Nationality",abbr:"Tsekki",    abbr_en:"Czech Republic"},
  SVK:{name:"Slovakia",  name_en:"Slovakia",         icon:"🇸🇰",group:"Kansallisuus",group_en:"Nationality",abbr:"Slovakia",  abbr_en:"Slovakia"},
  GER:{name:"Saksa",     name_en:"Germany",          icon:"🇩🇪",group:"Kansallisuus",group_en:"Nationality",abbr:"Saksa",     abbr_en:"Germany"},
  SUI:{name:"Sveitsi",   name_en:"Switzerland",      icon:"🇨🇭",group:"Kansallisuus",group_en:"Nationality",abbr:"Sveitsi",   abbr_en:"Switzerland"},
  AUT:{name:"Itävalta",  name_en:"Austria",          icon:"🇦🇹",group:"Kansallisuus",group_en:"Nationality",abbr:"Itävalta",  abbr_en:"Austria"},
  LVA:{name:"Latvia",    name_en:"Latvia",           icon:"🇱🇻",group:"Kansallisuus",group_en:"Nationality",abbr:"Latvia",    abbr_en:"Latvia"},
};

const AWARDS = {
  Hart:         {name:"Hart Trophy",           icon:"🥇",group:"Palkinto",group_en:"Award",abbr:"Hart Trophy",     desc:"NHL:n paras pelaaja (kauden MVP)",           desc_en:"Best player in the NHL (season MVP)"},
  Vezina:       {name:"Vezina Trophy",         icon:"🧤",group:"Palkinto",group_en:"Award",abbr:"Vezina Trophy",   desc:"NHL:n paras maalivahti",                     desc_en:"Best goaltender in the NHL"},
  Norris:       {name:"Norris Trophy",         icon:"🛡️",group:"Palkinto",group_en:"Award",abbr:"Norris Trophy",   desc:"NHL:n paras puolustaja",                     desc_en:"Best defenseman in the NHL"},
  StanleyCup:   {name:"Stanley Cup",           icon:"🏆",group:"Palkinto",group_en:"Award",abbr:"Stanley Cup",     desc:"Stanley Cup -mestari",                       desc_en:"Stanley Cup champion"},
  Calder:       {name:"Calder Trophy",         icon:"⭐",group:"Palkinto",group_en:"Award",abbr:"Calder Trophy",   desc:"NHL:n paras rookie (ensimmäinen kausi)",      desc_en:"Best rookie in the NHL"},
  RocketRichard:{name:"Rocket Richard Trophy", icon:"🚀",group:"Palkinto",group_en:"Award",abbr:"Rocket Richard",  desc:"Kauden maalipisteiden paras (maaleja)",       desc_en:"Most goals in the season"},
  ConnSmythe:   {name:"Conn Smythe Trophy",    icon:"🎖️",group:"Palkinto",group_en:"Award",abbr:"Conn Smythe",    desc:"Pudotuspelien paras pelaaja (playoff MVP)",   desc_en:"Playoff MVP"},
  ArtRoss:      {name:"Art Ross Trophy",       icon:"🎯",group:"Palkinto",group_en:"Award",abbr:"Art Ross Trophy", desc:"Kauden pistepörssin voittaja",                desc_en:"Season points leader"},
  TedLindsay:   {name:"Ted Lindsay Award",     icon:"💪",group:"Palkinto",group_en:"Award",abbr:"Ted Lindsay",     desc:"Pelaajien valitsema kauden paras pelaaja",    desc_en:"Best player voted by players"},
  Selke:        {name:"Selke Trophy",          icon:"🔒",group:"Palkinto",group_en:"Award",abbr:"Selke Trophy",    desc:"NHL:n paras puolustava hyökkääjä",            desc_en:"Best defensive forward in the NHL"},
};

// Erityiskategoriat (vain daily.html käyttää näitä)
const SPECIALS = {
  one_club:  {name:"Pelannut vain yhdessä joukkueessa", name_en:"Played for only one team",  icon:"💎",      group:"Erityinen", group_en:"Special",
              match: p => p.t && p.t.length === 1},
  multi_cup: {name:"Voittanut Stanley Cupin vähintään 3×", name_en:"Won Stanley Cup 3+ times", icon:"🏆🏆🏆", group:"Erityinen", group_en:"Special",
              match: p => p.a && p.a.filter(a => a === 'StanleyCup').length >= 3},
  five_teams:{name:"Pelannut vähintään 5 joukkueessa", name_en:"Played for 5+ teams",       icon:"🎒",       group:"Erityinen", group_en:"Special",
              match: p => p.t && p.t.length >= 5},
};

// =====================================================================
// PLAYABLE AWARDS — vain nämä näkyvät pelissä kategorioina (synkronissa AWARDS:n kanssa)
// =====================================================================
const PLAYABLE_AWARDS = new Set(Object.keys(AWARDS));

// =====================================================================
// catLang(info) — palauttaa lokalisoidun group/name/abbr-objektin
// Käyttää lang.js:n getCurrentLang()-funktiota jos saatavilla
// =====================================================================
function catLang(info) {
  const en = (typeof getCurrentLang === 'function') && getCurrentLang() === 'en';
  return {
    group: en ? (info.group_en || info.group) : info.group,
    name:  en ? (info.name_en  || info.name)  : info.name,
    abbr:  en ? (info.abbr_en  || info.abbr)  : info.abbr,
    desc:  en ? (info.desc_en  || info.desc)  : info.desc,
  };
}
