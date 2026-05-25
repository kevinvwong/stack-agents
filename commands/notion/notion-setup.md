---
name: notion:setup
description: Bootstrap the canonical Notion workspace layout for stack-agents — creates the Sprints, PRDs, Research, Analytics specs, GitHub audits, Quality audits, Game design docs databases and their default views. Non-destructive — skips databases that already exist (matched by title within the target parent).
---

# /notion:setup

Convene the `notion-architect` agent to scaffold the canonical workspace layout into a Notion teamspace or page.

## Usage

```
/notion:setup --parent <page-url-or-id> [--databases <list>] [--dry-run] [--force]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `--parent <page-url-or-id>` | Yes | Notion page or teamspace where the databases will be created. Either a Notion URL or a page ID. |
| `--databases <list>` | No | Comma-separated subset to create. Default: all canonical databases. Valid values: `sprints,prds,research,analytics,github-audits,quality-audits,game-design,runbooks` |
| `--dry-run` | No | Resolve the parent, list which databases would be created vs. skipped, and exit without writing. |
| `--force` | No | If a database with the canonical title already exists under the parent, overwrite its schema (additive — never deletes existing properties). |

**Examples:**

```
/notion:setup --parent https://www.notion.so/acme/Stack-Agents-abc123
/notion:setup --parent abc123def456 --databases sprints,prds --dry-run
/notion:setup --parent https://www.notion.so/acme/Engineering-xyz --databases github-audits,quality-audits
```

## What Happens

The `notion-architect` agent runs the workspace scaffold in 5 steps:

1. **Resolve the parent** — `notion-fetch` on the URL/ID. Confirm it's a page or teamspace and the MCP integration has write access. If not, stop and report.
2. **Inventory existing databases** — `notion-search` for each canonical title under the parent. Build a `{ create | skip | update }` plan.
3. **Confirm the plan with the user** — show the plan; require confirmation unless `--dry-run`.
4. **Create databases + default views** — for each database in the plan, call `notion-create-database` with the canonical property schema from `agents/notion-architect.md` → `/scaffold`, then `notion-create-view` for each default view.
5. **Verify** — `notion-fetch` each created database, confirm the title, property set, and at least one view exist. Report database IDs + URLs.

## Canonical Databases

The scaffold writes the following from `agents/notion.md`:

| Title | Purpose | Linked to |
|-------|---------|-----------|
| Sprints | Every assembled sprint | `sprint-assembler`, `/sprint:assemble`, `/sprint:status` |
| PRDs | Product requirement docs | `product` agent |
| Research | User research findings | `user-research`, `usability-testing`, `focus-group`, `expert-review` |
| Analytics specs | Event schemas + A/B tests | `analytics` agent |
| GitHub audits | Panel + per-agent audit results | `/panel:github`, `gh-*` agents |
| Quality audits | QA + a11y + perf audits | `/panel:quality`, `web-qa`, `accessibility`, `performance` |
| Game design docs | Game panel outputs | `/panel:game`, `game-*` agents |
| Runbooks | Operational docs, ADRs (page, not database) | All agents |

Each database is created with: `Source` (url), `Status` (status), `Owner` (person), and at least one filtered view. Full schemas live in `agents/notion-architect.md`.

## Output Format

```
[AGENT: notion-architect] [COMMAND: scaffold]
Setup: workspace bootstrap
Parent: <page title> (<URL>)

Plan:
  ✓ create  Sprints
  ✓ create  PRDs
  ⊘ skip    Research          (already exists — pass --force to update schema)
  ✓ create  Analytics specs
  ...

Proceeding (or DRY RUN — no writes).

Created:
  - Sprints              <database URL>  (id: <id>)
  - PRDs                 <database URL>  (id: <id>)
  - Analytics specs      <database URL>  (id: <id>)
  ...

Skipped:
  - Research             <database URL>

Verification: all created databases fetched and confirmed.

Next:
  - /notion:publish sprint <slug>           — publish an existing sprint
  - /notion:publish prd <feature>           — publish a PRD
  - /notion:audit                           — audit the workspace
```

## Notes

- This command does not create the teamspace itself — create that in Notion first, then pass it as `--parent`.
- Database IDs are recorded in the agent's response so other publish commands can reuse them. There is no global config file — `/notion:publish` resolves databases by title every run, so renaming a database breaks publishing until the new title is used.
- `--force` only adds missing properties; it never deletes existing properties or rows. To remove a property, do it in Notion's UI.
