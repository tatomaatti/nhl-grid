#!/usr/bin/env bash
# verify-s04.sh — S04 slice verification: JS-erotus ja koodin siistiminen
# Tarkistaa tiedostojen olemassaolo, rivimäärät, inline-JS:n puuttuminen,
# script src -tagit, ja kategoriadata/config oikeissa tiedostoissa.
# Exitkoodi 0 vain jos kaikki passaavat.

set -u
FAIL_COUNT=0

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

echo "=== S04 Verification: JS-erotus ==="
echo ""

# ─── Tiedostojen olemassaolo ──────────────────────────────────
echo "[Tiedostot]"
for f in shared.js config.js daily-game.js grid-game.js; do
  [ -f "$f" ] \
    && pass "$f olemassa" \
    || fail "$f PUUTTUU"
done

# ─── Rivimäärät ──────────────────────────────────────────────
echo ""
echo "[Rivimäärät]"

DAILY_LINES=$(wc -l < daily.html 2>/dev/null | tr -d ' ')
if [ -n "$DAILY_LINES" ]; then
  if [ "$DAILY_LINES" -lt 700 ]; then
    pass "daily.html: $DAILY_LINES riviä (< 700)"
  else
    fail "daily.html: $DAILY_LINES riviä (odotettu < 700)"
  fi
else
  fail "daily.html: ei voitu lukea"
fi

INDEX_LINES=$(wc -l < index.html 2>/dev/null | tr -d ' ')
if [ -n "$INDEX_LINES" ]; then
  if [ "$INDEX_LINES" -lt 950 ]; then
    pass "index.html: $INDEX_LINES riviä (< 950)"
  else
    fail "index.html: $INDEX_LINES riviä (odotettu < 950)"
  fi
else
  fail "index.html: ei voitu lukea"
fi

DAILY_JS_LINES=$(wc -l < daily-game.js 2>/dev/null | tr -d ' ')
if [ -n "$DAILY_JS_LINES" ]; then
  if [ "$DAILY_JS_LINES" -gt 900 ]; then
    pass "daily-game.js: $DAILY_JS_LINES riviä (> 900)"
  else
    fail "daily-game.js: $DAILY_JS_LINES riviä (odotettu > 900)"
  fi
else
  fail "daily-game.js: ei voitu lukea"
fi

GRID_JS_LINES=$(wc -l < grid-game.js 2>/dev/null | tr -d ' ')
if [ -n "$GRID_JS_LINES" ]; then
  if [ "$GRID_JS_LINES" -gt 1200 ]; then
    pass "grid-game.js: $GRID_JS_LINES riviä (> 1200)"
  else
    fail "grid-game.js: $GRID_JS_LINES riviä (odotettu > 1200)"
  fi
else
  fail "grid-game.js: ei voitu lukea"
fi

# ─── Script src -tagit ────────────────────────────────────────
echo ""
echo "[Script src -tagit]"

# daily.html
grep -q '<script src="shared.js">' daily.html 2>/dev/null \
  && pass "daily.html sisältää <script src=\"shared.js\">" \
  || fail "daily.html EI sisällä <script src=\"shared.js\">"

grep -q '<script src="daily-game.js">' daily.html 2>/dev/null \
  && pass "daily.html sisältää <script src=\"daily-game.js\">" \
  || fail "daily.html EI sisällä <script src=\"daily-game.js\">"

# index.html
grep -q '<script src="shared.js">' index.html 2>/dev/null \
  && pass "index.html sisältää <script src=\"shared.js\">" \
  || fail "index.html EI sisällä <script src=\"shared.js\">"

grep -q '<script src="config.js">' index.html 2>/dev/null \
  && pass "index.html sisältää <script src=\"config.js\">" \
  || fail "index.html EI sisällä <script src=\"config.js\">"

grep -q '<script src="grid-game.js">' index.html 2>/dev/null \
  && pass "index.html sisältää <script src=\"grid-game.js\">" \
  || fail "index.html EI sisällä <script src=\"grid-game.js\">"

# ─── Script-tagien järjestys ──────────────────────────────────
echo ""
echo "[Script-tagien järjestys]"

