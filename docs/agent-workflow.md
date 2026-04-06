# Agent Workflow: Issue → Code → PR

## Inputs
- `issueId` (required): numeric or string issue identifier.
- `issue` (required): issue text/body.
- Environment for local OpenAI-compatible API:
  - `OPENAI_BASE_URL`
  - `OPENAI_MODEL`
  - `OPENAI_API_KEY` (optional for local providers like Ollama; default fallback is used)

## Pipeline (deterministic)
1. **Read Issue**
   - Validate required inputs.
   - Abort if missing.
2. **Planner call**
   - Generate plan JSON.
   - Abort if JSON invalid.
3. **Context selection**
   - Load only `README.md` + files listed in `impacted_files`.
   - Never read full repository content.
4. **Implementer call**
   - Generate diff package JSON.
   - Abort if JSON invalid.
5. **Reviewer call**
   - Return `ok | needs_fix | unsafe`.
6. **Retry logic**
   - If `needs_fix`: call implementer once with reviewer feedback, then re-review.
   - If second review is not `ok`: abort.
   - If `unsafe`: abort immediately.
7. **Apply changes**
   - Prefer `diff` via `git apply --check` then `git apply`.
   - If diff fails and `full_content` exists: write content safely.
   - If both fail: abort.
8. **Validation before commit**
   - Ensure target files exist per action.
   - Ensure no empty critical files.
   - Run `git diff --check` and lightweight syntax checks (for changed JS).
   - On any failure: abort.
9. **Git operations**
   - Create/switch branch: `ai/issue-{id}`.
   - Stage all intended changes.
   - Single commit only.
   - Push branch (no force push).
10. **Open PR**
   - Create PR from pushed branch with commit-aligned title/body.

## Failure cases and safe abort conditions
- Planner/Implementer/Reviewer emits invalid JSON.
- Reviewer status `unsafe`.
- Diff cannot be applied and no safe fallback available.
- Validation fails.
- Git branch/commit/push/PR step fails.

In all failure modes: stop execution without partial commit state.
