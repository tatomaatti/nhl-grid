---
id: T03
parent: S01
milestone: M001
provides:
  - Mobile-optimized index.html with proper viewport, touch targets, overscroll prevention, and virtual keyboard handling
key_files:
  - index.html
key_decisions:
  - visualViewport handler shifts both search-wrap and lobby-join-section with translateY, matching T02 pattern for daily.html
  - Touch target minimum 44px enforced via explicit width/height on steal-count and weight buttons, min-height on inputs, suggestions, hint-btn, surrender buttons, and lobby-back-btn
  - Global touch-action manipulation applied via compound selector covering all interactive elements
patterns_established:
  - "[MobileUX]" console.log prefix reused from T02 — consistent across both game files
  - translateY shift pattern for virtual keyboard avoidance — proportional to keyboard height with max cap
observability_surfaces:
  - "console.log('[MobileUX]') in visualViewport resize handler — shows keyboard height, open state, and active element context"
  - "bash scripts/verify-s01.sh — all 21 checks pass (exit 0)"
duration: 7m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T03: Mobiili-UX-korjaukset index.html

**Lisätty viewport interactive-widget, 100svh, overscroll-behavior, touch-action manipulation, 44px touch targets ja visualViewport-näppäimistökäsittely index.html:ään.**

## What Happened

Five changes to index.html matching the T02 pattern established for daily.html:

1. **Viewport meta**: Added `interactive-widget=overlays-content` to prevent virtual keyboard from pushing layout.
2. **Body CSS**: Added `min-height: 100svh` with `100vh` fallback, and `overscroll-behavior: none`.
3. **Touch targets**: Fixed undersized elements:
   - `.steal-count-btns button`: 36×36 → 44×44px
   - `.weight-btns button`: 30×30 → 44×44px
   - `.search-input`: added min-height 44px
   - `.lobby-join-input`: added min-height 44px
   - `.sug-item`: added min-height 44px
   - `.hint-btn`: added min-height 44px
   - `.surrender-actions button`: added min-height 44px
   - `.lobby-back-btn`: added min-height 44px
   - Global `touch-action: manipulation` rule for all interactive elements.
4. **visualViewport API**: Added feature-detected resize handler that shifts `.search-wrap` and `#lobby-join-section` via translateY when keyboard opens. Includes `[MobileUX]` diagnostic logging with context (which element is focused).
5. **Verification**: All 21 checks in verify-s01.sh pass — this covers all T01, T02, and T03 requirements.

## Verification

- `bash scripts/verify-s01.sh` — all 21 checks pass, exit code 0
- Browser verification: loaded index.html on mobile viewport (390×844), confirmed computed styles for all key elements
- Computed style checks: steal buttons 44×44, weight buttons 44×44, search/lobby inputs min-height 44px, hint-btn/surrender/lobby-back min-height 44px, body overscroll-behavior none, touch-action manipulation on buttons, viewport meta correct

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-s01.sh` | 0 | ✅ pass (21/21 checks) | <1s |
| 2 | `grep "interactive-widget" index.html` | 0 | ✅ pass | <1s |
| 3 | `grep "100svh" index.html` | 0 | ✅ pass | <1s |
| 4 | `grep "overscroll-behavior" index.html` | 0 | ✅ pass | <1s |
| 5 | `grep "touch-action" index.html` | 0 | ✅ pass | <1s |
| 6 | `grep "visualViewport" index.html` | 0 | ✅ pass | <1s |
| 7 | Browser: computed steal-btn width/height = 44px | — | ✅ pass | — |
| 8 | Browser: computed weight-btn width/height = 44px | — | ✅ pass | — |
| 9 | Browser: computed body overscroll-behavior = none | — | ✅ pass | — |
| 10 | Browser: computed button touch-action = manipulation | — | ✅ pass | — |
| 11 | Browser: viewport meta content includes interactive-widget | — | ✅ pass | — |

## Diagnostics

- Open index.html on mobile or DevTools mobile emulation → tap search input → Console shows `[MobileUX] keyboard height: Npx, open: true/false, context: search-input`.
- Run `bash scripts/verify-s01.sh` to see full slice health — all 21 checks should pass.
- Browser DevTools → Console filter `[MobileUX]` for keyboard/panel diagnostics.

## Deviations

Additional touch target fixes beyond plan: added min-height 44px to `.hint-btn`, `.surrender-actions button`, and `.lobby-back-btn` — these were undersized (26px, ~34px, ~30px respectively) and would have failed the "all interactive elements ≥ 44px" must-have.

## Known Issues

None.

## Files Created/Modified

- `index.html` — Added all mobile UX fixes: viewport meta, 100svh, overscroll-behavior, touch-action manipulation, 44px touch targets (steal/weight/search/lobby/sug-item/hint/surrender/back), visualViewport keyboard handler
- `.gsd/milestones/M001/slices/S01/tasks/T03-PLAN.md` — Added Observability Impact section per pre-flight requirement
