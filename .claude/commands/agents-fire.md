---
name: agents:fire
description: Deprecate an agent — flips the Notion row to Status=Deprecated, moves agents/<name>.md to agents/.deprecated/<name>.md, and surfaces any remaining [AGENT:] references in the tree. Confirmation required before any mutation. Stages the changes; does not commit.
---

# /agents:fire

Convene the `agent-lifecycle` meta-agent to deprecate an agent. The agent file is preserved (in `agents/.deprecated/`), the Notion row is preserved (flipped to `Deprecated`), and inbound references are surfaced for follow-up. Nothing is deleted — this is the first half of the elimination ritual (the second half is manual, after 90 days, per `/agents:review`).

## Usage

```
/agents:fire <name> --reason "<text>" [--replaced-by <other-agent>] [--keep-file] [--dry-run]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `<name>` | Yes | Active agent slug to deprecate. Must have a corresponding `agents/<name>.md` AND a Notion row. |
| `--reason "<text>"` | Yes | Human-readable reason for deprecation. Stored in the Notion `Deprecation reason` property. Required — anonymous firings rot the org chart. |
| `--replaced-by <other-agent>` | No | Slug of the agent that takes over this one's responsibilities. Sets the Notion `Replaced by` self-relation. Used by `/agents:combine`. |
| `--keep-file` | No | Leave `agents/<name>.md` in place (do not move to `.deprecated/`). Use when the file will be deleted in a follow-up commit, or when the agent is being temporarily disabled. |
| `--dry-run` | No | Show the planned mutations without applying them. |

## Behavior

1. **Find the Notion row** — `notion-search` the Agents database (data_source_id `13f4dfbb-5746-477e-b7b0-41215c07dc22`) for `Name = <name>`. If missing, fail with "not in Agents database — install `templates/hooks/agents-sync-to-notion.json` and re-save the file, or run `/notion:publish agent <name>` manually."
2. **Confirm the mutation** — show the planned changes (Notion property updates, file move, routing-file edits) and require an affirmative "yes" before proceeding. Always interactive, even without `--dry-run`.
3. **Update Notion** — set `Status=Deprecated`, `Deprecation reason="<text>"`. If `--replaced-by` was passed, resolve the replacement's Notion row ID and set the `Replaced by` self-relation.
4. **Move the file** — unless `--keep-file`, run `git mv agents/<name>.md agents/.deprecated/<name>.md`. Using `git mv` preserves file history. Create `agents/.deprecated/` if it doesn't exist.
5. **Update routing files**:
   - `CLAUDE.md` — remove the row from the agent family table; remove any routing rules that name `<name>`.
   - `agents/README.md` — remove from the family roster table.
6. **Run the reference linter** — `node scripts/lint-references.mjs --quiet --root .`. List every remaining `[AGENT: <name>]` reference in the output as a follow-up checklist. Do **not** block on these — fixing them is a per-case judgment call.
7. **Stage all changes** — `git add` the modified files and the moved file. Do not commit automatically.

## Confirmation requirement

Even with `--reason` provided, this command always prompts for explicit confirmation before any mutation. Firing an agent is a workforce decision, not a typo. The prompt shows:

- The Notion property changes (before → after)
- The file move (or skip, if `--keep-file`)
- The routing-file edits (file paths + line numbers)
- The replacement (if `--replaced-by`)

If the user does not respond with an affirmative, the command exits 0 with no mutations.

## Output Format

```
[AGENT: agent-lifecycle] [COMMAND: fire]
Agent:        <name>
Reason:       <text>
Replaced by:  <other-agent> | none

Pre-flight:
  ✓ Notion row found:    <URL>
  ✓ File found:          agents/<name>.md
  ✓ Replacement valid:   agents/<other-agent>.md (if --replaced-by)

Plan:
  Notion:
    Status:              Active → Deprecated
    Deprecation reason:  (empty) → "<text>"
    Replaced by:         (empty) → <other-agent>     (if --replaced-by)

  File:
    agents/<name>.md → agents/.deprecated/<name>.md  (or: kept in place, if --keep-file)

  Routing edits:
    CLAUDE.md:        remove row from <family> table (line <N>)
    CLAUDE.md:        remove routing rule (line <N>)
    agents/README.md: remove from <family> roster (line <N>)

Confirm? [y/N]

Result:
  ✓ Notion row updated:  <URL>
  ✓ File moved:          agents/.deprecated/<name>.md
  ✓ Routing files updated

Remaining references (NOT auto-fixed — review each):
  agents/<x>.md:42  [AGENT: <name>]  → consider rewriting to <other-agent>
  commands/<y>.md:18  [AGENT: <name>]  → consider rewriting to <other-agent>
  (or: none — all references resolved)

Staged:
  M  CLAUDE.md
  M  agents/README.md
  R  agents/<name>.md → agents/.deprecated/<name>.md

Next:
  - Resolve the remaining references above (or accept that they'll show as broken in lint-references)
  - Commit: git commit -m "agents: fire <name> — <reason summary>"
  - In 90 days, /agents:review will surface this for elimination if no refs and no usage
```

## Acceptance criteria

- [ ] Notion row flipped to `Status=Deprecated` with `Deprecation reason` set
- [ ] File moved to `agents/.deprecated/` (unless `--keep-file`) using `git mv` to preserve history
- [ ] `CLAUDE.md` and `agents/README.md` updated to remove the agent from rosters and routing rules
- [ ] Broken references surfaced — never auto-rewritten; per-case decisions
- [ ] Confirmation prompt required before any mutation, even with all flags pre-filled
- [ ] Idempotent on rerun — firing an already-deprecated agent is a no-op with a warning

## When Not to Use This

- The agent is just stale — use `/agents:train <name>` to surface gaps before firing.
- You're merging two agents into one — use `/agents:combine`, which calls this command internally with `--replaced-by` set.
- You want to delete the agent immediately — there's no `/agents:eliminate` command yet. Manual deletion is allowed only after 90 days, zero inbound refs, and zero usage (per `/agents:review`).

Source: PLAN.md Phase 8b · Owned by `[AGENT: agent-lifecycle]`
