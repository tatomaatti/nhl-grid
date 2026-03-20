#!/usr/bin/env bash
# verify-s01.sh — S01 slice verification: mobile UX + duplicate removal
# Jokainen tarkistus tulostaa PASS/FAIL + selityksen.
# Exitkoodi 0 vain jos kaikki passaavat.

set -u
FAIL_COUNT=0

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

echo "=== S01 Verification ==="
echo ""

# ─── .gitignore ───────────────────────────────────────────────
echo "[.gitignore]"
for pattern in ".player-cache/" ".gsd/runtime/" ".gsd/activity/" ".bg-shell/"; do
  grep -qF "$pattern" .gitignore 2>/dev/null \
    && pass ".gitignore sisältää '$pattern'" \
    || fail ".gitignore EI sisällä '$pattern'"
done

# ─── .player-cache ei git-seurannassa ─────────────────────────
echo ""
echo "[.player-cache tracking]"
TRACKED=$(git ls-files .player-cache/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$TRACKED" -eq 0 ]; then
  pass ".player-cache: 0 tiedostoa git-seurannassa"
else
  fail ".player-cache: $TRACKED tiedostoa edelleen git-seurannassa (odotettu: 0)"
fi

# ─── nhl-grid.html redirect ──────────────────────────────────
echo ""
echo "[nhl-grid.html redirect]"
if [ ! -f nhl-grid.html ]; then
  fail "nhl-grid.html ei löydy"
else
  LINE_COUNT=$(wc -l < nhl-grid.html | tr -d ' ')
  if [ "$LINE_COUNT" -le 50 ]; then
    pass "nhl-grid.html on $LINE_COUNT riviä (≤50)"
  else
    fail "nhl-grid.html on $LINE_COUNT riviä (odotettu: ≤50)"
  fi

  grep -q 'url=index.html' nhl-grid.html 2>/dev/null \
    && pass "nhl-grid.html sisältää meta refresh → index.html" \
    || fail "nhl-grid.html EI sisällä 'url=index.html'"

  grep -q 'location.replace' nhl-grid.html 2>/dev/null \
    && pass "nhl-grid.html sisältää JS redirect" \
    || fail "nhl-grid.html EI sisällä JS redirectiä"
fi

# ─── daily.html mobile-korjaukset ─────────────────────────────
echo ""
echo "[daily.html mobile UX]"
if [ ! -f daily.html ]; then
  fail "daily.html ei löydy"
else
  for token in "interactive-widget" "100svh" "touch-action" "overscroll-behavior" "visualViewport"; do
    grep -q "$token" daily.html 2>/dev/null \
      && pass "daily.html sisältää '$token'" \
      || fail "daily.html EI sisällä '$token' — lisätään T02:ssa"
  done
fi

# ─── index.html mobile-korjaukset ─────────────────────────────
echo ""
echo "[index.html mobile UX]"
if [ ! -f index.html ]; then
  fail "index.html ei löydy"
else
  for token in "interactive-widget" "100svh" "touch-action" "overscroll-behavior" "visualViewport"; do
    grep -q "$token" index.html 2>/dev/null \
      && pass "index.html sisältää '$token'" \
      || fail "index.html EI sisällä '$token' — lisätään T03:ssa"
  done
fi

# ─── Touch target minimum 44px (grep-heuristiikka) ───────────
echo ""
echo "[Touch targets ≥ 44px]"
# Tarkistaa onko tiedostoissa min-height/min-width: 44px -tyyppisiä sääntöjä.
# Tämä on heuristinen — lopullinen validointi tehdään selaimessa.
for file in daily.html index.html; do
  if [ -f "$file" ]; then
    if grep -qE '(min-height|min-width)\s*:\s*44px' "$file" 2>/dev/null; then
      pass "$file sisältää 44px touch target -sääntöjä"
    else
      fail "$file EI sisällä 44px touch target -sääntöjä — lisätään T02/T03:ssa"
    fi
  fi
done

# ─── Yhteenveto ───────────────────────────────────────────────
echo ""
echo "=== Yhteenveto ==="
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "Kaikki tarkistukset läpäisty ✓"
  exit 0
else
  echo "$FAIL_COUNT tarkistusta epäonnistui"
  exit 1
fi
