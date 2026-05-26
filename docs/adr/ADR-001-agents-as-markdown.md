# ADR-001: Agents as Markdown Files

**Status:** Accepted  
**Date:** 2026-05-19  
**Author:** Kevin Wong

---

## Context

Claude Code loads context from `.md` files in `~/.claude/` and `.claude/` at session start. Agent definitions needed a format that:

1. Could be loaded natively by Claude Code without any runtime
2. Was human-readable and diffable in git
3. Supported structured sections (`/audit`, `/scaffold`, `/advise`) without a schema enforcer
4. Could be authored and iterated quickly without a build step

The alternatives considered were:

- **YAML/JSON** — machine-readable, but poor for long-form prose like personas, opinions, and scaffold templates. Would require a parser/renderer to be useful in Claude's context window.
- **TypeScript modules** — fully typed and composable, but adds a compile step, locks agents to the dashboard codebase, and can't be dropped directly into `~/.claude/`.
- **Database records** — enables querying and versioning per-field, but requires a running service, adds infrastructure, and makes offline/local use impossible.

---

## Decision

Agents are plain Markdown files with a YAML frontmatter block (`name`, `description`) followed by freeform sections in a required order: persona, `## Stack`, `## Opinions`, `## /audit`, `## /scaffold`, `## /advise`, `## Handoffs`.

The structure is enforced by convention and validated visually in the dashboard (warning badge on nodes with missing sections), not by a schema.

---

## Consequences

**Positive:**
- Zero runtime dependency — agents work anywhere Claude Code runs
- `cp agents/ ~/.claude/agents/` is the entire install story
- Git history is the version history; diffs are readable
- New agents can be authored by Claude itself during `/sprint:assemble` without any tooling
- The dashboard parses section headers with a simple regex — no parser to maintain

**Negative:**
- No type safety — a misspelled section header silently produces a malformed agent
- No field-level validation at write time — the dashboard's warning badge is the only enforcement mechanism
- Long agents are hard to browse without the dashboard; raw `.md` files are wall-of-text in a text editor
- Refactoring a section name (e.g., `/audit` → `/review`) requires a find-and-replace across all files

**Mitigations:**
- `templates/agent-template.md` provides a canonical scaffold so authors start from the right structure
- Dashboard warning badges surface missing sections immediately on `npm run dev`
- The `review:artifact` command audits agent quality before publishing to the marketplace

---

## Alternatives not chosen

**YAML with a renderer:** Would allow field validation and structured queries, but YAML multiline strings are hostile to long prose (scaffold templates, opinion lists). Rejected in favor of Markdown readability.

**TypeScript agent registry:** Would enable type-safe composition and tree-shaking. Rejected because it couples agents to the dashboard build and prevents them from being used standalone via `~/.claude/`.
