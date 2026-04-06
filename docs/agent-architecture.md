# Agent Architecture: Issue → Code → PR

## Roles

### 1) Planner
**Input:** raw issue text (+ optional metadata such as issue id/title/labels).  
**Output contract:**

```json
{
  "goal": "...",
  "steps": [],
  "impacted_files": [],
  "assumptions": []
}
```

**Responsibility**
- Produce a deterministic, explicit plan.
- Restrict scope to the smallest required file set.
- State assumptions to make risk visible.

### 2) Implementer
**Input:** plan JSON + selected file context only.  
**Output contract:**

```json
{
  "changes": [
    {
      "file": "path/to/file",
      "action": "create|modify|delete",
      "diff": "UNIFIED DIFF ONLY",
      "full_content": "REQUIRED only for create or if diff is ambiguous"
    }
  ],
  "commit_message": "...",
  "risk_level": "low|medium|high"
}
```

**Responsibility**
- Prefer valid unified diffs.
- Keep edits minimal and localized.
- Provide `full_content` fallback only when needed.

### 3) Reviewer
**Input:** implementer output (diff package).  
**Output contract:**

```json
{
  "status": "ok|needs_fix|unsafe",
  "issues": [],
  "suggestions": []
}
```

**Responsibility**
- Detect unsafe or unrelated edits.
- Enforce contract and scope.
- Gate commit on safety.

## Boundaries
- Planner cannot apply code.
- Implementer cannot bypass reviewer gate.
- Reviewer cannot edit code; it can only approve/reject with feedback.

## Safety mechanisms
- Strict JSON parsing at every role boundary (fail-fast).
- Diff-first application (`git apply --check` before `git apply`).
- Fallback to `full_content` only when diff cannot be safely applied.
- Pre-commit validation: file existence, non-empty critical files, lightweight syntax sanity.
- Abort states: invalid JSON, invalid diff, reviewer `unsafe`, validation failure.

## Determinism controls
- Fixed role order: Planner → Implementer → Reviewer.
- Single retry only when reviewer returns `needs_fix`.
- Single commit per run on branch `ai/issue-{id}`.
- No force-push.
