---
name: github-artifacts
description: Issue traceability and templates for fullstack-pilot — find or create the issue before any code change, then fill issue/PR templates completely. Use before starting a code change and before opening an issue or PR.
---

1. **Traceability**: before any change to code or infra, search open issues (`gh issue list --search "<keywords>" --state open`; in cloud sessions `gh` is unauthenticated → GitHub MCP `search_issues`). Relevant issue → reference it in commits and PR. None → create it first.
2. **Templates**: read `.github/ISSUE_TEMPLATE/` (`bug_report.yml` for defects, `new_feature.yml` otherwise) and `.github/pull_request_template.md` before writing the body. Fill every required field; no placeholders.
3. **PR checklist** (from the template): CI green, `README.md` updated if behavior changed, ADR if an architectural decision was made, new service registered in `discover-services.js` with smoke tests.
4. Docs in English.
