---
name: panel:knowledge
description: Run the cross-surface documentation panel — notion-architect + notion-governance + gh-docs — against the same project. Audits how knowledge flows between the Notion workspace and the repo (README, CONTRIBUTING, SECURITY, ADRs, runbooks). Surfaces gaps where a doc lives in one surface but should also live in the other.
---

# /panel:knowledge

Convene the documentation-across-surfaces panel: Notion workspace (architect + governance) + repo docs (gh-docs). Each reviews how knowledge is organized in their surface; the synthesis identifies where the same content should exist in both, or where one surface is the wrong home for what it holds.

## Usage

```
/panel:knowledge                          # full review of Notion + repo docs
/panel:knowledge [focus]                  # focus the panel on a specific concern
/panel:knowledge --parent <page-url>      # explicitly set the Notion workspace parent
/panel:knowledge --json                   # emit a single JSON block (see schema below)
```

## `--json` Output Schema

When `--json` is set, emit only a single fenced JSON block — no markdown prose.

```json
{
  "command": "panel:knowledge",
  "notion": { "title": "<workspace>", "url": "<URL>" },
  "repo": "<owner/repo>",
  "agents": {
    "notion-architect":  { "critical": 0, "high": 1, "medium": 2, "low": 0 },
    "notion-governance": { "critical": 0, "high": 0, "medium": 3, "low": 1 },
    "gh-docs":           { "critical": 1, "high": 1, "medium": 2, "low": 3 }
  },
  "cross_surface": [
    { "title": "Runbook in wrong home", "surfaces": ["notion", "repo"], "fix": "Move to repo docs/runbooks/" }
  ],
  "top_actions": ["...", "...", "..."],
  "verdict_summary": "<one paragraph>"
}
```

Exit non-zero if any agent reports `critical > 0`.

**Examples:**

```
/panel:knowledge
/panel:knowledge "we're about to open-source — what needs to move from Notion to the repo?"
/panel:knowledge "onboarding is slow — find the gaps"
/panel:knowledge "audit our runbooks across surfaces"
/panel:knowledge --parent https://www.notion.so/acme/Stack-Agents-abc
```

## Execution Order

```
1. [AGENT: notion-architect]    — workspace topology, database schemas for docs, page hierarchy
2. [AGENT: notion-governance]   — freshness, ownership, source integrity of Notion docs
3. [AGENT: gh-docs]             — README, CONTRIBUTING, SECURITY.md, ADRs, runbooks in the repo
```

## Output Format

```
[COMMAND: panel:knowledge]
Notion workspace: <parent page title> (<URL>)
Repo:             <owner/repo>

---

[AGENT: notion-architect] [COMMAND: audit]
Domain lens: workspace structure for documentation, page hierarchy, runbook organization

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

[AGENT: notion-governance] [COMMAND: audit]
Domain lens: doc freshness, ownership, broken Source URLs, archive policy for Notion docs

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

[AGENT: gh-docs] [COMMAND: audit]
Domain lens: README, CONTRIBUTING, SECURITY.md, API docs, ADRs, repo runbooks

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

## Cross-surface findings

Findings that reveal a gap or conflict *between* Notion and the repo.

### Critical
- [ ] **[Finding title]** — [surfaces: Notion + repo]
  Gap: [what each surface holds that the other should also hold, or holds wrong]
  Fix: [specific remediation — usually a move, a copy, or a cross-link]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Panel Verdict

One-paragraph summary: the most important documentation gap across surfaces. Name the doc, name the surface that should own it, name who should make the move.

---

## Rollup

| Agent              | Critical | High | Medium | Low |
|--------------------|----------|------|--------|-----|
| notion-architect   |          |      |        |     |
| notion-governance  |          |      |        |     |
| gh-docs            |          |      |        |     |
| **cross-surface**  |          |      |        |     |
| **Total**          |          |      |        |     |

Top 3 actions:
1. [action + which surface owns it]
2. [action + which surface owns it]
3. [action + which surface owns it]
```

## Cross-surface Check Patterns

**Wrong home** (Notion ↔ repo)
- Operational runbook lives in Notion but must work during an incident → move to repo (`docs/runbooks/`)
- ADR lives in repo but is referenced by 5 Notion pages without backlinks → repo is correct, Notion needs cross-links
- README has setup instructions that diverge from a Notion onboarding doc → repo wins, archive the Notion version
- Long-lived spec lives in Notion as a draft for 6 months → move to repo as ADR or PRD-in-tree

**Duplicate of truth** (both surfaces hold the same content)
- SECURITY.md in repo + a "Security policy" page in Notion → repo is canonical, Notion should be a link
- CONTRIBUTING.md in repo + a "How to contribute" Notion page → same; pick one source
- Same ADR appears as a Notion page and a repo file → drift inevitable; pick the repo

**Missing in both** (gap surfaced by the panel)
- No incident runbook anywhere → repo's `docs/runbooks/` should own it
- No onboarding doc anywhere → Notion can own it (it's a living doc for new hires)
- No release process doc → repo owns it (release engineering)

**Broken cross-links**
- Notion page links to a repo file that was renamed or deleted
- Repo README links to a Notion page that's been archived
- Both surfaces reference an external doc (Confluence, Google Doc) that's stale

## Panel Standards

- **Surface ownership matters.** This panel's job is partly to assign ownership: which doc belongs in which surface, and why. Don't leave that ambiguous in the verdict.
- **Operational docs default to repo.** Anything that must work during an incident (runbooks, on-call procedures, rollback steps) belongs in the repo. Notion can hold the friendly version; the repo holds the version that survives a Notion outage.
- **Living docs default to Notion.** Onboarding flows, team norms, retros, meeting notes — these benefit from Notion's editing experience and comment threads.
- **Cross-link, don't copy.** When a doc must be discoverable from both surfaces, write it in the surface that owns it and link from the other. Copy-paste is drift.