# daily.html: players.js → shared.js → daily-game.js
DAILY_ORDER=$(grep '<script src=' daily.html 2>/dev/null | sed 's/.*src="\([^"]*\)".*/\1/' | tr '\n' ' ')
echo "  daily.html järjestys: $DAILY_ORDER"
DAILY_PLAYERS_LINE=$(grep -n '<script src="players.js">' daily.html 2>/dev/null | head -1 | cut -d: -f1)
DAILY_SHARED_LINE=$(grep -n '<script src="shared.js">' daily.html 2>/dev/null | head -1 | cut -d: -f1)
DAILY_GAME_LINE=$(grep -n '<script src="daily-game.js">' daily.html 2>/dev/null | head -1 | cut -d: -f1)
if [ -n "$DAILY_PLAYERS_LINE" ] && [ -n "$DAILY_SHARED_LINE" ] && [ -n "$DAILY_GAME_LINE" ]; then
  if [ "$DAILY_PLAYERS_LINE" -lt "$DAILY_SHARED_LINE" ] && [ "$DAILY_SHARED_LINE" -lt "$DAILY_GAME_LINE" ]; then
    pass "daily.html: players.js → shared.js → daily-game.js"
  else
    fail "daily.html: väärä latausjärjestys"
  fi
else
  fail "daily.html: script-tageja puuttuu"
fi

# index.html: players.js → shared.js → config.js → peerjs → grid-game.js
INDEX_ORDER=$(grep '<script src=' index.html 2>/dev/null | sed 's/.*src="\([^"]*\)".*/\1/' | tr '\n' ' ')
echo "  index.html järjestys: $INDEX_ORDER"
IDX_PLAYERS_LINE=$(grep -n '<script src="players.js">' index.html 2>/dev/null | head -1 | cut -d: -f1)
IDX_SHARED_LINE=$(grep -n '<script src="shared.js">' index.html 2>/dev/null | head -1 | cut -d: -f1)
IDX_CONFIG_LINE=$(grep -n '<script src="config.js">' index.html 2>/dev/null | head -1 | cut -d: -f1)
IDX_GRID_LINE=$(grep -n '<script src="grid-game.js">' index.html 2>/dev/null | head -1 | cut -d: -f1)
if [ -n "$IDX_PLAYERS_LINE" ] && [ -n "$IDX_SHARED_LINE" ] && [ -n "$IDX_CONFIG_LINE" ] && [ -n "$IDX_GRID_LINE" ]; then
  if [ "$IDX_PLAYERS_LINE" -lt "$IDX_SHARED_LINE" ] && [ "$IDX_SHARED_LINE" -lt "$IDX_CONFIG_LINE" ] && [ "$IDX_CONFIG_LINE" -lt "$IDX_GRID_LINE" ]; then
    pass "index.html: players.js → shared.js → config.js → grid-game.js"
  else
    fail "index.html: väärä latausjärjestys"
  fi
else
  fail "index.html: script-tageja puuttuu"
fi

# ─── Inline-JS poistettu ─────────────────────────────────────
echo ""
echo "[Inline-JS poistettu]"

# daily.html: ei inline <script> -blokkia
if grep -q '^<script>' daily.html 2>/dev/null && ! grep '^<script>' daily.html 2>/dev/null | grep -q 'src='; then
  fail "daily.html: inline <script> -blokki löytyi"
else
  pass "daily.html: ei inline <script> -blokkeja"
fi

# index.html: ei inline <script> -blokkia
if grep -q '^<script>' index.html 2>/dev/null && ! grep '^<script>' index.html 2>/dev/null | grep -q 'src='; then
  fail "index.html: inline <script> -blokki löytyi"
else
  pass "index.html: ei inline <script> -blokkeja"
fi

# daily.html: ei const TEAMS
grep -q 'const TEAMS' daily.html 2>/dev/null \
  && fail "daily.html sisältää vielä 'const TEAMS' (inline-JS ei poistettu kokonaan)" \
  || pass "daily.html: ei 'const TEAMS' -määrittelyä"

