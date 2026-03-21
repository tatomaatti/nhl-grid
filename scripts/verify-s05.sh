#!/usr/bin/env bash
# =====================================================================
# verify-s05.sh — S05 slice verification script
# Windows Git Bash compatible (no grep -P, handles \r\n)
# =====================================================================

set -e

PASS=0
FAIL=0
TOTAL=0

check() {
  TOTAL=$((TOTAL + 1))
  local desc="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    echo "  ✅ PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL: $desc"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== S05 Verification: Bugikorjaukset ja lokalisaatio ==="
echo ""

# ── 1. lang.js existence and content ────────────────────────────────
echo "--- lang.js ---"
check "lang.js exists" test -f lang.js
check "lang.js contains STRINGS.fi" grep -q "STRINGS" lang.js
check "lang.js contains fi dictionary" grep -q "fi:" lang.js
check "lang.js contains en dictionary" grep -q "en:" lang.js
check "lang.js contains t() function" grep -q "function t(" lang.js
check "lang.js contains getCurrentLang" grep -q "getCurrentLang" lang.js
check "lang.js contains applyLanguage" grep -q "applyLanguage" lang.js
check "lang.js contains langChanged event" grep -q "langChanged" lang.js
echo ""

# ── 2. Script tag order in HTML files ───────────────────────────────
echo "--- Script tags ---"
# daily.html: shared.js before lang.js before daily-game.js
check "daily.html loads lang.js" grep -q 'src="lang.js"' daily.html

# index.html: shared.js before lang.js before config.js
check "index.html loads lang.js" grep -q 'src="lang.js"' index.html

# Verify correct order: shared.js → lang.js in index.html
check "index.html: shared.js before lang.js" bash -c '
  shared_line=$(grep -n "shared.js" index.html | head -1 | cut -d: -f1)
  lang_line=$(grep -n "lang.js" index.html | head -1 | cut -d: -f1)
  [ "$shared_line" -lt "$lang_line" ]
'

# Verify correct order: lang.js → config.js in index.html
check "index.html: lang.js before config.js" bash -c '
  lang_line=$(grep -n "lang.js" index.html | head -1 | cut -d: -f1)
  config_line=$(grep -n "config.js" index.html | head -1 | cut -d: -f1)
  [ "$lang_line" -lt "$config_line" ]
'
echo ""

# ── 3. data-i18n attributes in HTML files ──────────────────────────
echo "--- data-i18n attributes ---"
check "daily.html has 10+ data-i18n elements" bash -c '
  count=$(grep -c "data-i18n" daily.html)
  [ "$count" -ge 10 ]
'
check "index.html has 10+ data-i18n elements" bash -c '
  count=$(grep -c "data-i18n" index.html)
  [ "$count" -ge 10 ]
'
echo ""

# ── 4. Bug fixes (T01) ─────────────────────────────────────────────
echo "--- Bug fixes ---"
check "grid-game.js contains READY handshake" grep -q "READY" grid-game.js
check "grid-game.js contains stealMode inference" grep -q "stealMode" grid-game.js
echo ""

# ── 5. No hardcoded Finnish strings in JS files ────────────────────
echo "--- Finnish string check ---"
# Check for Finnish-specific characters inside JS string literals (single/double/template)
# Exclude comments (lines starting with // or *)
# Allow: lang.js (contains the dictionaries), shared.js (contains Finnish names in data)
check "daily-game.js: no hardcoded Finnish strings" bash -c '
  result=$(grep -n "[äöÄÖ]" daily-game.js 2>/dev/null | grep -v "^[[:space:]]*//" | grep -v "^[[:space:]]*\*" | grep -v "❤" | grep -v "ℹ" | grep -v "🤝" || true)
  [ -z "$result" ]
'
check "grid-game.js: no hardcoded Finnish strings" bash -c '
  result=$(grep -n "[äöÄÖ]" grid-game.js 2>/dev/null | grep -v "^[[:space:]]*//" | grep -v "^[[:space:]]*\*" | grep -v "❤" | grep -v "ℹ" | grep -v "🤝" || true)
  [ -z "$result" ]
'
echo ""

# ── 6. JS syntax check ─────────────────────────────────────────────
echo "--- JS syntax ---"
check "lang.js parses" node -c lang.js
check "shared.js parses" node -c shared.js
check "daily-game.js parses" node -c daily-game.js
check "grid-game.js parses" node -c grid-game.js
echo ""

# ── 7. shared.js English fields ────────────────────────────────────
echo "--- shared.js localization ---"
check "shared.js contains name_en fields" grep -q "name_en" shared.js
check "shared.js contains catLang function" grep -q "catLang" shared.js
echo ""

# ── 8. Language switch button ──────────────────────────────────────
echo "--- Language switch ---"
check "daily.html has lang-switch button" grep -q "lang-switch" daily.html
check "index.html has lang-switch button" grep -q "lang-switch" index.html
echo ""

# ── 9. langChanged event listener in game files ────────────────────
echo "--- langChanged event ---"
check "daily-game.js listens for langChanged" grep -q "langChanged" daily-game.js
check "grid-game.js listens for langChanged" grep -q "langChanged" grid-game.js
echo ""

# ── Summary ─────────────────────────────────────────────────────────
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  echo "❌ SOME CHECKS FAILED"
  exit 1
else
  echo "✅ ALL CHECKS PASSED"
  exit 0
fi
