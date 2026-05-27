---
name: notion:audit
description: Walk the Notion workspace and surface health signals — ownerless pages, stale drafts, duplicates, broken `Source` URLs, schema drift, and permission risks. Run by the notion-governance agent. Read-only by default; archive proposals always require confirmation.
---

# /notion:audit

Convene the `notion-governance` agent to audit the Notion workspace for health and surface action items.

## Usage

```
/notion:audit [--parent <page-url-or-id>] [--scope <list>] [--auto-flag] [--propose-archives]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `--parent <page-url-or-id>` | No | Teamspace/page containing the canonical databases. Defaults to the parent recorded by the most recent `/notion:setup` run (per session). |
| `--scope <list>` | No | Comma-separated subset to audit. Default: all canonical databases. Valid: `sprints,prds,research,analytics,github-audits,quality-audits,game-design,runbooks,permissions,schema`. |
| `--auto-flag` | No | Post `notion-create-comment` calls to flag ownerless / stale pages. Without this flag, findings are reported but no comments are posted. |
| `--propose-archives` | No | After audit, present an archive proposal list per policy in `agents/notion-governance.md` → `/scaffold`. Archive only on user confirmation per item. |

**Examples:**

```
/notion:audit
/notion:audit --parent https://www.notion.so/acme/Stack-Agents-abc --scope prds,research
/notion:audit --auto-flag
/notion:audit --propose-archives
/notion:audit --scope permissions,schema
```

## What Happens

1. **Resolve the parent** — `notion-fetch` on the parent. Confirm databases exist (skip ones in scope that don't).
2. **Walk every row in scope** — for each database, paginated `notion-fetch` of rows. Pull properties only (no body) unless a finding requires opening the body.
3. **Apply governance signals** — ownership, freshness, duplicates, source integrity, schema drift, permissions, comment hygiene. (Full checklist in `agents/notion-governance.md` → `/audit`.)
4. **Build the health rollup** — per-database table with row counts, stale counts, ownerless counts, duplicates, health verdict.
5. **Conditional actions**:
   - If `--auto-flag`: post comments on flagged pages.
   - If `--propose-archives`: present per-item archive list with confirmation prompts.
   - Otherwise: report only.
6. **Hand off** — route schema-level fixes to `notion-architect`, publisher-level fixes to `notion-publisher`.

## Output Format

```
[AGENT: notion-governance] [COMMAND: audit]
Parent:  <page title> (<URL>)
Scope:   <databases audited>
Date:    <ISO timestamp>

### Critical
- [ ] <finding> — <database> — <row count or example URL>

### High
- [ ] ...

### Medium
- [ ] ...

### Low
- [ ] ...

---

## Per-database health

| Database     | Rows | Stale | Ownerless | Duplicates | Health |
|--------------|------|-------|-----------|------------|--------|
| Sprints      | 12   | 1     | 0         | 0          | Good   |
| PRDs         | 34   | 8     | 3         | 2          | At risk|
| Research     | ...  |       |           |            |        |

---

## Actions taken

- Comments posted:    N (only if --auto-flag)
- Archives proposed:  N (only if --propose-archives)
- Archives confirmed: N

→ HANDOFF TO [notion-architect]: <list of schema fixes needed>
→ HANDOFF TO [notion-publisher]: <list of publish bugs surfaced>
```

## Notes

- This command does not modify pages unless `--auto-flag` or `--propose-archives` is passed AND the user confirms each archive.
- Run weekly minimum on an active workspace. Less often invites drift.
- For a one-off targeted audit (e.g. "is this page stale?"), use `/notion:import <url>` then ask `notion-governance` directly.
