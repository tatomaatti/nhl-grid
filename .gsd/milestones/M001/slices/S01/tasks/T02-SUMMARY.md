---
id: T02
parent: S01
milestone: M001
provides:
  - Mobile-optimized daily.html with proper viewport, touch targets, overscroll prevention, and virtual keyboard handling
key_files:
  - daily.html
key_decisions:
  - visualViewport handler shifts guess-panel up with translateY instead of scrollIntoView for predictable behavior
  - Touch target minimum 44px enforced via min-height on guess-item, guess-search, hint-mode-banner button, and share-btn
  - 100svh with 100vh fallback (progressive enhancement, no @supports needed)
patterns_established:
  - "[MobileUX]" console.log prefix for mobile UX diagnostics — filter in DevTools
  - Global touch-action manipulation rule via compound selector for all interactive elements
observability_surfaces:
  - "console.log('[MobileUX]') in visualViewport resize handler — shows keyboard height and panel shift"
  - "bash scripts/verify-s01.sh — daily.html checks all pass"
duration: 8m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T02: Mobiili-UX-korjaukset daily.html

**Lisätty viewport interactive-widget, 100svh, overscroll-behavior, touch-action manipulation, 44px touch targets ja visualViewport-näppäimistökäsittely daily.html:ään.**

## What Happened

Five changes to daily.html per plan:

1. **Viewport meta**: Added `interactive-widget=overlays-content` to prevent virtual keyboard from pushing layout.
2. **Body CSS**: Added `min-height: 100svh` with `100vh` fallback for older browsers, and `overscroll-behavior: none` to prevent pull-to-refresh interference.
3. **Touch targets**: Added `min-height: 44px` to `.guess-item`, `.guess-search`, `.hint-mode-banner button`, and `.share-btn`. Added global `touch-action: manipulation` rule covering all buttons, inputs, onclick elements, guess items, headers, and hintable cells. Added `user-select: none` to `.daily-grid-wrap`.
4. **visualViewport API**: Added feature-detected resize handler that shifts `.guess-panel` up via `translateY` when virtual keyboard opens (threshold: 50px). Includes `[MobileUX]` diagnostic logging.
5. **Touch target verification**: Measured all interactive elements in mobile viewport — all ≥ 44px (guess items: 44px, search: 44px, headers: ~66px, player cells: ~66px).

## Verification

- `bash scripts/verify-s01.sh` — all 13 daily.html checks pass (5 mobile UX tokens + 1 touch target + 7 T01 checks). 6 index.html failures expected (T03).
- Browser verification: loaded daily.html on iPhone 15 emulation (393×659), opened guess panel, confirmed search input and guess items are properly sized.
- Computed style verification: `overscroll-behavior: none`, `touch-action: manipulation` on button/input/guess-item, `user-select: none` on grid wrap, `visualViewport` handler fires with `[MobileUX]` log.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-s01.sh` (daily.html checks) | 1 (expected — index.html T03) | ✅ pass (13/13 daily.html, 6 index.html deferred) | <1s |
| 2 | `grep "interactive-widget" daily.html` | 0 | ✅ pass | <1s |
| 3 | `grep "100svh" daily.html` | 0 | ✅ pass | <1s |
| 4 | `grep "overscroll-behavior" daily.html` | 0 | ✅ pass | <1s |
| 5 | `grep "touch-action" daily.html` | 0 | ✅ pass | <1s |
| 6 | `grep "visualViewport" daily.html` | 0 | ✅ pass | <1s |
| 7 | `grep "min-height: 44px" daily.html` | 0 | ✅ pass (4 occurrences) | <1s |
| 8 | Browser: iPhone 15 touch target heights | — | ✅ pass (all ≥ 44px) | — |
| 9 | Browser: `[MobileUX]` console log fires | — | ✅ pass | — |

## Diagnostics

- Open daily.html on mobile or DevTools mobile emulation → tap search input → Console shows `[MobileUX] keyboard height: Npx, panel open: true/false`.
- Run `bash scripts/verify-s01.sh` to see daily.html check status.
- Browser DevTools → Console filter `[MobileUX]` for keyboard/panel diagnostics.

## Deviations

None. `.hint-mode-banner button` padding changed from `4px 12px` to `10px 16px` as planned.

## Known Issues

None.

## Files Created/Modified

- `daily.html` — Added all mobile UX fixes: viewport meta, 100svh, overscroll-behavior, touch-action, min-height 44px touch targets, visualViewport keyboard handler, user-select none on grid wrap
- `.gsd/milestones/M001/slices/S01/tasks/T02-PLAN.md` — Added Observability Impact section per pre-flight requirement
