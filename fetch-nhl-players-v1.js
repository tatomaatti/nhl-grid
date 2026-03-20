#!/usr/bin/env node
/**
 * fetch-nhl-players.js  —  NHL Player Database Builder  (v2.1)
 * Usage:
 *   node fetch-nhl-players.js           # full API run (~50–70 min)
 *   node fetch-nhl-players.js --quick   # reprocess existing DB only (seconds)
 *
 * Requires: Node.js 18+ (built-in fetch, vm)
 *
 * --quick mode skips all API calls.  It loads the existing players.js,
 * merges MANUAL_PLAYERS, applies hardcoded awards + CUP_FALLBACK names,
 * and writes back.  Use this to instantly patch the DB after updating
 * MANUAL_PLAYERS or AWARD_WINNERS without waiting for a full fetch.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE   = join(__dirname, 'players.js');
const QUICK_MODE = process.argv.includes('--quick');

// ── Configuration ─────────────────────────────────────────────────────────────

const DELAY_MS    = 400;
const BATCH_PAUSE = 8000;
const BATCH_SIZE  = 200;
const MAX_RETRIES = 5;
const MIN_GP      = 1;

const TEAM_CODES = [
  'ANA','BOS','BUF','CGY','CAR','CHI','COL','CBJ',
  'DAL','DET','EDM','FLA','LAK','MIN','MTL','NSH',
  'NJD','NYI','NYR','OTT','PHI','PIT','SJS','SEA',
  'STL','TBL','TOR','UTA','VAN','VGK','WSH','WPG',
];

// ══════════════════════════════════════════════════════════════════════════════
// HARDCODED AWARD WINNERS  (1990–2025)
// ══════════════════════════════════════════════════════════════════════════════

const AWARD_WINNERS = {

  Hart: [
    "Mark Messier","Brett Hull","Mario Lemieux","Sergei Fedorov",
    "Eric Lindros","Dominik Hasek","Jaromir Jagr","Chris Pronger",
    "Joe Sakic","Jose Theodore","Peter Forsberg","Martin St. Louis",
    "Joe Thornton","Sidney Crosby","Alex Ovechkin","Henrik Sedin",
    "Corey Perry","Evgeni Malkin","Carey Price","Patrick Kane",
    "Connor McDavid","Taylor Hall","Nikita Kucherov","Leon Draisaitl",
    "Auston Matthews","Nathan MacKinnon","Connor Hellebuyck",
  ],

  Vezina: [
    "Patrick Roy","Ed Belfour","Dominik Hasek","Jim Carey",
    "Olaf Kolzig","Jose Theodore","Martin Brodeur","Miikka Kiprusoff",
    "Tim Thomas","Ryan Miller","Henrik Lundqvist","Sergei Bobrovsky",
    "Tuukka Rask","Carey Price","Braden Holtby","Pekka Rinne",
    "Andrei Vasilevskiy","Connor Hellebuyck","Marc-Andre Fleury",
    "Igor Shesterkin","Linus Ullmark",
  ],

  Norris: [
    "Ray Bourque","Brian Leetch","Chris Chelios","Paul Coffey",
    "Rob Blake","Al MacInnis","Chris Pronger","Nicklas Lidstrom",
    "Scott Niedermayer","Duncan Keith","Zdeno Chara",
    "P.K. Subban","Erik Karlsson","Drew Doughty","Brent Burns",
    "Victor Hedman","Mark Giordano","Roman Josi","Adam Fox",
    "Cale Makar","Quinn Hughes","Bobby Orr",
  ],

  ArtRoss: [
    "Wayne Gretzky","Mario Lemieux","Jaromir Jagr","Peter Forsberg",
    "Jarome Iginla","Martin St. Louis","Joe Thornton","Sidney Crosby",
    "Alex Ovechkin","Evgeni Malkin","Henrik Sedin","Daniel Sedin",
    "Jamie Benn","Patrick Kane","Connor McDavid","Nikita Kucherov",
    "Leon Draisaitl",
  ],

  RocketRichard: [
    "Teemu Selanne","Pavel Bure","Jarome Iginla","Milan Hejduk",
    "Rick Nash","Ilya Kovalchuk","Jonathan Cheechoo",
    "Vincent Lecavalier","Alex Ovechkin","Steven Stamkos",
    "Sidney Crosby","Corey Perry","David Pastrnak",
    "Auston Matthews","Connor McDavid","Leon Draisaitl",
  ],

  Calder: [
    "Sergei Makarov","Ed Belfour","Pavel Bure","Teemu Selanne",
    "Martin Brodeur","Peter Forsberg","Daniel Alfredsson",
    "Bryan Berard","Sergei Samsonov","Chris Drury","Scott Gomez",
    "Evgeni Nabokov","Dany Heatley","Barret Jackman",
    "Andrew Raycroft","Alex Ovechkin","Evgeni Malkin",
    "Patrick Kane","Steve Mason","Tyler Myers","Jeff Skinner",
    "Gabriel Landeskog","Jonathan Huberdeau","Nathan MacKinnon",
    "Aaron Ekblad","Artemi Panarin","Auston Matthews",
    "Mathew Barzal","Elias Pettersson","Cale Makar",
    "Kirill Kaprizov","Moritz Seider","Matty Beniers",
    "Connor Bedard","Lane Hutson","Bobby Orr",
  ],

  ConnSmythe: [
    "Bill Ranford","Mario Lemieux","Patrick Roy","Brian Leetch",
    "Claude Lemieux","Joe Sakic","Mike Vernon","Steve Yzerman",
    "Joe Nieuwendyk","Scott Stevens","Nicklas Lidstrom",
    "Jean-Sebastien Giguere","Brad Richards","Cam Ward",
    "Scott Niedermayer","Henrik Zetterberg","Evgeni Malkin",
    "Jonathan Toews","Tim Thomas","Jonathan Quick","Patrick Kane",
    "Justin Williams","Duncan Keith","Sidney Crosby",
    "Alex Ovechkin","Ryan O'Reilly","Victor Hedman",
    "Andrei Vasilevskiy","Cale Makar","Jonathan Marchessault",
    "Connor McDavid","Bobby Orr",
  ],

  Selke: [
    "Rick Meagher","Dirk Graham","Guy Carbonneau","Doug Gilmour",
    "Sergei Fedorov","Ron Francis","Michael Peca","Jere Lehtinen",
    "Steve Yzerman","John Madden","Kris Draper",
    "Rod Brind'Amour","Pavel Datsyuk","Ryan Kesler",
    "Patrice Bergeron","Jonathan Toews","Anze Kopitar",
    "Ryan O'Reilly","Sean Couturier","Aleksander Barkov",
  ],

  TedLindsay: [
    "Mark Messier","Brett Hull","Mario Lemieux","Sergei Fedorov",
    "Eric Lindros","Dominik Hasek","Jaromir Jagr","Joe Sakic",
    "Jarome Iginla","Markus Naslund","Martin St. Louis",
    "Sidney Crosby","Alex Ovechkin","Daniel Sedin","Evgeni Malkin",
    "Carey Price","Patrick Kane","Connor McDavid",
    "Nikita Kucherov","Leon Draisaitl","Auston Matthews",
    "Nathan MacKinnon",
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// STANLEY CUP SEASONS
// ══════════════════════════════════════════════════════════════════════════════

const CUP_SEASONS = [
  { team:'EDM', season:'19891990' },
  { team:'PIT', season:'19901991' }, { team:'PIT', season:'19911992' },
  { team:'MTL', season:'19921993' }, { team:'NYR', season:'19931994' },
  { team:'NJD', season:'19941995' }, { team:'COL', season:'19951996' },
  { team:'DET', season:'19961997' }, { team:'DET', season:'19971998' },
  { team:'DAL', season:'19981999' }, { team:'NJD', season:'19992000' },
  { team:'COL', season:'20002001' }, { team:'DET', season:'20012002' },
  { team:'NJD', season:'20022003' },
  { team:'CAR', season:'20052006' }, { team:'ANA', season:'20062007' },
  { team:'DET', season:'20072008' }, { team:'PIT', season:'20082009' },
  { team:'CHI', season:'20092010' }, { team:'BOS', season:'20102011' },
  { team:'LAK', season:'20112012' }, { team:'CHI', season:'20122013' },
  { team:'LAK', season:'20132014' }, { team:'CHI', season:'20142015' },
  { team:'PIT', season:'20152016' }, { team:'PIT', season:'20162017' },
  { team:'WSH', season:'20172018' }, { team:'STL', season:'20182019' },
  { team:'TBL', season:'20192020' }, { team:'TBL', season:'20202021' },
  { team:'COL', season:'20212022' }, { team:'VGK', season:'20222023' },
  { team:'FLA', season:'20232024' },
];

// ── Cup fallback rosters ───────────────────────────────────────────────────────
const CUP_FALLBACK = {
  'EDM-19891990': [
    "Mark Messier","Glenn Anderson","Esa Tikkanen","Craig MacTavish","Jari Kurri",
    "Adam Graves","Bill Ranford","Grant Fuhr","Joe Murphy","Craig Simpson",
    "Steve Smith","Kevin Lowe","Charlie Huddy","Kelly Buchberger",
  ],
  'PIT-19901991': [
    "Mario Lemieux","Jaromir Jagr","Paul Coffey","Ron Francis","Mark Recchi",
    "Kevin Stevens","Tom Barrasso","Larry Murphy","Bryan Trottier","Bob Errey",
    "Ulf Samuelsson","Joe Mullen","Phil Bourque","Peter Taglianetti",
  ],
  'PIT-19911992': [
    "Mario Lemieux","Jaromir Jagr","Ron Francis","Kevin Stevens","Rick Tocchet",
    "Larry Murphy","Tom Barrasso","Ulf Samuelsson","Bryan Trottier",
    "Joe Mullen","Shawn McEachern","Kjell Samuelsson",
  ],
  'MTL-19921993': [
    "Patrick Roy","Guy Carbonneau","Kirk Muller","Vincent Damphousse",
    "Brian Bellows","Denis Savard","Eric Desjardins","Mathieu Schneider",
    "John LeClair","Mike Keane","Stephan Lebeau","Lyle Odelein",
  ],
  'NYR-19931994': [
    "Mark Messier","Brian Leetch","Adam Graves","Mike Richter","Sergei Zubov",
    "Glenn Anderson","Craig MacTavish","Alexei Kovalev","Esa Tikkanen",
    "Steve Larmer","Jeff Beukeboom","Kevin Lowe","Nick Kypreos",
  ],
  'NJD-19941995': [
    "Martin Brodeur","Scott Stevens","Scott Niedermayer","Claude Lemieux",
    "Neal Broten","John MacLean","Stephane Richer","Bobby Holik","Ken Daneyko",
    "Dave Andreychuk","Brian Rolston","Tommy Albelin","Bill Guerin",
  ],
  'COL-19951996': [
    "Patrick Roy","Joe Sakic","Peter Forsberg","Claude Lemieux","Adam Deadmarsh",
    "Mike Ricci","Sandis Ozolinsh","Adam Foote","Valeri Kamensky","Mike Keane",
    "Rene Corbet","Jon Klemm","Uwe Krupp",
  ],
  'DET-19961997': [
    "Steve Yzerman","Brendan Shanahan","Nicklas Lidstrom",
    "Igor Larionov","Sergei Fedorov","Larry Murphy","Darren McCarty",
    "Mike Vernon","Kirk Maltby","Kris Draper","Tomas Holmstrom",
    "Viacheslav Fetisov","Vladimir Konstantinov","Martin Lapointe",
  ],
  'DET-19971998': [
    "Steve Yzerman","Brendan Shanahan","Nicklas Lidstrom",
    "Igor Larionov","Sergei Fedorov","Larry Murphy","Darren McCarty",
    "Chris Osgood","Kirk Maltby","Kris Draper","Tomas Holmstrom",
    "Martin Lapointe","Doug Brown",
  ],
  'DAL-19981999': [
    "Brett Hull","Mike Modano","Ed Belfour","Derian Hatcher","Joe Nieuwendyk",
    "Sergei Zubov","Pat Verbeek","Jere Lehtinen","Guy Carbonneau",
    "Darryl Sydor","Jamie Langenbrunner","Richard Matvichuk",
  ],
  'NJD-19992000': [
    "Martin Brodeur","Scott Stevens","Scott Niedermayer","Patrik Elias",
    "Brian Rafalski","Jason Arnott","Petr Sykora","Bobby Holik","Ken Daneyko",
    "Dave Andreychuk","Claude Lemieux","Randy McKay","Sergei Brylin","Colin White",
  ],
  'COL-20002001': [
    "Patrick Roy","Joe Sakic","Peter Forsberg","Alex Tanguay","Ray Bourque",
    "Adam Foote","Milan Hejduk","Chris Drury","Rob Blake",
    "Steven Reinprecht","Martin Skoula","Jon Klemm",
  ],
  'DET-20012002': [
    "Steve Yzerman","Brendan Shanahan","Nicklas Lidstrom","Dominik Hasek",
    "Sergei Fedorov","Brett Hull","Luc Robitaille","Chris Chelios",
    "Igor Larionov","Tomas Holmstrom","Kris Draper","Kirk Maltby",
    "Fredrik Olausson","Darren McCarty","Pavel Datsyuk",
  ],
  'NJD-20022003': [
    "Martin Brodeur","Scott Stevens","Scott Niedermayer","Patrik Elias",
    "Jeff Friesen","Brian Gionta","Grant Marshall","Ken Daneyko",
    "Jamie Langenbrunner","John Madden","Colin White","Sergei Brylin",
  ],
  'CAR-20052006': [
    "Cam Ward","Rod Brind'Amour","Eric Staal","Justin Williams","Doug Weight",
    "Glen Wesley","Martin Gerber","Mark Recchi","Ray Whitney","Matt Cullen",
    "Niclas Wallin","Mike Commodore","Andrew Ladd","Frantisek Kaberle",
  ],
  'ANA-20062007': [
    "Jean-Sebastien Giguere","Scott Niedermayer","Chris Pronger","Teemu Selanne",
    "Corey Perry","Ryan Getzlaf","Samuel Pahlsson","Rob Niedermayer",
    "Andy McDonald","Travis Moen","Dustin Penner","Ilya Bryzgalov",
    "Francois Beauchemin","Mathieu Schneider","Todd Marchant",
  ],
  'DET-20072008': [
    "Henrik Zetterberg","Pavel Datsyuk","Nicklas Lidstrom",
    "Tomas Holmstrom","Kris Draper","Kirk Maltby","Darren McCarty",
    "Mikael Samuelsson","Brian Rafalski","Jiri Hudler","Dan Cleary",
    "Chris Osgood","Valtteri Filppula","Johan Franzen","Chris Chelios",
  ],
  'PIT-20082009': [
    "Sidney Crosby","Evgeni Malkin","Marc-Andre Fleury","Jordan Staal",
    "Maxime Talbot","Tyler Kennedy","Bill Guerin","Chris Kunitz",
    "Sergei Gonchar","Brooks Orpik","Kris Letang","Rob Scuderi",
    "Pascal Dupuis","Ruslan Fedotenko","Miroslav Satan",
  ],
  'CHI-20092010': [
    "Jonathan Toews","Patrick Kane","Duncan Keith","Brent Seabrook",
    "Marian Hossa","Patrick Sharp","Dave Bolland","Dustin Byfuglien",
    "Antti Niemi","Brian Campbell","Niklas Hjalmarsson","Kris Versteeg",
    "Andrew Ladd","John Madden","Tomas Kopecky",
  ],
  'BOS-20102011': [
    "Tim Thomas","Patrice Bergeron","Zdeno Chara","David Krejci",
    "Brad Marchand","Milan Lucic","Nathan Horton","Mark Recchi",
    "Dennis Seidenberg","Andrew Ference","Rich Peverley",
    "Chris Kelly","Gregory Campbell","Johnny Boychuk",
  ],
};

// ── Manual supplement ─────────────────────────────────────────────────────────
const MANUAL_PLAYERS = [

  // ══ Legends the roster API may miss ══
  { n:"Jaromir Jagr",       t:["PIT","WSH","NYR","PHI","DAL","BOS","NJD","FLA","CGY"], c:"CZE" },
  { n:"Mario Lemieux",      t:["PIT"],                                            c:"CAN" },
  { n:"Wayne Gretzky",      t:["EDM","LAK","STL","NYR"],                         c:"CAN" },
  { n:"Mark Messier",       t:["EDM","NYR","VAN"],                               c:"CAN" },
  { n:"Patrick Roy",        t:["MTL","COL"],                                     c:"CAN" },
  { n:"Martin Brodeur",     t:["NJD","STL"],                                     c:"CAN" },
  { n:"Steve Yzerman",      t:["DET"],                                           c:"CAN" },
  { n:"Brendan Shanahan",   t:["NJD","STL","DET","NYR"],                        c:"CAN" },
  { n:"Brett Hull",         t:["CGY","STL","DAL","DET","PHX"],                  c:"USA" },
  { n:"Luc Robitaille",     t:["LAK","PIT","NYR","DET"],                        c:"CAN" },
  { n:"Joe Sakic",          t:["COL"],                                           c:"CAN" },
  { n:"Peter Forsberg",     t:["COL","PHI","NSH"],                              c:"SWE" },
  { n:"Mike Modano",        t:["DAL","DET"],                                    c:"USA" },
  { n:"Mats Sundin",        t:["TOR","VAN"],                                    c:"SWE" },
  { n:"Eric Lindros",       t:["PHI","NYR","TOR","DAL"],                        c:"CAN" },
  { n:"Teemu Selanne",      t:["WPG","ANA","SJS","COL"],                        c:"FIN" },
  { n:"Saku Koivu",         t:["MTL","ANA"],                                    c:"FIN" },
  { n:"Jari Kurri",         t:["EDM","LAK","NYR","ANA","COL"],                 c:"FIN" },
  { n:"Nicklas Lidstrom",   t:["DET"],                                          c:"SWE" },
  { n:"Scott Niedermayer",  t:["NJD","ANA"],                                    c:"CAN" },
  { n:"Chris Chelios",      t:["MTL","CHI","DET","ATL"],                        c:"USA" },
  { n:"Ray Bourque",        t:["BOS","COL"],                                    c:"CAN" },
  { n:"Al MacInnis",        t:["CGY","STL"],                                    c:"CAN" },
  { n:"Paul Coffey",        t:["EDM","PIT","LAK","DET","PHI","CHI","BOS","CAR"], c:"CAN" },
  { n:"Denis Potvin",       t:["NYI"],                                          c:"CAN" },
  { n:"Bryan Trottier",     t:["NYI","PIT"],                                    c:"CAN" },
  { n:"Mike Bossy",         t:["NYI"],                                          c:"CAN" },
  { n:"Guy Lafleur",        t:["MTL","NYR"],                                    c:"CAN" },
  { n:"Ken Dryden",         t:["MTL"],                                          c:"CAN" },
  { n:"Phil Esposito",      t:["CHI","BOS","NYR"],                              c:"CAN" },
  { n:"Bobby Orr",          t:["BOS","CHI"],                                    c:"CAN" },
  { n:"Gordie Howe",        t:["DET"],                                          c:"CAN" },
  { n:"Guy Carbonneau",     t:["MTL","STL","DAL"],                              c:"CAN" },
  { n:"Doug Gilmour",       t:["STL","CGY","TOR","NJD","CHI","BUF","MTL"],     c:"CAN" },
  { n:"Ron Francis",        t:["PIT","CAR","TOR"],                              c:"CAN" },
  { n:"Sergei Fedorov",     t:["DET","ANA","CBJ","WSH"],                       c:"RUS" },
  { n:"Dominik Hasek",      t:["CHI","BUF","DET","OTT"],                       c:"CZE" },
  { n:"Claude Lemieux",     t:["MTL","NJD","COL","PHX","DAL","SJS"],           c:"CAN" },
  { n:"Sergei Makarov",     t:["CGY","SJS"],                                    c:"RUS" },
  { n:"Pavel Bure",         t:["VAN","FLA","NYR"],                              c:"RUS" },
  { n:"Bill Ranford",       t:["EDM","BOS","WSH","TBL","DET"],                 c:"CAN" },
  { n:"Dirk Graham",        t:["CHI","MIN"],                                    c:"CAN" },
  { n:"Scott Stevens",      t:["WSH","STL","NJD"],                             c:"CAN" },
  { n:"Joe Nieuwendyk",     t:["CGY","DAL","NJD","TOR","FLA"],                 c:"CAN" },
  { n:"Mike Vernon",        t:["CGY","DET","SJS","FLA"],                       c:"CAN" },

  // ══ Award winners the API bio endpoint misses (retired) ══
  { n:"Chris Pronger",          t:["STL","EDM","ANA","PHI"],                     c:"CAN" },
  { n:"Jose Theodore",          t:["MTL","COL","WSH","MIN","FLA"],               c:"CAN" },
  { n:"Martin St. Louis",       t:["CGY","TBL","NYR"],                           c:"CAN" },
  { n:"Joe Thornton",           t:["BOS","SJS","TOR","FLA"],                     c:"CAN" },
  { n:"Henrik Sedin",           t:["VAN"],                                        c:"SWE" },
  { n:"Daniel Sedin",           t:["VAN"],                                        c:"SWE" },
  { n:"Ed Belfour",             t:["CHI","SJS","DAL","TOR","FLA"],               c:"CAN" },
  { n:"Jim Carey",              t:["WSH"],                                        c:"USA" },
  { n:"Olaf Kolzig",            t:["WSH"],                                        c:"GER" },
  { n:"Miikka Kiprusoff",       t:["SJS","CGY"],                                 c:"FIN" },
  { n:"Tim Thomas",             t:["BOS"],                                        c:"USA" },
  { n:"Ryan Miller",            t:["BUF","STL","VAN","ANA"],                     c:"USA" },
  { n:"Henrik Lundqvist",       t:["NYR"],                                        c:"SWE" },
  { n:"Tuukka Rask",            t:["BOS"],                                        c:"FIN" },
  { n:"Braden Holtby",          t:["WSH","DAL","VAN"],                           c:"CAN" },
  { n:"Pekka Rinne",            t:["NSH"],                                        c:"FIN" },
  { n:"Marc-Andre Fleury",      t:["PIT","VGK","CHI","MIN"],                    c:"CAN" },
  { n:"Brian Leetch",           t:["NYR","TOR","BOS"],                           c:"USA" },
  { n:"Rob Blake",              t:["LAK","COL","SJS"],                           c:"CAN" },
  { n:"Duncan Keith",           t:["CHI","EDM"],                                 c:"CAN" },
  { n:"Zdeno Chara",            t:["NYI","OTT","BOS","WSH"],                    c:"SVK" },
  { n:"P.K. Subban",            t:["MTL","NSH","NJD"],                           c:"CAN" },
  { n:"Mark Giordano",          t:["CGY","SEA","TOR"],                           c:"CAN" },
  { n:"Jarome Iginla",          t:["CGY","PIT","BOS","COL","LAK"],              c:"CAN" },
  { n:"Milan Hejduk",           t:["COL"],                                        c:"CZE" },
  { n:"Rick Nash",              t:["CBJ","NYR","BOS"],                           c:"CAN" },
  { n:"Ilya Kovalchuk",         t:["ATL","NJD","LAK"],                          c:"RUS" },
  { n:"Jonathan Cheechoo",      t:["SJS","OTT"],                                 c:"CAN" },
  { n:"Vincent Lecavalier",     t:["TBL","PHI"],                                 c:"CAN" },
  { n:"Daniel Alfredsson",      t:["OTT","DET"],                                 c:"SWE" },
  { n:"Bryan Berard",           t:["NYI","TOR","CHI","BOS"],                    c:"USA" },
  { n:"Sergei Samsonov",        t:["BOS","EDM","CHI","MTL","CAR","FLA","NJD"],  c:"RUS" },
  { n:"Chris Drury",            t:["COL","CGY","BUF","NYR"],                    c:"USA" },
  { n:"Scott Gomez",            t:["NJD","NYR","MTL","SJS","STL","OTT"],        c:"USA" },
  { n:"Evgeni Nabokov",         t:["SJS","NYI","TBL"],                          c:"RUS" },
  { n:"Dany Heatley",           t:["ATL","OTT","SJS","MIN","ANA"],              c:"CAN" },
  { n:"Barret Jackman",         t:["STL"],                                        c:"CAN" },
  { n:"Andrew Raycroft",        t:["BOS","TOR","COL","DAL","VAN"],              c:"CAN" },
  { n:"Steve Mason",            t:["CBJ","PHI","WPG"],                           c:"CAN" },
  { n:"Jeff Skinner",           t:["CAR","BUF"],                                 c:"CAN" },
  { n:"Jean-Sebastien Giguere", t:["ANA","TOR","COL"],                          c:"CAN" },
  { n:"Brad Richards",          t:["TBL","DAL","NYR","CHI","DET"],              c:"CAN" },
  { n:"Cam Ward",               t:["CAR"],                                        c:"CAN" },
  { n:"Henrik Zetterberg",      t:["DET"],                                        c:"SWE" },
  { n:"Justin Williams",        t:["PHI","CAR","LAK","WSH"],                    c:"CAN" },
  { n:"Rick Meagher",           t:["STL"],                                        c:"CAN" },
  { n:"Michael Peca",           t:["VAN","BUF","NYI","EDM","CBJ","TOR"],        c:"CAN" },
  { n:"Jere Lehtinen",          t:["DAL"],                                        c:"FIN" },
  { n:"John Madden",            t:["NJD","CHI","MIN","FLA"],                     c:"CAN" },
  { n:"Kris Draper",            t:["DET"],                                        c:"CAN" },
  { n:"Rod Brind'Amour",        t:["STL","PHI","CAR"],                          c:"CAN" },
  { n:"Pavel Datsyuk",          t:["DET"],                                        c:"RUS" },
  { n:"Ryan Kesler",            t:["VAN","ANA"],                                 c:"USA" },
  { n:"Patrice Bergeron",       t:["BOS"],                                        c:"CAN" },
  { n:"Markus Naslund",         t:["PIT","VAN","NYR"],                           c:"SWE" },

  // ══ Notable prospects (0 NHL GP yet) ══
  { n:"Konsta Helenius",    t:["NSH"],                                          c:"FIN" },
  { n:"Matvei Michkov",     t:["PHI"],                                          c:"RUS" },
  { n:"Leo Carlsson",       t:["ANA"],                                          c:"SWE" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
let requestCount = 0;

async function getJSON(url) {
  await sleep(DELAY_MS);
  requestCount++;
  if (requestCount % BATCH_SIZE === 0) {
    console.log(`\n  [pausing ${BATCH_PAUSE/1000}s after ${requestCount} requests…]`);
    await sleep(BATCH_PAUSE);
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'nhl-grid-game/2.1 (personal project)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function tryGetJSON(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await getJSON(url);
    } catch (e) {
      if (attempt < retries) {
        const wait = 1000 * Math.pow(2, attempt - 1);
        await sleep(wait);
      }
    }
  }
  return null;
}

function normalizeName(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u2032\u0060\u00B4]/g, "'")
    .toLowerCase()
    .trim();
}

function natCode(cc) {
  const M = {
    CAN:'CAN', USA:'USA', SWE:'SWE', FIN:'FIN', RUS:'RUS',
    CZE:'CZE', SVK:'SVK', DEU:'GER', GER:'GER', SUI:'SUI', CHE:'SUI',
    AUT:'AUT', NOR:'NOR', DNK:'DNK', LVA:'LVA', BLR:'BLR',
    FRA:'FRA', SVN:'SVN', KAZ:'KAZ', AUS:'AUS', GBR:'GBR',
  };
  return M[cc] || cc;
}

const TEAM_ALIAS = {
  QUE: 'COL', HFD: 'CAR', ATL: 'WPG', PHX: 'UTA', ARI: 'UTA', MNS: 'DAL',
};

function resolveTeam(code) {
  return TEAM_ALIAS[code] || code;
}

// ── Load existing players.js ──────────────────────────────────────────────────

function loadExistingDB() {
  if (!existsSync(OUT_FILE)) {
    console.log('  No existing players.js — starting fresh.');
    return new Map();
  }
  try {
    const src = readFileSync(OUT_FILE, 'utf8');
    const ctx = {};
    vm.runInNewContext(src, ctx);
    const arr = Array.isArray(ctx.DB) ? ctx.DB : [];
    const map = new Map();
    for (const p of arr) {
      const key = normalizeName(p.n);
      map.set(key, {
        name:   p.n,
        teams:  Array.isArray(p.t) ? [...p.t] : [],
        nat:    p.c || '',
        awards: Array.isArray(p.a) ? [...p.a] : [],
      });
    }
    console.log(`  Loaded ${map.size} existing players.`);
    return map;
  } catch (e) {
    console.warn(`  ⚠ Could not parse existing players.js: ${e.message}`);
    return new Map();
  }
}

// ── Step 1: Roster sweep ──────────────────────────────────────────────────────

async function fetchTeamSeasons(team) {
  const data = await tryGetJSON(`https://api-web.nhle.com/v1/roster-season/${team}`);
  if (!data || !Array.isArray(data)) return ['20232024'];
  return data.map(String);
}

async function collectPlayerIds() {
  console.log('Step 1: Collecting player IDs and team data from all rosters…');

  const ids             = new Set();
  const rosterTeamMap   = new Map();   // playerId → Set<teamCode>
  const cupPlayerIds    = new Set();
  const cupPlayerNames  = new Set();   // normalized names from Cup rosters
  const coveredCupKeys  = new Set();

  const cupSeasonSet = new Set(CUP_SEASONS.map(s => `${s.team}-${s.season}`));

  function processRoster(data, teamCode, isCup) {
    if (!data) return false;
    let found = false;
    for (const grp of ['forwards', 'defensemen', 'goalies']) {
      for (const p of (data[grp] || [])) {
        ids.add(p.id);
        if (!rosterTeamMap.has(p.id)) rosterTeamMap.set(p.id, new Set());
        rosterTeamMap.get(p.id).add(resolveTeam(teamCode));
        if (isCup) {
          cupPlayerIds.add(p.id);
          // Also capture name for name-based matching (catches MANUAL_PLAYERS)
          const firstName = p.firstName?.default || '';
          const lastName  = p.lastName?.default || '';
          const name = `${firstName} ${lastName}`.trim();
          if (name) cupPlayerNames.add(normalizeName(name));
          found = true;
        }
      }
    }
    return found;
  }

  for (const team of TEAM_CODES) {
    const seasons = await fetchTeamSeasons(team);
    for (const season of seasons) {
      const key = `${team}-${season}`;
      const isCup = cupSeasonSet.has(key);
      const data  = await tryGetJSON(`https://api-web.nhle.com/v1/roster/${team}/${season}`);
      const hasPlayers = data &&
        ((data.forwards?.length || 0) + (data.defensemen?.length || 0) + (data.goalies?.length || 0)) > 0;
      if (hasPlayers) {
        processRoster(data, team, isCup);
        if (isCup) coveredCupKeys.add(key);
      }
    }
    process.stdout.write(`  ${team} done (${ids.size} IDs total)\r`);
  }
  console.log(`\n  Main sweep: ${ids.size} IDs, ${cupPlayerIds.size} Cup winners, ${cupPlayerNames.size} Cup names.`);

  // Safety sweep for any uncovered Cup seasons
  console.log('  Verifying Cup season coverage…');
  const missingCupKeys = CUP_SEASONS.map(s => `${s.team}-${s.season}`).filter(k => !coveredCupKeys.has(k));
  if (missingCupKeys.length === 0) {
    console.log('  ✓ All Cup seasons covered.');
  } else {
    for (const key of missingCupKeys) {
      const [team, season] = key.split('-');
      process.stdout.write(`  ↳ Force-fetching ${team} ${season}…`);
      const data = await tryGetJSON(`https://api-web.nhle.com/v1/roster/${team}/${season}`);
      const hasPlayers = data &&
        ((data.forwards?.length || 0) + (data.defensemen?.length || 0) + (data.goalies?.length || 0)) > 0;
      if (hasPlayers) {
        processRoster(data, team, true);
        coveredCupKeys.add(key);
        console.log(` ✓`);
      } else {
        console.log(` ✗ (fallback will cover)`);
      }
    }
  }

  return { ids: [...ids], rosterTeamMap, cupPlayerIds, cupPlayerNames, coveredCupKeys };
}

// ── Step 2: Player bios ───────────────────────────────────────────────────────

async function fetchPlayerBio(id) {
  const data = await tryGetJSON(`https://api-web.nhle.com/v1/player/${id}/landing`);
  if (!data || !data.playerId) return null;

  const name = `${data.firstName?.default || ''} ${data.lastName?.default || ''}`.trim();
  if (!name) return null;

  const nat = natCode(data.birthCountry || '');

  const teams = new Set();
  for (const s of (data.seasonTotals || []))
    if (s.gameTypeId === 2 && s.leagueAbbrev === 'NHL' && s.teamAbbrev)
      teams.add(resolveTeam(s.teamAbbrev.toUpperCase()));
  if (data.currentTeamAbbrev)
    teams.add(resolveTeam(data.currentTeamAbbrev.toUpperCase()));

  const knownTeams = [...teams].filter(t => TEAM_CODES.includes(t));

  const totalGP = (data.seasonTotals || [])
    .filter(s => s.gameTypeId === 2 && s.leagueAbbrev === 'NHL')
    .reduce((sum, s) => sum + (s.gamesPlayed || 0), 0);

  if (knownTeams.length === 0 || totalGP < MIN_GP) return null;

  return { id, name, teams: knownTeams, nat, awards: [] };
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED: Merge + Awards + Write logic (used by both full and quick mode)
// ══════════════════════════════════════════════════════════════════════════════

function mergeManualPlayers(all, nameKeySet) {
  let mAdded = 0, mMerged = 0;
  for (const m of MANUAL_PLAYERS) {
    const resolvedTeams = m.t.map(resolveTeam);
    const key = normalizeName(m.n);
    if (nameKeySet.has(key)) {
      const ex = nameKeySet.get(key);
      for (const t of resolvedTeams) if (!ex.teams.includes(t)) ex.teams.push(t);
      mMerged++;
    } else {
      const newP = { id: null, name: m.n, teams: resolvedTeams, nat: m.c, awards: [] };
      all.push(newP);
      nameKeySet.set(key, newP);
      mAdded++;
    }
  }
  return { mAdded, mMerged };
}

function applyHardcodedAwards(all, nameKeySet) {
  let hits = 0;
  const missing = [];
  for (const [awardKey, winners] of Object.entries(AWARD_WINNERS)) {
    for (const winnerName of winners) {
      const norm  = normalizeName(winnerName);
      const found = nameKeySet.get(norm);
      if (found) {
        if (!found.awards.includes(awardKey)) found.awards.push(awardKey);
        hits++;
      } else {
        missing.push({ award: awardKey, name: winnerName });
      }
    }
  }
  return { hits, missing };
}

function applyCupByNames(all, cupNames) {
  let count = 0;
  for (const p of all) {
    if (cupNames.has(normalizeName(p.name))) {
      if (!p.awards.includes('StanleyCup')) { p.awards.push('StanleyCup'); count++; }
    }
  }
  return count;
}

function mergeExistingDB(all, existingDB) {
  let teamsAdded = 0, awardsAdded = 0, preserved = 0;

  for (const p of all) {
    const ex = existingDB.get(normalizeName(p.name));
    if (!ex) continue;
    for (const t of ex.teams)  if (TEAM_CODES.includes(t) && !p.teams.includes(t)) { p.teams.push(t); teamsAdded++; }
    for (const a of ex.awards) if (!p.awards.includes(a)) { p.awards.push(a); awardsAdded++; }
  }

  const currentKeys = new Set(all.map(p => normalizeName(p.name)));
  for (const [key, ex] of existingDB.entries()) {
    if (!currentKeys.has(key)) {
      all.push({ id: null, name: ex.name, teams: ex.teams, nat: ex.nat, awards: ex.awards });
      preserved++;
    }
  }

  return { teamsAdded, awardsAdded, preserved };
}

function writeDB(all) {
  all.sort((a, b) => a.name.localeCompare(b.name));

  const lines = all.map(p => {
    const aStr = p.awards.length ? `, a:${JSON.stringify(p.awards.sort())}` : '';
    return `  { n:${JSON.stringify(p.name)}, t:${JSON.stringify(p.teams)}, c:${JSON.stringify(p.nat)}${aStr} }`;
  });

  const output =
`// players.js — NHL Player Database
// Auto-generated by fetch-nhl-players.js on ${new Date().toISOString().slice(0,10)}
// ${all.length} players | To update: node fetch-nhl-players.js  (Node.js 18+)
//
// Format: { n:"Name", t:["TEAM",...], c:"NAT", a:["Award",...] }
// Award keys: Hart, Vezina, Norris, ArtRoss, RocketRichard,
//             Calder, TedLindsay, ConnSmythe, Selke, StanleyCup
// Nationality: CAN, USA, SWE, FIN, RUS, CZE, SVK, GER, SUI, ...

const DB = [
${lines.join(',\n')}
];
`;

  writeFileSync(OUT_FILE, output, 'utf8');
  return { count: all.length, sizeKB: (output.length / 1024).toFixed(1) };
}

function printValidation(all, missingAwardNames, coveredCupKeys) {
  console.log('\n════════════════════════ VALIDATION REPORT ════════════════════════');

  console.log('\n── Stanley Cup season coverage ──');
  for (const { team, season } of CUP_SEASONS) {
    const key = `${team}-${season}`;
    const src = coveredCupKeys?.has(key)  ? '✓ API' :
                CUP_FALLBACK[key]         ? '✓ fallback' :
                                            '✗ NOT COVERED';
    console.log(`  ${team} ${season}: ${src}`);
  }

  if (missingAwardNames.length > 0) {
    console.log('\n── Award winners not found in DB ──');
    for (const { award, name } of missingAwardNames)
      console.log(`  ⚠ ${award}: "${name}"`);
  } else {
    console.log('\n── All hardcoded award winners found in DB ✓ ──');
  }

  const natC = {}, awdC = {};
  let withAwards = 0;
  for (const p of all) {
    natC[p.nat] = (natC[p.nat] || 0) + 1;
    if (p.awards.length) {
      withAwards++;
      for (const a of p.awards) awdC[a] = (awdC[a] || 0) + 1;
    }
  }
  console.log('\nTop nationalities:');
  Object.entries(natC).sort((a,b) => b[1]-a[1]).slice(0, 10)
    .forEach(([c,n]) => console.log(`  ${c}: ${n}`));
  console.log('\nAward counts:');
  Object.entries(awdC).sort((a,b) => b[1]-a[1])
    .forEach(([a,n]) => console.log(`  ${a}: ${n}`));
  console.log(`\nPlayers with awards: ${withAwards} / ${all.length}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('=== NHL Player Database Builder v2.1 ===\n');

  // 0. Load existing DB
  console.log('Step 0: Loading existing players.js…');
  const existingDB = loadExistingDB();

  if (QUICK_MODE) {
    // ────────────────────────────────────────────────────────────────────────
    // QUICK MODE — no API calls, just reprocess with manual players + awards
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n⚡ QUICK MODE — skipping API, reprocessing existing DB.\n');

    // Start from existing DB
    const all = [];
    for (const [, ex] of existingDB.entries()) {
      all.push({ id: null, name: ex.name, teams: [...ex.teams], nat: ex.nat, awards: [...ex.awards] });
    }
    console.log(`  Starting with ${all.length} players from existing DB.`);

    // Merge manual players
    const nameKeySet = new Map(all.map(p => [normalizeName(p.name), p]));
    const { mAdded, mMerged } = mergeManualPlayers(all, nameKeySet);
    console.log(`  Manual: ${mAdded} added, ${mMerged} merged.`);

    // Apply hardcoded awards
    const { hits, missing } = applyHardcodedAwards(all, nameKeySet);
    console.log(`  Awards: ${hits} applied, ${missing.length} not found.`);

    // Apply ALL CUP_FALLBACK names (in quick mode we use all fallbacks)
    const allCupNames = new Set();
    for (const names of Object.values(CUP_FALLBACK))
      for (const n of names) allCupNames.add(normalizeName(n));
    const cupFromFallback = applyCupByNames(all, allCupNames);
    console.log(`  Cup from fallback names: ${cupFromFallback}`);

    // Write
    const { count, sizeKB } = writeDB(all);
    console.log(`\n✅ Done! ${count} players, ${sizeKB} KB`);

    // Collect all covered keys from fallback for validation display
    const coveredFromFallback = new Set(Object.keys(CUP_FALLBACK));
    printValidation(all, missing, coveredFromFallback);
    return;
  }

  // ────────────────────────────────────────────────────────────────────────
  // FULL MODE — API fetch + merge
  // ────────────────────────────────────────────────────────────────────────
  console.log(`Settings: delay=${DELAY_MS}ms, batch=${BATCH_SIZE}@${BATCH_PAUSE/1000}s, retries=${MAX_RETRIES}\n`);

  // 1. Collect IDs + roster data
  const { ids, rosterTeamMap, cupPlayerIds, cupPlayerNames, coveredCupKeys } = await collectPlayerIds();

  // 2. Fetch bios
  console.log(`\nStep 2: Fetching bios for ${ids.length} players…`);
  const players = [];
  let done = 0, skipped = 0;

  for (const id of ids) {
    const p = await fetchPlayerBio(id);
    done++;
    if (p) {
      const rosterTeams = rosterTeamMap.get(id);
      if (rosterTeams) {
        for (const t of rosterTeams) {
          if (TEAM_CODES.includes(t) && !p.teams.includes(t)) p.teams.push(t);
        }
      }
      players.push(p);
    } else {
      skipped++;
    }
    if (done % 100 === 0) {
      process.stdout.clearLine?.(0);
      process.stdout.cursorTo?.(0);
      process.stdout.write(`  ${done}/${ids.length} | ${players.length} valid | ${skipped} skipped`);
    }
  }
  console.log(`\n  ${players.length} valid, ${skipped} skipped.`);

  // 3. Dedup
  console.log('\nStep 3: Deduplicating…');
  const dedupedMap = new Map();
  for (const p of players) {
    if (dedupedMap.has(p.id)) {
      const ex = dedupedMap.get(p.id);
      for (const t of p.teams) if (!ex.teams.includes(t)) ex.teams.push(t);
    } else {
      dedupedMap.set(p.id, p);
    }
  }
  const all = [...dedupedMap.values()];
  console.log(`  ${all.length} unique players.`);

  // 4. Cup awards — ID-based first, then name-based
  console.log('\nStep 4: Assigning Stanley Cup…');
  let cupFromId = 0;
  for (const p of all) {
    if (p.id && cupPlayerIds.has(p.id)) {
      if (!p.awards.includes('StanleyCup')) { p.awards.push('StanleyCup'); cupFromId++; }
    }
  }
  console.log(`  ${cupFromId} from roster IDs.`);

  // 5. Cup fallback names for uncovered seasons + name-based matching from live rosters
  console.log('\nStep 5: Cup fallback + name matching…');
  // Add CUP_FALLBACK names for any uncovered seasons
  for (const { team, season } of CUP_SEASONS) {
    const key = `${team}-${season}`;
    if (!coveredCupKeys.has(key) && CUP_FALLBACK[key]) {
      for (const n of CUP_FALLBACK[key]) cupPlayerNames.add(normalizeName(n));
      console.log(`  ↳ ${team} ${season}: fallback loaded`);
    }
  }
  // ALSO always add all CUP_FALLBACK names as safety net
  // (even for covered seasons — catches players whose IDs didn't match)
  for (const names of Object.values(CUP_FALLBACK))
    for (const n of names) cupPlayerNames.add(normalizeName(n));

  const cupFromNames = applyCupByNames(all, cupPlayerNames);
  console.log(`  ${cupFromNames} additional from name matching.`);

  // 6. Merge manual supplement
  console.log('\nStep 6: Manual supplement…');
  const nameKeySet = new Map(all.map(p => [normalizeName(p.name), p]));
  const { mAdded, mMerged } = mergeManualPlayers(all, nameKeySet);
  console.log(`  ${mAdded} added, ${mMerged} merged.`);

  // Re-run Cup name matching for newly added manual players
  const cupFromManual = applyCupByNames(all, cupPlayerNames);
  if (cupFromManual > 0) console.log(`  ${cupFromManual} Cup awards for manual players.`);

  // 7. Hardcoded awards
  console.log('\nStep 7: Hardcoded awards…');
  // Rebuild nameKeySet after manual additions
  const finalNameKeySet = new Map(all.map(p => [normalizeName(p.name), p]));
  const { hits, missing } = applyHardcodedAwards(all, finalNameKeySet);
  console.log(`  ${hits} applied, ${missing.length} not found.`);

  // 8. Merge with existing DB
  console.log('\nStep 8: Merge with existing DB…');
  const { teamsAdded, awardsAdded, preserved } = mergeExistingDB(all, existingDB);
  console.log(`  +${teamsAdded} teams, +${awardsAdded} awards from old DB. ${preserved} preserved.`);

  // 9. Write
  const { count, sizeKB } = writeDB(all);
  console.log(`\n✅ Done! ${count} players, ${sizeKB} KB`);

  printValidation(all, missing, coveredCupKeys);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
