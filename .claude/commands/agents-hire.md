---
name: agents:hire
description: Create a new agent — generates agents/<name>.md from the standard template AND inserts a row in the Notion Agents database atomically. Fails on conflict with an existing agent file or Notion row. Stages the file change; does not commit.
---

# /agents:hire

Convene the `agent-lifecycle` meta-agent to onboard a new agent into the workforce. Atomic on both surfaces — the agent file and the Notion row are created together, or neither is.

## Usage

```
/agents:hire <name> --family <family> [--description "<text>"] [--owner <person>] [--dry-run]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `<name>` | Yes | Kebab-case agent slug (e.g. `payment-fraud`). Must not collide with an existing `agents/*.md` file or Notion `Name`. |
| `--family <family>` | Yes | One of: `Web Stack`, `Game Design`, `GitHub`, `Quality`, `Research`, `Product`, `Cross-cutting`, `Workspace`, `Meta`. Must match a `Family` option in the Agents database. |
| `--description "<text>"` | No | One-line description for routing. If omitted, the assembler prompts for it. Becomes the frontmatter `description:` and the Notion `Description` property. |
| `--owner <person>` | No | Notion user ID for the `Owner` person property. Defaults to the current MCP user. |
| `--dry-run` | No | Show the rendered file body + Notion payload that would be written. No writes. |

## Behavior

1. **Validate the name** — kebab-case (`^[a-z][a-z0-9-]*$`), not reserved, not already in `agents/*.md`, not already in `agents/.deprecated/*.md` (rehiring requires `/agents:train` instead).
2. **Validate the family** — must match one of the `Family` enum options defined by `notion-architect` in the Agents database schema. If the family doesn't exist, fail with a pointer to `/notion:setup`.
3. **Check for Notion conflict** — `notion-search` the Agents database (data_source_id `13f4dfbb-5746-477e-b7b0-41215c07dc22`) for `Name = <name>`. If found with `Status=Active`, fail. If found with `Status=Deprecated`, fail with "use `/agents:train <name>` to revive, or `/agents:combine` to merge."
4. **Insert the Notion row FIRST** — `Name`, `Family`, `Status=Active`, `Description`, `Source=https://github.com/kevinvwong/stack-agents/blob/main/agents/<name>.md`, `Hired=today`, `Owner`. Doing Notion first means a successful file write without a backing row is impossible.
5. **Render the agent file** — `templates/agent-template.md` with placeholders filled (`{{SLUG}}`, `{{FAMILY}}`, `{{DESCRIPTION}}`, `{{ISO_DATE}}`). Other placeholders (`{{OPINION_1}}`, etc.) are left for the user to fill in — the agent file is a draft on creation.
6. **Write the file** — `agents/<name>.md`. If this throws, roll back the Notion row by setting `Status=Deprecated` with `Deprecation reason="hire rollback: <error>"`.
7. **Run the reference linter** — `node scripts/lint-references.mjs --quiet --root .`. New agent is now in the valid set; existing references that previously pointed to a missing `<name>` (rare) now resolve.
8. **Stage for commit** — `git add agents/<name>.md`. Do not commit automatically.

## Atomicity contract

- If the Notion insert fails: no file is written. Command fails with the Notion error.
- If the file write fails: the Notion row is flipped to `Deprecated` with a rollback reason. The user is told to investigate the file-write failure and either retry or `/agents:fire <name> --reason "<text>"` to fully remove the rolled-back row.
- If the reference linter fails post-write (it should not): the file remains, the Notion row remains; the lint failure is surfaced for the user to investigate.

## Output Format

```
[AGENT: agent-lifecycle] [COMMAND: hire]
Agent:       <name>
Family:      <family>
Description: <text>

Pre-flight checks:
  ✓ Name is kebab-case and unused
  ✓ Family exists in Agents database schema
  ✓ No Notion conflict (no row with this Name)

Action: <create | dry-run>

Notion row:
  Name:        <name>
  Family:      <family>
  Status:      Active
  Hired:       <ISO date>
  Source:      https://github.com/kevinvwong/stack-agents/blob/main/agents/<name>.md
  Row URL:     <URL>

File written:
  agents/<name>.md  (<N> lines, from templates/agent-template.md)

Reference lint:
  ✓ <N> agents, <N> commands, all refs resolve

Staged:
  + agents/<name>.md

Next:
  - Fill in opinions, audit checklist, scaffold standards, handoffs in agents/<name>.md
  - Commit when ready: git commit -m "agents: hire <name>"
  - Add routing rules in CLAUDE.md and agents/README.md (or run /agents:review to surface the gap)
```

## Acceptance criteria

- [ ] Validates kebab-case naming and rejects conflicts (file or Notion row)
- [ ] Atomic across the two surfaces (file + Notion row) per the rollback contract above
- [ ] Renders the agent file from `templates/agent-template.md` with frontmatter populated
- [ ] Notion `Hired` date set to today; `Status` set to `Active`; `Source` URL points to the canonical GitHub path
- [ ] `--dry-run` shows the full plan without writing
- [ ] Does not commit; only stages

## When Not to Use This

- Reviving a deprecated agent — use `/agents:train <name>` (which can move a file out of `.deprecated/`) instead.
- Splitting one agent into two — there's no `/agents:split` yet; this is a `/agents:fire` of the old followed by two `/agents:hire` calls.
- Bulk import of an existing agent roster — use a one-off script; this command is for deliberate per-agent onboarding.

Source: PLAN.md Phase 8b · Owned by `[AGENT: agent-lifecycle]`
