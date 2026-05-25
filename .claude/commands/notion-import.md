---
name: notion:import
description: Read a Notion page or database into the current session as context for downstream agents. Use to pull a PRD into the product agent, a research report into a usability-testing pass, or a sprint roster from a previous run. Read-only — never writes to Notion.
---

# /notion:import

Convene the `notion` agent to fetch a Notion page or database and surface its content as session context for another agent.

## Usage

```
/notion:import <url-or-id> [--as <type>] [--into <agent>] [--full]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `<url-or-id>` | Yes | Notion page URL, database URL, or raw ID. |
| `--as <type>` | No | Treat the import as a known artifact type so the receiving agent knows the shape: `prd`, `research`, `analytics`, `sprint`, `github-audit`, `quality-audit`, `game-design`, `runbook`, `database-rows`. Default: `runbook` (free-form). |
| `--into <agent>` | No | Name the agent that should receive the imported content next. Used to set the handoff target in the output. |
| `--full` | No | For a database import, fetch the body of every row instead of only the property table. Off by default — properties are usually enough for downstream agents. |

**Examples:**

```
/notion:import https://www.notion.so/acme/Voice-Onboarding-PRD-abc123
/notion:import abc123def456 --as prd --into product
/notion:import https://www.notion.so/acme/PRDs-xyz --as database-rows
/notion:import https://www.notion.so/acme/PRDs-xyz --as database-rows --full --into analytics
/notion:import https://www.notion.so/acme/Sprints-xyz --as sprint --into sprint-assembler
```

## What Happens

1. **Resolve the target** — `notion-fetch` on the URL/ID. Determine whether it's a page or database.
2. **For a page** — fetch properties + body blocks. Render to markdown preserving headings, callouts, toggles (expanded), and checklists.
3. **For a database** — fetch the property schema + every row (paginated). Render properties as a table. Skip body content unless `--full` is passed.
4. **Stamp the import** — prefix the output with the source URL, the page/db title, and last-edited timestamp so downstream agents can cite it.
5. **Hand off** — if `--into <agent>` is set, emit a `→ HANDOFF TO [agent]` line at the end with a one-line summary of what was imported.

## Output Format

```
[AGENT: notion] [COMMAND: import]
Source:        <Notion URL>
Title:         <page or database title>
Type:          page | database
As:            <type>
Last edited:   <ISO timestamp> by <person>

---

<rendered markdown content>

---

→ HANDOFF TO [<agent>]: <one-line summary of what to do with this content>
```

## What Gets Rendered

**Pages** — headings, paragraphs, callouts, quotes, lists, checklists, toggles (expanded), code blocks, tables, embedded databases (as a link, not inlined). Images render as `![alt](URL)`. Synced blocks render once with a note.

**Databases** (default) — title + property schema + a markdown table of rows. Columns: every property on the database. Rows: every entry, paginated 100 at a time.

**Databases with `--full`** — same as above, then for each row, a `---` separator followed by the row's body rendered as a page.

## What Does Not Get Imported

- Page comments — fetch separately with `notion-get-comments` if you need them.
- File attachments — referenced by URL, not downloaded.
- Permissions, sharing settings, version history.
- Linked databases (the "show in another view" feature) — only the source database is followed.

## Notes

- This is the only `/notion:*` command that does not write to Notion. Safe to run repeatedly.
- Importing a large database (`--full`, hundreds of rows) is expensive — prefer importing the database without `--full`, then importing individual rows that matter.
- When `--into` is set, the imported content remains visible in the current session — the downstream agent's response should reference it directly. There is no persistent "imported into agent" state.