# index.html: ei const TEAMS
grep -q 'const TEAMS' index.html 2>/dev/null \
  && fail "index.html sisältää vielä 'const TEAMS' (inline-JS ei poistettu kokonaan)" \
  || pass "index.html: ei 'const TEAMS' -määrittelyä"

# index.html: ei iceServers (siirretty config.js:ään)
grep -q 'iceServers' index.html 2>/dev/null \
  && fail "index.html sisältää vielä 'iceServers' (ICE_CONFIG ei siirretty)" \
  || pass "index.html: ei 'iceServers' -viittausta"

# ─── Jaetut tiedostot sisältävät oikeat muuttujat ────────────
echo ""
echo "[Jaetut tiedostot]"

grep -q 'const TEAMS' shared.js 2>/dev/null \
  && pass "shared.js sisältää 'const TEAMS'" \
  || fail "shared.js EI sisällä 'const TEAMS'"

grep -q 'const NATS' shared.js 2>/dev/null \
  && pass "shared.js sisältää 'const NATS'" \
  || fail "shared.js EI sisällä 'const NATS'"

grep -q 'const AWARDS' shared.js 2>/dev/null \
  && pass "shared.js sisältää 'const AWARDS'" \
  || fail "shared.js EI sisällä 'const AWARDS'"

grep -q 'const SPECIALS' shared.js 2>/dev/null \
  && pass "shared.js sisältää 'const SPECIALS'" \
  || fail "shared.js EI sisällä 'const SPECIALS'"

grep -q 'ICE_CONFIG' config.js 2>/dev/null \
  && pass "config.js sisältää 'ICE_CONFIG'" \
  || fail "config.js EI sisällä 'ICE_CONFIG'"

# ─── JS-tiedostojen syntaksivalidointi ────────────────────────
echo ""
echo "[Syntaksivalidointi]"
for f in shared.js config.js daily-game.js grid-game.js; do
  if [ -f "$f" ]; then
    RESULT=$(node -e "try { new Function(require('fs').readFileSync('$f','utf8')); console.log('OK'); } catch(e) { console.log('FAIL: ' + e.message); }" 2>&1)
    if [ "$RESULT" = "OK" ]; then
      pass "$f: syntaksi OK"
    else
      fail "$f: $RESULT"
    fi
  fi
done

# ─── Eriytetyt JS-tiedostot eivät sisällä duplikaatteja ──────
echo ""
echo "[Ei duplikaatteja eriytetyissä tiedostoissa]"

grep -q '^const TEAMS' grid-game.js 2>/dev/null \
  && fail "grid-game.js sisältää 'const TEAMS' (pitäisi tulla shared.js:stä)" \
  || pass "grid-game.js: ei 'const TEAMS' -duplikaattia"

grep -q '^const NATS' grid-game.js 2>/dev/null \
  && fail "grid-game.js sisältää 'const NATS' (pitäisi tulla shared.js:stä)" \
  || pass "grid-game.js: ei 'const NATS' -duplikaattia"

grep -q '^const ICE_CONFIG' grid-game.js 2>/dev/null \
  && fail "grid-game.js sisältää 'const ICE_CONFIG' (pitäisi tulla config.js:stä)" \
  || pass "grid-game.js: ei 'const ICE_CONFIG' -duplikaattia"

grep -q '^const TEAMS' daily-game.js 2>/dev/null \
  && fail "daily-game.js sisältää 'const TEAMS' (pitäisi tulla shared.js:stä)" \
  || pass "daily-game.js: ei 'const TEAMS' -duplikaattia"

# ─── Yhteenveto ───────────────────────────────────────────────
echo ""
echo "=== Yhteenveto ==="
echo "daily.html: $DAILY_LINES riviä | index.html: $INDEX_LINES riviä"
echo "daily-game.js: $DAILY_JS_LINES riviä | grid-game.js: $GRID_JS_LINES riviä"
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "Kaikki tarkistukset läpäisty ✓"
  exit 0
else
  echo "$FAIL_COUNT tarkistusta epäonnistui"
  exit 1
fi
