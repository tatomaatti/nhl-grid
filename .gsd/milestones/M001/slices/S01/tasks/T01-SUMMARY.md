---
id: T01
parent: S01
milestone: M001
provides:
  - Clean .gitignore with project-specific exclusions
  - .player-cache removed from git tracking (6073 files)
  - nhl-grid.html replaced with redirect to index.html
  - scripts/verify-s01.sh for slice-level verification
key_files:
  - .gitignore
  - nhl-grid.html
  - scripts/verify-s01.sh
key_decisions:
  - nhl-grid.html redirect uses both meta refresh and JS fallback with noscript link
patterns_established:
  - Slice verification script pattern: PASS/FAIL per check, exit 1 on any failure, future checks can fail until their task lands
observability_surfaces:
  - "bash scripts/verify-s01.sh — reports PASS/FAIL per check with explanatory messages"
duration: 5m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T01: Repo-siistiminen: .gitignore, .player-cache ja nhl-grid.html redirect

**Päivitetty .gitignore, poistettu 6073 .player-cache-tiedostoa git-seurannasta, korvattu nhl-grid.html 14-rivinen redirectillä, ja luotu verify-s01.sh slicen tarkistusskripti.**

## What Happened

Four changes executed per plan:
1. Appended project-specific entries to .gitignore (`.player-cache/`, `players-raw.json`, `.gsd/runtime/`, `.gsd/activity/`, `.gsd/worktrees/`, `.gsd/gsd.db*`, `.gsd/auto.lock`, `.bg-shell/`).
2. Ran `git rm -r --cached .player-cache/` to untrack 6073 files without deleting them from disk.
3. Replaced the 2322-line nhl-grid.html duplicate with a 14-line redirect page using meta refresh, JS `location.replace`, and noscript fallback.
4. Created `scripts/verify-s01.sh` covering all S01 must-have checks. The 8 T01-specific checks pass; the 12 mobile UX checks correctly fail (waiting for T02/T03).

## Verification

All four task-level must-haves confirmed:
- `.gitignore` contains `.player-cache/`, `.gsd/runtime/`, `.gsd/activity/`, `.bg-shell/`
- `git ls-files .player-cache/ | wc -l` = 0
- `nhl-grid.html` is 14 lines, contains `url=index.html` and `location.replace`
- `scripts/verify-s01.sh` exists, is executable, runs successfully with expected output

Slice verification (`bash scripts/verify-s01.sh`) exits 1 with 12 failures — all are mobile UX checks deferred to T02/T03. T01-owned checks all pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q ".player-cache/" .gitignore` | 0 | ✅ pass | <1s |
| 2 | `test $(git ls-files .player-cache/ \| wc -l) -eq 0` | 0 | ✅ pass | <1s |
| 3 | `test $(wc -l < nhl-grid.html) -le 50 && grep -q "url=index.html" nhl-grid.html` | 0 | ✅ pass | <1s |
| 4 | `bash scripts/verify-s01.sh` (T01 checks) | 1 (expected) | ✅ pass (8/8 T01 checks, 12 mobile deferred) | <1s |

## Diagnostics

- Run `bash scripts/verify-s01.sh` to see current slice health — each check prints PASS/FAIL with explanation.
- `git ls-files .player-cache/` confirms tracking status.
- Open `nhl-grid.html` in browser to verify redirect behavior.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `.gitignore` — Added NHL Hockey Grid project-specific exclusions
- `nhl-grid.html` — Replaced 2322-line duplicate with 14-line redirect page
- `scripts/verify-s01.sh` — New slice verification script (20 checks total)
- `.gsd/milestones/M001/slices/S01/tasks/T01-PLAN.md` — Added Observability Impact section per pre-flight requirement
