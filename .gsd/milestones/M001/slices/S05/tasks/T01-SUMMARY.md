---
id: T01
parent: S05
milestone: M001
provides:
  - steal-laskurin korjaus online-modessa (host päättelee steal-tilan solun omistajuudesta)
  - READY-handshake online-yhteyden muodostamiseen (korvaa 500ms setTimeout)
key_files:
  - grid-game.js
key_decisions:
  - Steal-tila päätellään host-puolella solun omistajuudesta eikä lähetetä erillisenä kenttänä viestissä — yksinkertaisempi ja yhteensopiva nykyisen MOVE-viestirakenteen kanssa
  - READY-handshake 15s fallback-timeoutilla — varmistaa pelin alkavan vaikka READY katoaisi
patterns_established:
  - "[PeerJS]"-prefixoidut konsolilokit kaikissa yhteysneuvotteluviesteissä
  - handleGuestMessage default-case logittaa tuntemattomat viestit varoituksella
observability_surfaces:
  - "[PeerJS] Host: guest READY received" — confirms handshake success
  - "[PeerJS] Host: guest READY not received in 15s" — fallback trigger visible
  - "[PeerJS] Unknown guest message type" — unknown message warning
duration: 20m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T01: Korjaa steal-bugi ja online-yhteyden timing-ongelma

**Korjattu online-pelin steal-laskurin bugi (host päättelee stealMode solun omistajuudesta) ja korvattu 500ms setTimeout READY-handshakella online-yhteyden muodostamisessa**

## What Happened

Two bugs fixed in grid-game.js:

**Steal bug:** When guest (P2) steals host's (P1) cell in online mode, the host had `G.stealMode = false` because only the guest's `clickCell` sets it. Added `G.stealMode = (G.cells[data.cell].owner !== 0 && G.cells[data.cell].owner !== 2)` in `handleGuestMessage` MOVE case before `validateAndApplyMove`. This infers steal state from cell ownership — if the cell belongs to P1 and guest plays it, it's a steal.

**Connection timing:** Replaced the blind `setTimeout(() => startOnlineRound(), 500)` in host's `onConnOpen` with a READY handshake. Guest now sends `{type:'READY'}` when its data channel opens. Host waits for this READY message before calling `startOnlineRound()`. A 15s fallback timeout ensures the game starts even if READY is lost.

Also standardized all PeerJS console logs to use `[PeerJS]` prefix and added a `default` case to `handleGuestMessage` that logs unknown message types.

## Verification

- `node -c grid-game.js` — syntax check passed
- `grep "G.stealMode" grid-game.js` — steal fix present at line 1339 in handleGuestMessage
- `grep "READY" grid-game.js` — handshake code present (host waits, guest sends)
- `grep "setTimeout.*startOnlineRound" grid-game.js` — old 500ms delay removed (no matches, exit code 1 as expected)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node -c grid-game.js` | 0 | ✅ pass | <1s |
| 2 | `grep -q "G.stealMode" grid-game.js` (in handleGuestMessage) | 0 | ✅ pass | <1s |
| 3 | `grep -q "READY" grid-game.js` | 0 | ✅ pass | <1s |
| 4 | `grep "setTimeout.*startOnlineRound" grid-game.js` | 1 | ✅ pass (no matches = old code removed) | <1s |

## Diagnostics

- Filter browser console with `[PeerJS]` to see all connection negotiation events
- `G.stealMode` observable in debugger during guest MOVE handling on host side
- If READY handshake fails, `[PeerJS] Host: guest READY not received in 15s, starting anyway` appears in console
- Unknown guest message types logged as `[PeerJS] Unknown guest message type: <type>`

## Deviations

- Added `[PeerJS]` prefix to all existing PeerJS log lines (not just new ones) for consistent observability — minor enhancement aligned with slice observability requirements
- Added `default` case to `handleGuestMessage` for unknown message types — defensive improvement not in original plan

## Known Issues

- Online-pelin testaus vaatii kahden selaimen testauksen (UAT S05:n lopussa)
- Offline steal-bugia ei ollut (clickCell asettaa G.stealMode oikein paikallisessa pelissä) — tämä taski korjasi vain online-version

## Files Created/Modified

- `grid-game.js` — steal-bugin korjaus handleGuestMessage MOVE-casessa, READY-handshake (host odottaa + guest lähettää), [PeerJS] log prefix kaikissa yhteyslogeissa, default-case tuntemattomille viesteille
