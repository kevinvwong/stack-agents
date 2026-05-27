---
name: review:data-model
description: Reviews a database schema, knowledge structure, or domain model — entity relationships, normalization, naming conventions, soft-delete strategy, indexing rationale, and whether the model fits the domain. Works with SQL schemas (Drizzle, Prisma, raw SQL), NoSQL document models, and abstract domain models.
---

# /review:data-model [schema]

Review a database schema, domain model, or knowledge structure for entity design, normalization, naming, soft-delete strategy, indexing, and domain fit.

## Usage

```
/review:data-model [schema]           # review a specific schema file or description
/review:data-model --drizzle          # infer schema from Drizzle files in the repo
```

Examples:
```
/review:data-model schema.ts
/review:data-model db/schema/
/review:data-model "users and posts tables"
/review:data-model --drizzle
/review:data-model prisma/schema.prisma
```

Supports inline schema descriptions for quick reviews before a schema file exists:
```
/review:data-model "users have many subscriptions; subscriptions belong to a plan; plans have tiers"
```

## Execution

```
[AGENT: data-model-reviewer] [COMMAND: review]
```

The agent reviews the schema against the following checklist:

**Entity Design**
- Entities that conflate two or more distinct domain concepts
- Missing entities implied by the relationships (e.g., a join table that should be a first-class entity)
- Nullable columns that indicate a missing entity or enum

**Normalization**
- Repeated data that should be extracted to a lookup table
- Derived columns that can be computed from other columns
- Denormalization that is intentional vs. accidental (intentional denormalization should be documented)

**Naming**
- Inconsistent naming conventions (snake_case vs camelCase, plural vs singular tables)
- Ambiguous column names (`data`, `info`, `meta`, `value`)
- Boolean columns that should be enums (three states in the data but only two in the type)

**Soft-Delete Strategy**
- `deleted_at` columns without a corresponding `is_deleted` index or partial index
- Queries that may accidentally include soft-deleted rows
- Cascade behavior on soft-deleted parents

**Indexing**
- Foreign keys without covering indexes (common N+1 source)
- Columns used in `WHERE`/`ORDER BY` hot paths that lack indexes
- Over-indexed tables (indexes that are never used)
- Missing composite indexes for multi-column filters

**Domain Fit**
- Schema that models the implementation rather than the domain (e.g., `user_settings_json` instead of structured columns)
- Temporal data without an audit trail
- Multi-tenant data without a `tenant_id` or equivalent isolation column

## Output Format

```
[AGENT: data-model-reviewer] [COMMAND: review]
Schema: <file, description, or ORM detected>

### Per-Entity Findings

#### <entity name>
- [C/H/M/L] **[Finding title]** — [column or relationship]
  Issue: [what is wrong]
  Fix: [specific remediation — SQL DDL, Drizzle code, or structural change]

### Normalization Verdict
[One paragraph: overall normalization quality and the most important structural change]

### Naming Audit
[Pass | Issues found — list inconsistencies with suggested renames]

### Index Recommendations
| Table | Column(s) | Type | Rationale |
|-------|-----------|------|-----------|
| ...   | ...       | ...  | ...       |

### Summary
X critical, Y high, Z medium, W low

Verdict: [one sentence — domain fit signal and the single most important action]
```

Severity tags:
| Tag | Definition |
|-----|-----------|
| **[C]ritical** | Data integrity risk, missing isolation, or structural flaw that requires a migration |
| **[H]igh** | Normalization violation, significant missing index, or naming that will cause query bugs |
| **[M]edium** | Best-practice gap with meaningful future cost — tech debt, not a crisis |
| **[L]ow** | Naming inconsistency, minor optimization, or documentation gap |

## Review Standards

- **Be specific**: cite table and column names. "The users table" is not actionable; "`users.metadata jsonb`" is.
- **Distinguish intentional denormalization**: if a column looks wrong but is likely intentional (e.g., a materialized count), say so and ask rather than filing it as a finding.
- **Include migration sketch for Critical findings**: a Critical finding without a DDL sketch is incomplete.
- **Don't file application-layer bugs here**: if the schema is correct but the ORM query is wrong, that belongs in `/review:code`. Focus on the data model itself.
