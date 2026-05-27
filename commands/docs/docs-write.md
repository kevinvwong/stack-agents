---
name: docs:write
description: Rewrites or updates documentation in the correct voice for its audience and purpose. Understands the difference between README (marketing + quickstart), CONTRIBUTING (developer workflow), API docs (reference), user guides (task-based), and runbooks (incident response). Never invents facts — only rewrites what is already there.
---

# /docs:write

Convene the `doc-writer` agent in write mode. It rewrites or updates the target documentation in the correct voice and structure for its audience and doc type. The agent never invents facts — it only rewrites what is already present, and flags gaps that need the author to supply new information.

## Usage

```
/docs:write [file]                   # rewrite a specific file
/docs:write --all                    # rewrite all docs in the project's doc scope
```

Examples:
```
/docs:write README.md
/docs:write docs/getting-started.md
/docs:write CONTRIBUTING.md
/docs:write docs/api/webhooks.md
/docs:write docs/runbooks/deploy.md
/docs:write --all
```

## Doc Type Conventions

The agent applies the correct conventions based on the file being rewritten:

| Doc type | Voice | Structure | Primary reader |
|----------|-------|-----------|----------------|
| **README** | Confident, concise, marketing-aware | Hook → what it does → quickstart → links | A developer evaluating whether to use this |
| **CONTRIBUTING** | Direct, step-by-step, no assumed context | Setup → workflow → PR process → code of conduct | A first-time contributor |
| **API docs** | Precise, reference-style, no prose padding | Endpoint/export → params → returns → errors → example | A developer integrating the API |
| **User guide** | Supportive, task-based, scannable | Goal → steps → expected result → troubleshooting | An end user doing a specific task |
| **Architecture doc / ADR** | Neutral, decision-focused | Context → decision → consequences → alternatives considered | A future maintainer |
| **Runbook** | Terse, imperative, scannable under pressure | Trigger → steps → escalation → contacts | An on-call engineer during an incident |
| **CHANGELOG** | Factual, user-facing, semver-aligned | Keep a Changelog format: Added/Changed/Deprecated/Removed/Fixed/Security | Any reader tracking changes |

## Output Format

```
[AGENT: doc-writer] [COMMAND: write]
File: <path>
Doc type: <type>
Audience: <who this is for>

---

<full rewritten document>

---

### What changed

| Section | Change | Reason |
|---------|--------|--------|
| Introduction | Rewritten — removed technical jargon from first paragraph | README hook must land for evaluators, not just implementers |
| Installation | Reordered — env vars moved before `npm install` | Readers were hitting missing-env errors before reaching that step |
| ... | | |

### Author action required

Items the rewrite could not fill in because the information doesn't exist in the current document. The author must supply these before the doc is complete.

- [ ] **[Item]**: [what is needed and where it should go]
- [ ] ...
```

## What the Agent Will and Will Not Do

**Will do:**
- Rewrite prose to match the correct voice for the doc type and audience
- Restructure sections to follow the correct format for the doc type
- Fix broken markdown, inconsistent heading levels, and formatting issues
- Improve code block accuracy if the correct code is already present
- Flag gaps where the author needs to supply new information

**Will not do:**
- Invent API endpoints, parameters, or behaviors not described in the current doc
- Add technical content it cannot verify from the existing document and codebase
- Change the meaning of a decision recorded in an ADR
- Rewrite a CHANGELOG entry — only format and structure, not the facts of what changed

## Rewrite Standards

- **One doc type per file.** A file that tries to be both a user guide and an API reference will be split or flagged for the author to decide which it is.
- **No invented facts.** If the current doc says "the webhook accepts a `user_id` field," the rewrite keeps that claim. If it can't be verified and appears wrong, it is flagged in "Author action required" — not silently corrected.
- **Voice over polish.** The goal is audience fit, not literary perfection. A runbook should be readable under 3 AM pressure, not beautiful.
- **`--all` is non-destructive.** When `--all` is passed, the agent outputs each rewritten file in sequence. No file is written to disk until the author confirms. The agent will note which files it skipped because they are already in good shape.
