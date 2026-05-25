---
description: Audit all documentation in the current project and produce a prioritized rewrite list — without rewriting anything yet. Requires kwong-agents.
---

Audit the documentation in this project using the `doc-writer` agent in assessment-only mode.

## Instructions for the doc-writer agent

Run the `doc-writer` agent with the following constraint: **do not rewrite anything**. Your job in this pass is to audit and report only.

For each documentation file found in the project (README, CHANGELOG, CONTRIBUTING, API docs, architecture docs, user guides, inline docstrings, comment blocks), produce an assessment entry.

## What to assess per file

For each doc file:
- **Audience fit** — is it written for the right reader? (developer vs. user vs. operator)
- **Voice consistency** — does it match the tone of the rest of the project?
- **Completeness** — what is missing that a reader would need?
- **Accuracy** — any stale references, deprecated APIs, or wrong examples?
- **Structure** — headers, length, scannability
- **Severity** — Critical (misleads or blocks the reader), Major (significant gaps), Minor (polish)

## Output format

### Documentation Inventory
Table of every doc file found: path, audience, current quality (1–5), severity of issues.

### Priority Rewrite Queue
Ordered list of files to rewrite, highest priority first. For each:
- **File:** path
- **Why:** one sentence on the core problem
- **Audience:** who this doc is for
- **Key gaps:** bullet list of what's missing or wrong

### What's in Good Shape
Files that don't need significant work — call out what's working so it's preserved in rewrites.

### Recommended Rewrite Order
If I were to rewrite these one at a time, which order maximizes impact? Give the sequence with a one-line rationale per step.

Do not modify any files. This is an audit pass only.
