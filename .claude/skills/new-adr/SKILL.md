---
name: new-adr
description: Procedure for adding an ADR to fullstack-pilot — numbering, index update in docs/adr/README.md, and the architecture docs to cross-check.
---

1. Read `docs/adr/README.md` (index) and the ADRs bounding the area: `ADR-001` persistence, `ADR-002` service boundaries, `ADR-003` GitOps, `ADR-004` dependency versions, `ADR-005` DB major upgrades.
2. New file `docs/adr/ADR-NNN-short-title.md`, NNN = next number; mirror the structure of the latest existing ADR rather than inventing one.
3. Add the entry to `docs/adr/README.md`.
4. A decision that reverses an existing ADR supersedes it explicitly instead of silently diverging.
5. Cross-check `docs/ARCHITECTURE.md`; reference the ADR in the PR (template checkbox).
