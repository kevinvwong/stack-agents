---
name: panel:onboarding
description: Structured intake panel for new projects — convenes product + data + security + infrastructure + gh-repo to produce a single `BLUEPRINT.md` at the target project root before any code is scaffolded. Use this as the thinking artifact that precedes `/setup:project --mode bootstrap`. Each agent contributes a section from their domain; the synthesis pass reconciles conflicts and emits the consolidated blueprint.
---

# /panel:onboarding

Convene the new-project intake panel. Before `/setup:project --mode bootstrap` writes a single file, five agents walk the project idea from their domain: `product` defines what we're building and for whom, `data` sketches the schema, `security` sets the auth and compliance bounds, `infrastructure` picks the deploy target, and `gh-repo` sets the repo hygiene baseline. The output is a single `BLUEPRINT.md` written to the target project root — the thinking artifact every later agent reads first.

## Usage

```
/panel:onboarding                                  # use cwd as project root, prompt for the idea
/panel:onboarding "<one-line project idea>"        # provide the project idea inline
/panel:onboarding --target <path>                  # write BLUEPRINT.md into a different directory
/panel:onboarding --target <path> "<idea>"         # both
/panel:onboarding --dry-run                        # emit the blueprint to stdout, do not write the file
/panel:onboarding --json                           # emit a single JSON block (see schema below)
```

The panel never overwrites an existing `BLUEPRINT.md` silently. If one exists at the target root, the panel diffs the proposed blueprint against it and asks for confirmation before writing.

## `--json` Output Schema

When `--json` is set, emit only a single fenced JSON block — no markdown prose.

```json
{
  "command": "panel:onboarding",
  "target": "<absolute path to project root>",
  "idea": "<one-line project idea>",
  "agents": {
    "product-product": { "section_written": true, "open_questions": 1 },
    "web-data": { "section_written": true, "open_questions": 0 },
    "web-security": { "section_written": true, "open_questions": 2 },
    "web-infrastructure": { "section_written": true, "open_questions": 0 },
    "gh-repo": { "section_written": true, "open_questions": 0 }
  },
  "blueprint_path": "<absolute path to BLUEPRINT.md>",
  "conflicts": [
    {
      "between": ["security", "infrastructure"],
      "topic": "Auth provider vs deploy target compatibility",
      "resolution": "..."
    }
  ],
  "next_command": "/setup:project --mode bootstrap --stack <name>",
  "verdict_summary": "<one paragraph>"
}
```

Exit non-zero if any agent reports an unresolved blocker that prevents bootstrap.

**Examples:**

```
/panel:onboarding "voice-first language tutor for B1 Spanish learners"
/panel:onboarding "internal events platform for an 80-person company"
/panel:onboarding --target ../new-project "lightweight knowledge base for a research team"
/panel:onboarding --dry-run "AI feedback tool for first-draft essays"
```

## Execution Order

Run agents in strict dependency order. Each agent sees the project idea, any `--target` directory context, and the full output of earlier agents before responding.

```
1. [AGENT: product-product]        — goal, scope, target users, success metrics
2. [AGENT: web-data]               — schema sketch, entity relationships, data volume estimate
3. [AGENT: web-security]           — auth requirements, RBAC needs, compliance bounds
4. [AGENT: web-infrastructure]     — deploy target, CI/CD, environment strategy
5. [AGENT: gh-repo]                — repo hygiene baseline, branch strategy
```

`data` reads `product`'s scope to know what entities to sketch. `security` reads `product` (who are the users?) and `data` (what is sensitive?) to set auth + RBAC scope. `infrastructure` reads `security` (where can secrets live?) and `data` (what database does the stack imply?) to pick a deploy target. `gh-repo` reads `infrastructure` to know which CI providers and protected branches the repo needs.

## Output Format

````
[COMMAND: panel:onboarding]
Target: <absolute path to project root>
Idea:   <one-line project idea>

---

[AGENT: product-product] [COMMAND: intake]
Domain lens: problem, target users, scope, success metrics
Contributes to BLUEPRINT.md: ## Goal / ## Target users / ## Scope (v1 in, v1 out) / ## Success metrics

Section draft:
...

Open questions:
- ...

---

[AGENT: web-data] [COMMAND: intake]
Domain lens: entities, relationships, lifecycle, expected volume
Contributes to BLUEPRINT.md: ## Data model sketch

Section draft:
...

Open questions:
- ...

---

[AGENT: web-security] [COMMAND: intake]
Domain lens: auth provider, RBAC roles, PII handling, compliance bounds (GDPR / COPPA / SOC 2 / FERPA)
Contributes to BLUEPRINT.md: ## Auth & access control / ## Compliance posture

Section draft:
...

Open questions:
- ...

---

[AGENT: web-infrastructure] [COMMAND: intake]
Domain lens: deploy target, environments (preview / staging / prod), CI/CD provider, secret store, feature flags
Contributes to BLUEPRINT.md: ## Deploy target / ## Environments / ## CI/CD

