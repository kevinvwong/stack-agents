---
name: panel:notion
description: Run all 4 Notion specialists as a panel — notion-architect (schema/views), notion-publisher (publish health), notion-importer (read surface), notion-governance (workspace health) — against the same workspace, then synthesize cross-specialty gaps no single agent would catch. Use for workspace setup reviews, migrations from ad-hoc Notion, and quarterly workspace health checks.
---

# /panel:notion

Convene all 4 Notion specialists as a panel. Each reviews the workspace from their lens, then a synthesis pass identifies gaps and conflicts between layers (schema vs. publish vs. read vs. governance).

## Usage

```
/panel:notion                         # full review of the workspace
/panel:notion [focus]                 # focus the panel on a specific concern
/panel:notion --parent <page-url>     # explicitly set the workspace parent
/panel:notion --json                  # emit a single JSON block (see schema below)
```

## `--json` Output Schema

When `--json` is set, emit only a single fenced JSON block — no markdown prose.

```json
{
  "command": "panel:notion",
  "workspace": { "title": "<page title>", "url": "<URL>" },
  "verdict_summary": "<one paragraph>",
  "agents": {
    "notion-architect":  { "critical": 0, "high": 1, "medium": 2, "low": 0 },
    "notion-publisher":  { "critical": 0, "high": 0, "medium": 1, "low": 1 },
    "notion-importer":   { "critical": 0, "high": 0, "medium": 0, "low": 0 },
    "notion-governance": { "critical": 1, "high": 2, "medium": 3, "low": 5 }
  },
  "cross_specialty": [
    { "title": "Schema drift in PRDs", "agents": ["notion-architect", "notion-publisher"], "fix": "..." }
  ],
  "top_actions": ["...", "...", "..."]
}
```

Exit non-zero if any agent reports `critical > 0`.

**Examples:**

```
/panel:notion
/panel:notion "we're about to migrate from an ad-hoc workspace"
/panel:notion "PRDs aren't getting published reliably — diagnose"
/panel:notion --parent https://www.notion.so/acme/Stack-Agents-abc
/panel:notion "quarterly health check"
```

This is distinct from running `/audit` per agent: `/panel:notion` is a **coordinated review**. Later agents see earlier findings. The synthesis section surfaces where layers conflict.

## Execution Order

Run agents in strict dependency order. Each sees the same workspace and the full output of earlier agents.

```
1. [AGENT: notion-architect]   — schema, properties, views, templates, topology
2. [AGENT: notion-publisher]   — publish coverage, idempotency, payload quality
3. [AGENT: notion-importer]    — read surface, provenance hygiene, downstream handoffs
4. [AGENT: notion-governance]  — ownership, freshness, duplicates, permissions, drift
```

## Output Format

```
[COMMAND: panel:notion]
Workspace: <parent page title> (<URL>)

---

[AGENT: notion-architect] [COMMAND: audit]
Domain lens: workspace topology, database schemas, properties, views, templates

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

[AGENT: notion-publisher] [COMMAND: audit]
Domain lens: publish coverage, idempotency, payload quality, body block hygiene

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

[AGENT: notion-importer] [COMMAND: audit]
Domain lens: read access surface, provenance stamping, downstream handoff fitness

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

[AGENT: notion-governance] [COMMAND: audit]
Domain lens: ownership, freshness, duplicates, source integrity, schema drift, permissions, comments

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

## Cross-specialty findings

Findings that reveal a conflict or gap *between* layers. Each cites the agents involved.

### Critical
- [ ] **[Finding title]** — [agents: X + Y]
  Gap: [what each layer expects that the other doesn't deliver]
  Fix: [specific remediation that touches both layers]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Panel Verdict

One-paragraph summary: the most important action this workspace needs to take, and which layer owns it. If preparing for migration or launch, state whether the workspace is ready.

---

## Rollup

| Agent              | Critical | High | Medium | Low |
|--------------------|----------|------|--------|-----|
| notion-architect   |          |      |        |     |
| notion-publisher   |          |      |        |     |
| notion-importer    |          |      |        |     |
| notion-governance  |          |      |        |     |
| **cross-specialty**|          |      |        |     |
| **Total**          |          |      |        |     |

Top 3 actions to take before proceeding:
1. [action + which layer owns it]
2. [action + which layer owns it]
3. [action + which layer owns it]
```

## Cross-specialty Check Patterns

Look for these classes of conflict after all agents have run:

**Architect ↔ Publisher mismatch** (`notion-architect` + `notion-publisher`)
- Publisher tries to set a property the schema doesn't have (or vice versa)
- Schema defines a `Source` URL property but publisher writes to `URL` instead
- Schema has a `relation` to another database but publisher never populates it
- Database renamed in Notion but publisher still searches by the old name

**Publisher ↔ Importer gap** (`notion-publisher` + `notion-importer`)
- Publisher writes body blocks the importer can't faithfully render back
- Publisher's `Source` URL format doesn't match what importer's `--as <type>` expects
- Publisher creates pages the importer's pagination misses (deep nesting)

**Architect ↔ Importer mismatch** (`notion-architect` + `notion-importer`)
- Database has 200+ rows but no view filters → every importer call paginates the world
- Schema lacks a stable identifier property the importer would key on
- View naming inconsistency makes "import the active PRDs view" ambiguous

**Governance ↔ Publisher gap** (`notion-governance` + `notion-publisher`)
- Governance flags duplicates but publisher keeps creating them (upsert key is broken)
- Governance archives a page; publisher re-creates it next run (no archive awareness)
- Stale `Source` URLs accumulate because publisher never validates URL still resolves

**Governance ↔ Architect gap** (`notion-governance` + `notion-architect`)
- `select` drift surfaced by governance, but architect hasn't consolidated options
- Dead properties (zero rows populate them) — architect should remove, governance flagged
- Database missing `Owner` / `Source` / `Status` — architect needs to add, governance can't audit without

**Governance ↔ Importer gap** (`notion-governance` + `notion-importer`)
- Ownerless pages get imported into agent context with no accountability trail
- Importer surfaces a stale page but caller acts on it as current

## Panel Standards

- **Each agent speaks from their layer.** `notion-architect` does not file publish bugs; `notion-publisher` does not file schema bugs. Cross-specialty findings go in the synthesis section only.
- **Cross-specialty findings require a fix.** Unlike single-agent findings, these are coordination decisions — they need a remediation touching both layers.
- **Later agents reference earlier findings.** `notion-governance` may cite `notion-architect`'s schema-drift finding when flagging dead properties.
- **The Panel Verdict is mandatory.** Every `/panel:notion` run ends with the one-paragraph verdict.
- **Don't manufacture findings.** If a layer is clean, say so. Zeros in the rollup. No padding.
