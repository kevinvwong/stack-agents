---
name: review:code
description: General-purpose code quality reviewer. Reviews a file, directory, or diff for readability, complexity, naming, duplication, test coverage gaps, dead code, and logic correctness. Not a security or architecture audit. Works on any language or framework.
---

# /review:code [file or dir]

Review code for quality — readability, complexity, naming, duplication, test coverage gaps, dead code, and logic correctness. Not a security or architecture audit.

## Usage

```
/review:code [file or dir]          # review a specific file or directory
/review:code --diff                 # review the current git diff
/review:code --effort low|medium|high
```

Examples:
```
/review:code src/components/Auth.tsx
/review:code dashboard/src/
/review:code --diff
/review:code src/lib/utils.ts --effort high
/review:code --diff --effort low
```

**Effort flag** controls coverage breadth:
- `low` — fewer findings, high-confidence only. Use for quick sanity checks or review fatigue situations.
- `medium` (default) — balanced. Flags clear problems and meaningful best-practice gaps.
- `high` — broadest coverage. Includes uncertain findings, style concerns, and speculative improvements. May produce false positives.

## Execution

```
[AGENT: code-reviewer] [COMMAND: review]
```

The agent reads the target file, directory, or diff and applies the following checklist:

**Readability**
- Deeply nested logic that should be extracted or inverted
- Long functions that do more than one thing
- Variable and function names that don't communicate intent
- Misleading comments (comments that contradict the code)

**Complexity**
- Cyclomatic complexity hot spots
- Unnecessary abstraction or over-engineering
- Duplicated logic that should be extracted

**Correctness**
- Off-by-one errors, null/undefined dereferences, unhandled promise rejections
- Incorrect assumptions about async execution order
- Logic branches that can never be reached (or always are)

**Test Coverage Gaps**
- Happy-path-only coverage (no error cases tested)
- Functions with side effects that have no test
- Untested branches visible from the code

**Dead Code**
- Exported functions/types that are never imported
- Feature flags that are always-on or always-off
- Commented-out code blocks

## Output Format

```
[AGENT: code-reviewer] [COMMAND: review]
Target: <file, directory, or diff>
Effort: <low | medium | high>

### [C]ritical
- [ ] **[Finding title]** — [file:line]
  Issue: [what is wrong and why it matters]
  Fix: [specific, actionable remediation]

### [H]igh
- [ ] ...

### [M]edium
- [ ] ...

### [L]ow
- [ ] ...

Summary: X critical, Y high, Z medium, W low
Verdict: [one sentence — overall quality signal and the single most important action]
```

Severity tags:
| Tag | Definition |
|-----|-----------|
| **[C]ritical** | Logic error, data corruption risk, or production-breaking defect |
| **[H]igh** | Significant complexity, reliability risk, or test gap that will cause pain |
| **[M]edium** | Best-practice violation with meaningful future cost |
| **[L]ow** | Style, naming, minor duplication, or dead code |

## Review Standards

- **Be specific**: cite file paths and line numbers. "The handler" is not actionable; `src/api/users.ts:42` is.
- **Be honest**: if you cannot determine severity without running the code, say so. Do not pad with low findings to appear thorough.
- **Be actionable**: every finding has a fix. "Consider refactoring" is not a fix. "Extract lines 34–67 into `validateUserInput(payload: UserPayload): ValidationResult`" is.
- **Respect effort level**: at `low` effort, only file findings you are confident about. At `high` effort, flag uncertain ones but mark them explicitly as uncertain.
- **This is not a security audit**: do not file auth, CSRF, injection, or secret-exposure findings here — route those to `/security:baseline` or `/panel:security`.
- **This is not an architecture audit**: do not file dependency graph, database schema, or infrastructure findings here — route those to `/review:data-model` or `/stack:audit`.
