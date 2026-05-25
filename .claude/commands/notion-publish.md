---
name: notion:publish
description: Publish an agent, panel, or sprint output to its canonical Notion database. Idempotent — upserts by `Source` URL so re-running updates the existing page instead of creating a duplicate. Supported artifact types: sprint, prd, research, analytics, github-audit, quality-audit, game-design, runbook.
---

# /notion:publish

Convene the `notion-publisher` agent to publish a stack-agents artifact into its canonical Notion database. Idempotent on the `Source` property — running twice updates the same page.

## Usage

```
/notion:publish <type> <identifier> [--parent <page-url-or-id>] [--dry-run] [--archive]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `<type>` | Yes | Artifact type. One of: `sprint`, `prd`, `research`, `analytics`, `github-audit`, `quality-audit`, `game-design`, `runbook`. |
| `<identifier>` | Yes | Path, slug, or URL identifying the artifact. See per-type table below. |
| `--parent <page-url-or-id>` | No | The teamspace/page containing the canonical databases. Defaults to the parent recorded by the most recent `/notion:setup` run (per session). |
| `--dry-run` | No | Resolve the database, build the page payload, print what would be written, exit without writing. |
| `--archive` | No | Set the published page's `Status` property to `Archived` instead of `Active`. Use to retire stale artifacts without deleting history. |

## Identifier by Type

| Type | Identifier | Source artifact |
|------|------------|-----------------|
| `sprint` | sprint slug (e.g. `ai-voice-coaching`) | `sprints/<slug>/roster.md` + latest `/sprint:status` |
| `prd` | path to PRD file or feature slug | `[AGENT: product] /scaffold` output |
| `research` | path to research report or study slug | `user-research` / `focus-group` / `expert-review` output |
| `analytics` | path to event schema / experiment plan | `[AGENT: analytics] /scaffold` output |
| `github-audit` | repo (`owner/name`) or `pr:<number>` | `/panel:github` output |
| `quality-audit` | scope (`web-qa,accessibility,performance` or path) | `/panel:quality` output |
| `game-design` | path or artifact slug | `/panel:game` output |
| `runbook` | path to runbook file | Any agent that produces a runbook |

## What Happens

1. **Resolve the database** — `notion-search` for the canonical database title that matches `<type>` under `--parent`. Stop if not found and tell the user to run `/notion:setup` first.
2. **Locate the source artifact** — read the file or pull the panel output from the active session by `<identifier>`.
3. **Build the page payload** — properties (`Source`, `Status`, `Owner`, type-specific fields) + body blocks (headings, callouts, checklists). The template is whatever the type-specific section in `agents/notion-publisher.md` → `/scaffold` defines.
4. **Upsert by `Source`** — `notion-search` the database for an existing row whose `Source` URL matches. If absent: `notion-create-pages`. If present: `notion-update-page` + replace body blocks.
5. **Verify** — `notion-fetch` the upserted page. Confirm title, key properties, and that body blocks are present. Report page URL + ID.

## Examples

```
/notion:publish sprint ai-voice-coaching
/notion:publish sprint ai-voice-coaching --dry-run

/notion:publish prd ./docs/prds/voice-onboarding.md
/notion:publish prd voice-onboarding --parent https://www.notion.so/acme/Stack-Agents-abc

/notion:publish research ./research/2026-05-onboarding-interviews.md
/notion:publish research onboarding-interviews-may2026 --archive

/notion:publish github-audit acme/web
/notion:publish github-audit pr:482

/notion:publish quality-audit web-qa,accessibility,performance
/notion:publish analytics ./docs/analytics/checkout-funnel.md
```

## Output Format

```
[AGENT: notion-publisher] [COMMAND: publish]
Type:        <type>
Identifier:  <identifier>
Parent:      <page title> (<URL>)
Database:    <database title> (<URL>)

Resolved source:
  <file path or panel run reference>
  Source URL: <URL that will be used for upsert>

Action: <create | update | dry-run>

Page payload:
  Title:       <title>
  Properties:
    Status:    <value>
    Owner:     <person>
    Source:    <url>
    <type-specific>: <value>
  Body blocks: <N> blocks (<list of section headers>)

Result:
  ✓ <created | updated> page: <URL> (id: <id>)
  ✓ Verified: title, properties, body blocks present

Next:
  - Open in Notion: <URL>
  - To retire: /notion:publish <type> <identifier> --archive
```

## Idempotency Contract

- Publishing the same `(type, source URL)` pair twice **updates** the existing page; it does not create a duplicate.
- Removing the `Source` property from a Notion page breaks the link — the next publish will create a new row. Don't remove `Source`.
- Body blocks are **replaced** on update, not merged. Comments and discussion in Notion are preserved (they live on the page object, not the body).

## When Not to Use This

- Long-lived spec that needs version history → write it as an ADR in the repo and `/notion:publish runbook` only the index page that links to it.
- Transactional data (events, metrics, telemetry) → that belongs in PostHog / Sentry / a Postgres table, not Notion.
- A draft you're not ready for the team to see → don't publish. Notion has no concept of "publish-as-draft-but-hide-from-search" that's reliable across teamspace permissions.
