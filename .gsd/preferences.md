---
version: 1
mode:
always_use_skills: []
prefer_skills: [frontend-design]
avoid_skills: []
skill_rules: []
custom_instructions:
  - "Projektin kieli on suomi (dokumentaatio, commit-viestit, UI-tekstit). Koodi ja muuttujanimet englanniksi."
  - "Single-file HTML -arkkitehtuuri. CSS pysyy HTML:n sisällä, JS eriytetään."
  - "Pelaajatietokannan periaatteet: append-only, lähdeseuranta, audit ennen julkaisua."
  - "Daily Grid seed (epoch 2026-03-15) ei saa muuttua — rikkoo pelaajien historian."
models: {}
skill_discovery:
skill_staleness_days:
auto_supervisor: {}
git:
  auto_push: false
  push_branches:
  remote:
  snapshots: true
  pre_merge_check:
  commit_type:
  main_branch: main
  merge_strategy:
  isolation:
  manage_gitignore: true
  worktree_post_create:
unique_milestone_ids: false
budget_ceiling:
budget_enforcement:
context_pause_threshold:
token_profile:
phases:
  skip_research: true
  skip_reassess: false
  reassess_after_slice: true
  skip_slice_research: true
dynamic_routing:
  enabled:
  tier_models: {}
  escalate_on_failure:
  budget_pressure:
  cross_provider:
  hooks:
auto_visualize:
auto_report:
parallel:
  enabled: false
  max_workers:
  budget_ceiling:
  merge_strategy:
  auto_merge:
verification_commands: []
verification_auto_fix:
verification_max_retries:
notifications:
  enabled:
  on_complete:
  on_error:
  on_budget:
  on_milestone:
  on_attention:
cmux:
  enabled:
  notifications:
  sidebar:
  splits:
  browser:
remote_questions:
  channel:
  channel_id:
  timeout_minutes:
  poll_interval_seconds:
uat_dispatch:
post_unit_hooks: []
pre_dispatch_hooks: []
---

# GSD Skill Preferences

- Prefer `frontend-design` skill for UI work
- Skip research phases — project already has comprehensive documentation (CLAUDE.md, PROJECT_PLAN.md, TIKI_TAKA_TOE_ANALYSIS.md)
