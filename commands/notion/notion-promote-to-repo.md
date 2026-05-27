---
name: notion:promote-to-repo
description: Promote a Notion-drafted artifact back to a canonical repo file. The inverse of /notion:publish — reads a Notion page, renders to markdown matching the artifact type's conventions, writes to docs/<type>/<slug>.md, flips the Notion page's Source URL to point at the new repo file. Closes the integration loop for content that originated in Notion.
---

# /notion:promote-to-repo

Convene the `notion-importer` agent to extract a Notion page into a canonical repo file, returning a PR-ready diff.

## Usage

```
/notion:promote-to-repo <notion-url-or-id> --as <type> [--target <path>] [--dry-run]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `<notion-url-or-id>` | Yes | Notion page URL or raw ID to promote. Must be an existing page in a canonical database (PRDs, Research, Analytics specs, Runbooks). |
| `--as <type>` | Yes | Artifact type — determines target path and template: `prd`, `research`, `analytics`, `runbook`. |
| `--target <path>` | No | Explicit target path. Default: `docs/<type>/<slug>.md` where `<slug>` derives from the page title. |
| `--dry-run` | No | Render to stdout and show the proposed Source flip, but don't write the file or update Notion. |

**Examples:**

```
/notion:promote-to-repo https://www.notion.so/acme/voice-onboarding-abc --as prd
/notion:promote-to-repo abc123def456 --as research --target research/2026-Q2-onboarding-interviews.md
/notion:promote-to-repo <url> --as runbook --dry-run
```

## What Happens

1. **Fetch the Notion page** via `notion-fetch`. Confirm it lives in a canonical database (`PRDs`, `Research`, `Analytics specs`, or `Runbooks` per `--as`). If not, refuse with a clear message.
2. **Render the body** via the `notion-importer` agent's markdown renderer. Toggles render expanded, callouts as block-quotes, properties as a header table at top of the file.
3. **Derive the target path**:
   - `prd` → `docs/prds/<slug>.md` (or whatever the project's PRD convention is)
   - `research` → `research/<run-date>-<slug>.md`
   - `analytics` → `docs/analytics/<slug>.md`
   - `runbook` → `docs/runbooks/<slug>.md`
   - `<slug>` = page title kebab-cased, ascii-only, no leading dates
4. **Stamp provenance** at the top of the file:
   ```
   <!-- imported from <notion-url> at <ISO timestamp> -->
   <!-- canonical source is now this file; the Notion page mirrors it -->
   ```
5. **Write the file** (refuse if it already exists; `--target` can override or `--force` once added).
6. **Flip the Notion page's `Source` property** to the new repo file URL: `https://github.com/<org>/<repo>/blob/main/<target>`. This is the only mutation `notion-importer` makes — and it only happens after the local write succeeds.
7. **Return a diff** suitable for `git diff` review: the new file + the property flip noted as a comment.

Atomic guarantee: if file write fails, the Notion Source flip is not attempted. If the Source flip fails, the file is staged but not committed — user can either retry or roll back.

## Acceptance criteria

- [ ] Command file at `commands/notion/notion-promote-to-repo.md` (this file)
- [ ] Implementation extension in `agents/notion-importer.md` adding a `/scaffold` flow for `promote-to-repo` (the importer agent gains a Write tool it didn't need before for pure imports)
- [ ] Supported types: `prd`, `research`, `analytics`, `runbook` (minimum)
- [ ] Provenance comment present in every promoted file
- [ ] Notion `Source` flip happens last and only after local write succeeds
- [ ] `--dry-run` mode prints the rendered markdown and the proposed flip, writes nothing
- [ ] Failure modes documented: target file exists (refuse), Notion page not in canonical DB (refuse), Notion API error (skip Source flip)

## When NOT to use

- **Existing canonical repo file**: if the file already exists, the page should already have been published from it. Use `/notion:publish` to re-sync the body instead.
- **Long-form pages with embedded sub-pages**: the importer renders one page; sub-page content becomes a link, not inlined. Promote the sub-pages separately.
- **Pages with attached files or images you care about**: images render as URLs to Notion-hosted blobs. The repo file won't contain the binary. Download manually and commit alongside.

## Why this exists

Closes the integration loop. The publishing rule has always been "repo is canonical; Notion is the mirror" — but in practice, content sometimes originates in Notion (someone drafts a PRD there, a researcher writes findings there). Without a promotion path, the rule was aspirational. With this command, Notion-first drafts have a clean migration to canonical.

Source: PLAN.md Phase 7c · Issue [#36](https://github.com/kevinvwong/stack-agents/issues/36)
