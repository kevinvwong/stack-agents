---
name: notion:bootstrap
description: One-shot Notion integration setup for a repo — resolves (or creates) the parent page, runs /notion:setup to scaffold canonical databases, and writes .notion/config.json so future /notion:publish / /notion:audit calls don't need to be told the parent or resolve databases by title every run. Idempotent — re-running updates the config without recreating databases.
---

# /notion:bootstrap

Convene the `notion-architect` agent to do the full first-time wire-up of Notion into a repository: parent page resolution, canonical database scaffolding, and persistent config in `.notion/config.json`.

## Usage

```
/notion:bootstrap --parent <page-url-or-id> [--target <repo-path>] [--databases <list>] [--dry-run] [--force]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `--parent <page-url-or-id>` | Yes | Notion page (or teamspace) the integration has write access to. |
| `--target <repo-path>` | No | Repo root where `.notion/config.json` is written. Defaults to the current working directory. |
| `--databases <list>` | No | Subset to create (`sprints,prds,research,analytics,github-audits,quality-audits,game-design,runbooks`). Default: all. |
| `--dry-run` | No | Resolve parent, build plan, show the config that *would* be written. No Notion writes, no file writes. |
| `--force` | No | Overwrite an existing `.notion/config.json` (preserving any extra keys the user added). Without this flag, an existing config is read and merged into the plan. |

**Examples:**

```
/notion:bootstrap --parent https://www.notion.so/acme/Stack-Agents-abc
/notion:bootstrap --parent abc123 --target ../my-app
/notion:bootstrap --parent https://www.notion.so/acme/Stack-Agents-abc --dry-run
/notion:bootstrap --parent https://www.notion.so/acme/Stack-Agents-abc --databases sprints,prds
```

## What Happens

1. **Resolve the parent** — `notion-fetch` on the URL/ID. Confirm it's a page or teamspace and the MCP integration has write access. **Show the ancestor path** (Workspace → Team → Page) to the user and require confirmation before any writes — guards against writing into the wrong workspace.
2. **Inventory existing databases** — `notion-search` for each canonical title under the parent. Build a `{ create | skip | update }` plan.
3. **Read existing config** — if `<target>/.notion/config.json` exists, merge its database IDs into the plan; skip recreation for any database whose ID is already mapped and verified by `notion-fetch`.
4. **Confirm the plan with the user** — show the plan (parent path + databases to create vs skip + config destination); require confirmation unless `--dry-run`.
5. **Create databases + default views** — same flow as `/notion:setup`. Each new database is verified by `notion-fetch` before its ID is recorded.
6. **Write `.notion/config.json`** — see schema below. Created with `0644` permissions; never includes any secrets.
7. **Report** — config path + database URLs + next commands.

## `.notion/config.json` Schema

```json
{
  "$schema": "https://raw.githubusercontent.com/kevinvwong/stack-agents/main/templates/notion-config.schema.json",
  "version": 1,
  "parent": {
    "id": "36dc266f-7d7c-8008-94e1-e29de65fa9b7",
    "url": "https://www.notion.so/36dc266f7d7c800894e1e29de65fa9b7",
    "title": "Claude Code",
    "ancestor_path": "Workspace > Engineering > Claude Code"
  },
  "databases": {
    "sprints":         { "id": "98f9b840-ed8e-4157-b593-b68387cc16b2", "data_source_id": "16770389-a353-417b-b288-8d85adcf989d", "url": "https://www.notion.so/98f9b840ed8e4157b593b68387cc16b2" },
    "prds":            { "id": "9586e5bd-bdeb-4b43-93f8-f2717989bae1", "data_source_id": "a9bf2fc6-4a6c-4777-8eeb-fd0c6de70eee", "url": "https://www.notion.so/9586e5bdbdeb4b4393f8f2717989bae1" },
    "research":        { "id": "c5b57f0b-528d-4c92-ad63-b202202a88a8", "data_source_id": "45505411-ec40-4ba3-bfa5-efdc558989ad", "url": "https://www.notion.so/c5b57f0b528d4c92ad63b202202a88a8" },
    "analytics":       { "id": "064c98b2-1113-4c2b-9f44-7f5d4e648d27", "data_source_id": "d5c24361-81ec-4e2a-99a1-2cd6b92616a0", "url": "https://www.notion.so/064c98b211134c2b9f447f5d4e648d27" },
    "github-audits":   { "id": "cd51f592-c1f4-4d4a-9c46-b499aeff665a", "data_source_id": "dd85a2db-bec2-4d71-9e65-1339e49d943f", "url": "https://www.notion.so/cd51f592c1f44d4a9c46b499aeff665a" },
    "quality-audits":  { "id": "c73197a3-04a4-4dca-b857-7f96caae5091", "data_source_id": "6fd8f530-fae4-4542-acde-e72f21f5bd7b", "url": "https://www.notion.so/c73197a304a44dcab8577f96caae5091" },
    "game-design":     { "id": "9b50ec47-c2ab-4209-bc92-e6f10ae25478", "data_source_id": "2225b62b-8266-4741-bf37-1fe2dd1f9c9e", "url": "https://www.notion.so/9b50ec47c2ab4209bc92e6f10ae25478" },
    "runbooks":        { "id": "36dc266f-7d7c-8155-9810-d27c7075bffb",                                                      "url": "https://www.notion.so/36dc266f7d7c81559810d27c7075bffb" }
  },
  "schema_version": 1,
  "created": "2026-05-27T00:42:17Z",
  "last_verified": "2026-05-27T00:42:17Z"
}
```

**Field notes:**
- `version` — config schema version (this file). Bump when the *config* shape changes.
- `schema_version` — the canonical-database schema version from `notion-architect.md`. Used by `/notion:audit` to detect drift between the workspace and the architect's current spec.
- `last_verified` — timestamp of the most recent successful `notion-fetch` of each database. Refreshed by `/notion:audit`.
- `runbooks` is a page, not a database, so no `data_source_id`.

## What This Replaces

Before `/notion:bootstrap`:

```
1. User runs `/notion:setup --parent <url>`              (5 steps in chat)
2. Every later `/notion:publish` re-resolves DB by title via notion-search
3. Every later `/notion:audit` has to be re-told the parent
4. Rename a database in Notion → all later publishes silently fail
```

After `/notion:bootstrap`:

```
1. User runs `/notion:bootstrap --parent <url>` once
2. `.notion/config.json` committed to repo
3. Every later `/notion:publish` reads config — one round trip, not many
4. Rename in Notion → /notion:audit reports drift, suggests fix
```

## Output Format

```
[AGENT: notion-architect] [COMMAND: scaffold]
Bootstrap: workspace setup + config

Parent
  Title:  <page title>
  URL:    <URL>
  Path:   <workspace> > <team> > <page>
  ⚠  Confirm this is the correct location before proceeding.

Plan
  ✓ create  Sprints
  ✓ create  PRDs
  ⊘ skip    Research          (id already in .notion/config.json; verified)
  ✓ create  Analytics specs
  ...

Proceeding (or DRY RUN — no writes).

Created:
  - Sprints              <database URL>  (id: <id>, data_source: <id>)
  - PRDs                 <database URL>  (id: <id>, data_source: <id>)
  ...

Config written:
  <target>/.notion/config.json  (8 databases mapped)

Next:
  - /notion:publish sprint <slug>     — publishes using config
  - /notion:audit                     — verifies last_verified timestamps
  - Commit .notion/config.json to the repo so the team shares the same map.
```

## Notes

- Add `.notion/config.json` to your repo (it contains no secrets; it's a workspace map).
- If a teammate runs `/notion:publish` without the config file present, the publisher should fall back to title-based resolution and warn that bootstrap should be run.
- `--force` rewrites the config but preserves any extra top-level keys the user added (e.g. team-specific metadata).
- The integration's MCP token is **never** written to the config — auth lives in the MCP server connection, not the repo.
