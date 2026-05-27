# Runbook: Notion publish cycle

When to publish what to Notion. The dogfooding rhythm for this project.

## Core rule

**Repo is canonical; Notion is the discoverable view; comments are the conversation.**

Every workflow decision falls out of that.

## Publish triggers — what lands where, when

| Trigger | Database | Type / Status | Publisher |
|---------|----------|---------------|-----------|
| New phase decided | Sprints | Planned | manual (until `/notion:publish sprint`) |
| Sprint starts | Sprints | Active | manual; update existing row |
| Sprint ends | Sprints | Dissolved | manual; update existing row |
| PRD draft passes `/panel:publish` | PRDs | Draft → In review | `notion-publisher` |
| PRD shipped | PRDs | Shipped | manual update |
| Research report finalized | Research | Reported | `notion-publisher` |
| Event schema approved | Analytics specs | Approved | `notion-publisher` |
| `/panel:github` run completes | GitHub audits | (one row per run) | `notion-publisher` (handoff line in panel output) |
| `/panel:quality` run completes | Quality audits | (one row per run) | `notion-publisher` |
| ADR merged | Runbooks | Active, Type=ADR | `notion-publisher` |
| Operational doc written | Runbooks | Active, Type=Operational | `notion-publisher` |
| New agent created | Agents | Active | hook (Phase 8 #44) |
| Agent deprecated | Agents | Deprecated | `/agents:fire` (Phase 8 #40) |

## Source URL discipline

The `Source` property is the idempotency key. Every publish to the same `Source` URL updates the same Notion page — no duplicates.

**Stable Source URLs** (good):
- `https://github.com/kevinvwong/stack-agents/blob/main/docs/SETUP.md` — file on `main`
- `https://github.com/kevinvwong/stack-agents/blob/<commit-sha>/docs/SETUP.md` — pinned to a commit
- `https://github.com/kevinvwong/stack-agents/pull/2` — a PR (after merge, becomes a historical artifact)
- `https://github.com/kevinvwong/stack-agents/issues/28` — an issue

**Unstable Source URLs** (avoid):
- `https://github.com/kevinvwong/stack-agents/blob/feature-branch/...` — branch deleted on merge → broken link
- `https://github.com/kevinvwong/stack-agents/compare/...` — diff URLs are positional
- Notion page URLs as `Source` — circular reference; doesn't survive Notion edits

**Refuse to publish** (hard rule, enforced by hook):
- Any URL containing `?token=`, `?api_key=`, `?secret=`, etc. — the `notion-url-sanitize` hook blocks these. Strip the credential and retry.

## What NOT to publish

- **Drafts.** `/panel:publish` verdict must be `READY` (or `READY_WITH_FIXES` with explicit acceptance) before publishing a PRD.
- **Transactional data.** Events, metrics, telemetry → PostHog / Sentry / a Postgres table.
- **Long-form specs that need version history.** Keep them as repo files; publish a single Runbook entry that links to the file.
- **Anything you wouldn't want every workspace member to see.** Notion's permission model on databases is coarse.

## Edit-in-Notion policy

- **Body**: replaced on every publish. Edits made in Notion vanish.
- **Comments**: durable. Use comments for discussion, decisions, follow-up questions.
- **Properties**: most are updated on publish (`Status`, `Last updated`). User-set properties (`Owner`, `Linked sprint`, etc.) are merged — explicit nulls clear them; omitted properties are preserved.

If someone makes an edit in Notion that you want to keep, the only safe path is to mirror that edit back to the repo source file, then re-publish.

## Weekly governance

Run once a week: `/notion:audit --propose-archives`

The `notion-governance` agent walks every canonical database and surfaces:
- Ownerless pages
- Stale drafts (Status=Draft, last edited > 30 days)
- Duplicate Source URLs (= publisher bug)
- Broken Source URLs (= renamed file / closed PR)
- Schema drift

Confirm archive proposals interactively. Don't `--auto-flag` until you trust the suggestions.

## See also

- `agents/notion-publisher.md` — publisher spec
- `agents/notion-governance.md` — governance spec
- `docs/SETUP.md` — install guide
- `.notion/config.json` — workspace map (committed; safe — no secrets)
