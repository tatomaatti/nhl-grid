#!/bin/bash
# verify-s01-m002.sh — M002/S01 Firebase-siirtymän verifiointi

PASS=0
FAIL=0

check() {
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

echo "=== M002/S01 Verification: Firebase-siirtymä ==="
echo ""

echo "--- PeerJS poistettu ---"
check "grid-game.js: ei PeerJS-viittauksia" bash -c '! grep -q "PeerJS\|new Peer\|peerjs" grid-game.js'
check "grid-game.js: ei ICE_CONFIG" bash -c '! grep -q "ICE_CONFIG" grid-game.js'
check "grid-game.js: ei cleanupPeer" bash -c '! grep -q "cleanupPeer" grid-game.js'
check "grid-game.js: ei NET.peer" bash -c '! grep -q "NET\.peer" grid-game.js'
check "grid-game.js: ei NET.conn" bash -c '! grep -q "NET\.conn" grid-game.js'
check "index.html: ei PeerJS CDN" bash -c '! grep -q "peerjs" index.html'
check "config.js: ei ICE_CONFIG" bash -c '! grep -q "ICE_CONFIG\|iceServers\|ExpressTURN" config.js'
echo ""

echo "--- Firebase lisätty ---"
check "config.js: FIREBASE_CONFIG" grep -q "FIREBASE_CONFIG" config.js
check "config.js: databaseURL" grep -q "databaseURL" config.js
check "config.js: projectId hockeygrid" grep -q 'projectId.*hockeygrid' config.js
check "index.html: firebase-app-compat" grep -q "firebase-app-compat" index.html
check "index.html: firebase-database-compat" grep -q "firebase-database-compat" index.html
check "grid-game.js: firebase.initializeApp" grep -q "firebase.initializeApp" grid-game.js
check "grid-game.js: firebase.database" grep -q "firebase.database" grid-game.js
check "grid-game.js: firebaseDb.ref" grep -q "firebaseDb.ref" grid-game.js
check "grid-game.js: cleanupRoom" grep -q "cleanupRoom" grid-game.js
echo ""

echo "--- Firebase messaging ---"
check "grid-game.js: hostMsg channel" grep -q "hostMsg" grid-game.js
check "grid-game.js: guestAction channel" grep -q "guestAction" grid-game.js
check "grid-game.js: onDisconnect" grep -q "onDisconnect" grid-game.js
check "grid-game.js: listenForGuestActions" grep -q "listenForGuestActions" grid-game.js
check "grid-game.js: listenForHostMessages" grep -q "listenForHostMessages" grid-game.js
echo ""

echo "--- Security Rules ---"
check "database.rules.json olemassa" test -f database.rules.json
check "database.rules.json: rooms path" grep -q '"rooms"' database.rules.json
check "database.rules.json: validation rules" grep -q '\.validate' database.rules.json
echo ""

echo "--- Lokalisaatio päivitetty ---"
check "lang.js: room_full (fi)" grep -q "room_full" lang.js
echo ""

echo "--- Syntaksi ---"
check "grid-game.js: syntax OK" node -c grid-game.js
check "config.js: syntax OK" node -c config.js
check "lang.js: syntax OK" node -c lang.js
echo ""

echo "=== Results: $PASS/$((PASS + FAIL)) passed, $FAIL failed ==="
if [ $FAIL -gt 0 ]; then
  echo "❌ SOME CHECKS FAILED"
  exit 1
else
  echo "✅ ALL CHECKS PASSED"
  exit 0
fi
