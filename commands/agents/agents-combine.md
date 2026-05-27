---
name: agents:combine
description: Merge two agents into one. Surfaces conflicts (overlapping opinions, duplicate handoffs), writes a draft of the merged agent, inserts its Notion row, fires both sources with --replaced-by, and walks every [AGENT:] reference in the tree to rewrite interactively. No silent edits.
---

# /agents:combine

Convene the `agent-lifecycle` meta-agent to merge two agents into one. Both source agents are deprecated (`Status=Deprecated`, `Replaced by=C`), the merged agent is hired, and every inbound reference to either source is rewritten — interactively, one prompt per reference. There is no silent rename.

Use this when two agents always hand off to each other, or when `/agents:review` flags them as overlap candidates.

## Usage

```
/agents:combine <A> <B> --into <C> [--family <family>] [--dry-run]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `<A>` | Yes | First source agent slug. Must exist in `agents/*.md` (not deprecated). |
| `<B>` | Yes | Second source agent slug. Must exist in `agents/*.md` (not deprecated). |
| `--into <C>` | Yes | Slug of the new merged agent. Must not already exist. |
| `--family <family>` | No | Family for the merged agent. Defaults to A's family if A and B match; otherwise required. |
| `--dry-run` | No | Show the merged-spec draft, conflicts, and rewrite plan without writing anything. |

## Behavior

1. **Load both source specs** — `agents/<A>.md` and `agents/<B>.md`. Fail if either is deprecated or missing.
2. **Propose the merged spec for `<C>`**:
   - **Frontmatter**: `name: <C>`. Description is union-summarized — the user gets to edit before apply.
   - **Persona paragraph**: a placeholder block flagged for user rewrite. The agent merger does not auto-write a coherent persona; that's a human call.
   - **Stack**: union of A's and B's `Stack` items, deduplicated. Items present in both are merged once.
   - **Opinions**: union. Where A and B hold conflicting opinions on the same topic, both are emitted side-by-side with `// CONFLICT — choose one` markers.
   - **`/audit`**: merge sections. Overlapping checklist items are flagged.
   - **`/scaffold`**: concatenate, with section headers preserved per source so the user can dedupe.
   - **`/advise`**: union of topic lists.
   - **`Handoffs`**: union. Self-references (`<A>` → `<B>` or `<B>` → `<A>`) are removed entirely.
3. **Surface conflicts** — explicit list, not buried in the draft. Counts of: opinions in conflict, duplicate handoff entries, overlapping `Stack` items, audit-checklist overlaps.
4. **Write `agents/<C>.md` (draft)** — file is marked `STATUS: DRAFT — REQUIRES REVIEW` in the persona section so the merge is never silently accepted.
5. **Hire `<C>` in Notion** — calls `/agents:hire <C>` flow internally to insert the Notion row.
6. **Fire `<A>` and `<B>`** — for each, call `/agents:fire <source> --reason "merged into <C>" --replaced-by <C>`. This flips both Notion rows to `Deprecated` and moves both files to `agents/.deprecated/`.
7. **Walk references** — run `scripts/lint-references.mjs` and collect every `[AGENT: <A>]` and `[AGENT: <B>]` reference in the tree. For each, prompt: `rewrite to [AGENT: <C>]? [y/N/q]`. `q` aborts the rewrite phase (the agent merge is still committed; the references are left for follow-up).
8. **Update routing files** — `CLAUDE.md` and `agents/README.md` get `<A>` and `<B>` removed and `<C>` added (in `<C>`'s family table).
9. **Stage everything** — file writes, file moves, routing edits, reference rewrites. Do not commit automatically.

## Conflict surfacing

The merge does **not** silently lose information. Where A and B disagree, both are preserved with a marker:

```markdown
## Opinions

- A says: "Always use Postgres."
- B says: "Always use SQLite for embedded apps."
// CONFLICT — choose one or rewrite both as a single nuanced opinion
```

The user must resolve every `// CONFLICT` marker before the merged spec is production-ready. The command flags any remaining markers in the output.

## Output Format

```
[AGENT: meta-agent-lifecycle] [COMMAND: combine]
Combining: <A> + <B> → <C>
Family:    <family>

Pre-flight:
  ✓ <A> exists, active
  ✓ <B> exists, active
  ✓ <C> does not exist (no file, no Notion row)
  ✓ Family is valid

Conflicts surfaced:
  Opinions in conflict:    <N>
  Duplicate handoffs:      <N>
  Overlapping Stack items: <N>
  Audit-check overlaps:    <N>

Merged spec draft: agents/<C>.md (<N> lines)
  ⚠ <N> // CONFLICT markers — resolve before this agent is production-ready
  ⚠ Persona paragraph is a placeholder — rewrite before commit

Inbound references to rewrite (<N> total):

  [1/N] agents/<x>.md:42
        - [AGENT: <A>]
        Context: "→ HANDOFF TO [AGENT: <A>]: ..."
        Rewrite to [AGENT: <C>]? [y/N/q]

  [2/N] commands/<y>.md:18
        - [AGENT: <B>]
        Rewrite to [AGENT: <C>]? [y/N/q]
  ...

Result:
  ✓ agents/<C>.md written (draft)
  ✓ Notion: <C> hired (Active, Hired=<date>)
  ✓ Notion: <A> fired (Deprecated, Replaced by=<C>)
  ✓ Notion: <B> fired (Deprecated, Replaced by=<C>)
  ✓ Files moved: agents/<A>.md, agents/<B>.md → agents/.deprecated/
  ✓ Routing files updated: CLAUDE.md, agents/README.md
  ✓ References rewritten: <N> of <M> (<M-N> skipped or aborted)

Staged:
  + agents/<C>.md
  R  agents/<A>.md → agents/.deprecated/<A>.md
  R  agents/<B>.md → agents/.deprecated/<B>.md
  M  CLAUDE.md
  M  agents/README.md
  M  <files with rewritten refs>

Next:
  - Resolve // CONFLICT markers in agents/<C>.md
  - Rewrite the persona paragraph
  - Re-run scripts/lint-references.mjs to confirm no broken refs
  - Commit: git commit -m "agents: combine <A> + <B> → <C>"
```

## Acceptance criteria

- [ ] Both source agents loaded and validated as active
- [ ] Merge logic surfaces conflicts explicitly (no silent loss of opposing opinions)
- [ ] Merged spec written as a draft with `// CONFLICT` markers and placeholder persona — never auto-finalized
- [ ] Notion: new agent hired, both sources deprecated with `Replaced by` set
- [ ] Reference rewrite is interactive — one prompt per reference, with skip and abort options
- [ ] `q` (abort) leaves the merge committed but the references unmodified; the user can finish manually
- [ ] Routing files (`CLAUDE.md`, `agents/README.md`) updated to reflect the new shape
- [ ] Idempotent failure modes: if any step fails midway, the user sees a clear "completed up to step N, manual cleanup needed from step N+1" report

## When Not to Use This

- One agent is fine and the other is just stale — `/agents:train` the stale one; don't combine.
- The two agents are in different families and the merge would create a cross-family Frankenstein — keep them separate; let the orchestrator route to both.
- You want to split one agent into two (the inverse) — there is no `/agents:split`; do `/agents:fire <name> --reason "splitting"` then two `/agents:hire` calls.

Source: PLAN.md Phase 8b · Owned by `[AGENT: meta-agent-lifecycle]`