Section draft:
...

Open questions:
- ...

---

[AGENT: gh-repo] [COMMAND: intake]
Domain lens: branch strategy, protected branches, CODEOWNERS, Dependabot, secret scanning, community health files
Contributes to BLUEPRINT.md: ## Repo hygiene baseline

Section draft:
...

Open questions:
- ...

---

## Cross-domain reconciliation

Findings where two agents' sections imply conflicting choices. Each must be resolved before the blueprint is written. The synthesis pass picks a side and records the rationale in the blueprint.

- **[Topic]** — [agents: X + Y]
  Conflict: [what each side wants]
  Resolution: [the choice + one-sentence rationale]

---

## Consolidated `BLUEPRINT.md`

The panel emits the file to `<target>/BLUEPRINT.md` with the following sections, in order:

```markdown
# Blueprint: <project name>

> Generated by `/panel:onboarding` on YYYY-MM-DD. Edit freely — this is the source of truth for `/setup:project --mode bootstrap` and every agent that follows.

## Idea
<one-line project idea>

## Goal
<from product>

## Target users
<from product>

## Scope
### v1 in scope
<from product>
### v1 out of scope
<from product>

## Success metrics
<from product>

## Data model sketch
<from data — entities, relationships, volume estimate>

## Auth & access control
<from security — provider, RBAC roles, sessions>

## Compliance posture
<from security — applicable regimes + boundaries>

## Deploy target
<from infrastructure — host, runtime, regions>

## Environments
<from infrastructure — preview / staging / prod strategy>

## CI/CD
<from infrastructure — provider + required checks>

## Repo hygiene baseline
<from gh-repo — branch strategy, protected branches, CODEOWNERS, Dependabot, secret scanning>

## Open questions
<consolidated from each agent — these block specific later decisions, not the bootstrap itself>

## Cross-domain decisions
<from the reconciliation section — every resolved conflict, with rationale>

## Next steps
1. Review and edit this file.
2. Run `/setup:project --mode bootstrap --stack <name>` from the target directory.
3. Run the relevant family panel against the scaffolded repo (`/panel:stack`, `/panel:github`, etc.).
````

---

## Panel Verdict

One-paragraph summary: is this project ready to bootstrap, or are there unresolved questions that should be answered first? Name the single biggest decision the blueprint forces.

→ HANDOFF TO [meta-project-setup]: run `/setup:project --mode bootstrap --stack <name>` against `<target>` once the blueprint is reviewed
→ HANDOFF TO [notion-publisher]: publish this blueprint to the PRDs database via `/notion:publish prd <target>/BLUEPRINT.md` if a Notion workspace is wired up

```

## Acceptance Criteria

A `/panel:onboarding` run is acceptable when:

- A single `BLUEPRINT.md` is written to the target project root (or `--dry-run` prints it to stdout).
- Every section listed in the consolidated blueprint is populated. Empty sections are explicitly marked `<no requirement at v1>` rather than left blank.
- Every agent contributes at least one open question or explicitly states "no open questions."
- Every cross-domain conflict has a chosen resolution and a one-sentence rationale.
- The next-steps section names a concrete `--stack` value for `/setup:project --mode bootstrap` (or explicitly recommends not bootstrapping yet, with reasons).
- The panel never silently overwrites an existing `BLUEPRINT.md` — diffs and confirms first.
- `--json` mode emits a single fenced JSON block matching the schema and nothing else.

## Chaining With `/setup:project --mode bootstrap`

`/panel:onboarding` is designed as the pre-scaffold step:

```

/panel:onboarding "voice-first language tutor for B1 Spanish learners"

# → review BLUEPRINT.md, edit if needed

/setup:project --mode bootstrap --stack nextjs-edu

# → scaffolds the project; the bootstrap reads BLUEPRINT.md to fill in product, stack, and repo-hygiene defaults

```

A bootstrap run launched without a blueprint is allowed but will warn that the project lacks the thinking artifact. The recommendation in that case is to run `/panel:onboarding` first, even after the bootstrap, so later panels and sprints have a shared frame.

## Panel Standards

- **Each agent speaks from their domain.** `product` does not pick the database; `data` does not write the success metric. Cross-domain decisions go in the reconciliation section only.
- **The blueprint is the artifact.** Per-agent sections in the panel output are intermediate. The single `BLUEPRINT.md` file is what later agents read.
- **Idempotent on re-run.** Running the panel a second time with the same idea against the same target produces a diff against the existing blueprint, never a silent rewrite.
- **No code in the blueprint.** Schema sketches are tables or short prose, not Drizzle. Auth choices are named providers, not import statements. The blueprint is the spec; the bootstrap writes the code.
- **Open questions are first-class.** A blueprint with five open questions is more useful than a blueprint that fakes confidence. Name the unknowns.
```
