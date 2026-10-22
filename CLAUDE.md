# CLAUDE.md — fullstack-pilot

Polyglot multi-service repo (React client, Node/Python/.NET services, Docker/GitOps).

Engineering rules are in `AGENTS.md` (single source for every agent); imported, never restated:

@AGENTS.md

Procedures in `.claude/skills/`: `validate-change`, `github-artifacts`, `new-adr`.

## Toolbox — koydas/ai-dev-tools

`.claude/settings.json` declares the `ai-dev-tools` plugin (trust the folder → install offered): `/ai-dev-tools:pr-review <n>`, `/ai-dev-tools:pr-fixer`, `/ai-dev-tools:issue-code-generation <n>`, `/ai-dev-tools:ac-check <n>`. Repo rules (this file, `.claude/skills/`) win over toolbox defaults.

Cloud sessions (claude.ai/code) do not install repository-declared plugins: environment setup script in the ai-dev-tools README → "Use from another repository". Commands are then un-prefixed (`/pr-review`). Details: [`docs/claude-code.md`](docs/claude-code.md).
