# Title
ADR-006: Claude Code toolbox and repo-local skills

# Status
Accepted

# Context
Sessions in this repository had no declared tooling. `AGENTS.md` is the single rule file for every agent, but it mixes invariants (scope, architecture) with procedures (which check proves which change, how to trace an issue, how to add an ADR). Procedures are only needed for some tasks and cost context in every session. The cross-repository decision is [ai-dev-tools ADR-018](https://github.com/koydas/ai-dev-tools/blob/main/docs/adr/ADR-018-consumer-repo-adoption.md).

# Decision
- `.claude/settings.json` enables the `ai-dev-tools` plugin.
- `AGENTS.md` stays the source of engineering rules; `CLAUDE.md` imports it (`@AGENTS.md`) and never restates it.
- Procedures live in `.claude/skills/`, loaded on demand: `validate-change` (diff area → local check → CI workflow), `github-artifacts` (issue traceability and templates), `new-adr`. They link to `AGENTS.md` instead of copying it; on conflict `AGENTS.md` wins.
- Cloud sessions get the commands from the environment setup script. Documented in `docs/claude-code.md`.

# Consequences
Benefits: same toolbox as the other repositories, procedures loaded only when the task matches, no second copy of the rules. Costs: skills can drift from `AGENTS.md` and from the workflows they name (`validate-change` maps CI workflows by hand), so a change to a workflow or to the validation policy updates the skill in the same PR.
