# Concepts

Six primitives. Everything else composes from these.

This system is a master orchestrator (`CLAUDE.md`) plus a pool of specialists. The orchestrator routes; specialists answer. Six primitives are how work gets defined, invoked, persisted, and reviewed: **Agent**, **Panel**, **Sprint**, **Command**, **Hook**, **Runbook**. Read this once and the rest of the repo will read like a directory.

```
                 CLAUDE.md  (master orchestrator — the router)
                     │
       ┌─────────────┼─────────────────────────────────┐
       │             │                                 │
   Families     Sprints (assembled teams)        Workspace (Notion)
       │             │                                 │
  ┌────┴────┐    sprints/<slug>/                 .notion/config.json
  │ agents/ │    └── orchestrator.md ─► <project>/.claude/SPRINT.md
  └────┬────┘
       │
  commands/   ─►  .claude/commands/  (flat — Claude Code loads from here)
       │
  templates/hooks/  ─►  .claude/settings.json  (hook recipes)
       │
  docs/runbooks/, docs/adr/  ─►  Notion Runbooks (mirror, not source)
```

---

## Agent

An **agent** is one Markdown file in `agents/` that defines a specialist persona. One file = one persona = one routing target.

**Anatomy** — every agent file has:

1. **YAML frontmatter** — `name:` (the routing tag) and `description:` (one line, used by the orchestrator to pick the right agent).
2. **Persona** — opening paragraph framed as `[AGENT: <name>]` followed by who they are and what they ship.
3. **`## Stack`** — concrete tools, MCP surfaces, repo state owned, CLIs.
4. **`## Opinions`** — 3–6 strong opinions with reasoning. This is the hill the agent dies on.
5. **`## /audit`** — checklist grouped Critical / High / Medium / Low.
6. **`## /scaffold`** — production-ready boilerplate, in dependency order.
7. **`## /advise`** — Recommendation → Reasoning → Tradeoffs → Alternatives → Next step.
8. **`## Handoffs`** — what this agent passes to which other agent, with explicit trigger conditions.

**Where they live**

- Repo source: `agents/<family>-<name>.md` (e.g. `agents/web-data.md`, `agents/notion-publisher.md`, `agents/gh-prs.md`).
- Synced to user scope: `~/.claude/agents/` via `./install.ps1`.
- Mirrored to Notion: one row per agent in the canonical **Agents** database (relation target for any `Agents` property on Sprints, PRDs, etc.).

**Naming convention**

Files use `<family-prefix>-<role>.md`. The frontmatter `name:` is the short routing tag (the prefix is dropped). `agents/web-data.md` is invoked as `[AGENT: data]`. `agents/notion-publisher.md` is `[AGENT: notion-publisher]` — Notion agents keep the prefix because there is no ambiguity to strip.

**How to invoke**

Three ways, all routed through the master orchestrator:

```
"audit my Drizzle schema"            → [AGENT: data]            (routed by CLAUDE.md)
/stack:audit data                    → [AGENT: data]            (explicit command)
[AGENT: data] design a users table   → bypass the router        (direct address)
```

Catalog: `agents/README.md`. Every agent listed there has a row in `CLAUDE.md`'s roster table — keep them in sync. New agents are added by `sprint-assembler` (generated on demand) or by hand using `templates/agent-template.md`.

---

## Panel

A **panel** convenes multiple agents around one artifact and produces a cross-domain synthesis no single agent would catch alone.

**Family-based panels** convene every member of one family:

| Panel | Members |
|-------|---------|
| `/panel:github` | gh-repo · gh-actions · gh-issues · gh-prs · gh-releases · gh-docs |
| `/panel:game` | game-design · narrative · level-design · game-ux · game-tech · production |
| `/panel:stack` | data · security · ai-llm · application · infrastructure · observability · presentation |
| `/panel:quality` | web-qa · accessibility · performance |
| `/panel:research` | user-research · usability-testing · focus-group · expert-review |
| `/panel:notion` | notion-architect · notion-publisher · notion-importer · notion-governance |

**Cross-family panels** assemble a curated set across families for a specific gate:

| Panel | Members | Purpose |
|-------|---------|---------|
| `/panel:publish` | product + analytics + notion-publisher | Is this PRD ready to publish? |
| `/panel:knowledge` | notion-architect + notion-governance + gh-docs | Docs coherence across Notion and the repo |

**Dependency order is not optional.** Each family has a chain (e.g. Web: `data → security → ai-llm → application → infrastructure → observability → presentation`). Panel output emits each agent's section in chain order, then a **Cross-domain synthesis** section that surfaces conflicts (gh-actions wants `pull_request_target`; gh-repo wants no third-party fork access — these collide). The synthesis is the value-add; without it, a panel is just six audits stapled together.

**Output format**

```
[PANEL: github]
  [AGENT: gh-repo]      — findings...
  [AGENT: gh-actions]   — findings...
  ... (in dependency order)
  ── Cross-domain synthesis ──
  - Conflict: ...
  - Gap: ...
  - Top 3 actions:
```

Panels are **read-only assessments**. They never install anything. To make changes, hand off to the named agent.

---

## Sprint

A **sprint** is a custom team of agents assembled for one project's goal. Unlike a panel (read-only, ephemeral), a sprint installs persistent state into a target project.

**Lifecycle**

```
                     /sprint:assemble                /sprint:dissolve
                            │                                │
   ┌─────────┐   pick roster + generate    ┌────────┐   remove SPRINT.md   ┌───────────┐
   │ Planned │ ─── missing agents ───────► │ Active │ ──── from project ─► │ Dissolved │
   └─────────┘                             └────────┘                      └───────────┘
                                              │
                                              │  /sprint:status (any time)
                                              ▼
                                       Each agent reports
                                       blocking / in-progress / done
```

**What gets created**

- `sprints/<slug>/roster.md` — agent list, goal, duration, chain.
- `sprints/<slug>/panel.md` — defines `/panel:sprint:<name>` for this team.
- `sprints/<slug>/orchestrator.md` — template-filled source for the installed SPRINT.md.
- `<target-project>/.claude/SPRINT.md` — the file that activates the team in that project's Claude sessions.
- `sprints/registry.json` — append-only usage log; sprints are **marked** dissolved, never deleted.

**Notion mirror**

Every sprint publishes to the **Sprints** database via `/notion:publish sprint <slug>`. Status maps directly: `Planned → Active → Dissolved`. The Notion row is the discoverable view; `sprints/<slug>/` is canonical. `Source` URL points back to `sprints/<slug>/` on `main`.

**GitHub relationship**

A sprint's goal usually tracks one or more GitHub issues or a milestone. `sprint-assembler` reads `gh` issue/milestone context before proposing a roster. Sprint blockers surfaced by `/sprint:status` are mirrored as comments on the linked issue, not as new Notion comments — the issue is where engineering conversation happens.

Catalog: `commands/sprint/` and `sprints/registry.json`. See `agents/sprint-assembler.md` for full lifecycle rules.

---

## Command

A **command** is a slash-invokable verb. Commands route to one agent, convene a panel, or run a meta operation (assemble, setup, publish).

**Namespaces**

| Namespace | Invokes | Examples |
|-----------|---------|----------|
| `/stack:` | One web agent | `/stack:audit data`, `/stack:scaffold auth`, `/stack:fullstack` |
| `/panel:` | A panel | `/panel:github`, `/panel:publish <prd>`, `/panel:sprint:<name>` |
| `/sprint:` | Sprint meta | `/sprint:assemble`, `/sprint:status`, `/sprint:dissolve` |
| `/notion:` | A Notion agent | `/notion:bootstrap`, `/notion:publish`, `/notion:import`, `/notion:audit` |
| `/setup:` | Project bootstrap / hooks | `/setup:project --mode bootstrap --stack nextjs`, `/setup:hooks` |
| `/agents:` | Agent lifecycle | `/agents:fire`, `/agents:hire` (Phase 8) |
| `/review:`, `/debug:`, `/auth:`, `/docs:`, `/security:` | Specialist tasks | `/review:code`, `/debug:env`, `/auth:clerk`, `/docs:audit`, `/security:baseline` |

**Frontmatter**

Every command file is Markdown with YAML frontmatter:

```yaml
---
name: stack:audit       # ← exact slash command Claude Code registers
description: Run a structured code review across one or more stack layers.
---
```

The `name:` value must match `namespace:verb` exactly. Files use `namespace-verb.md` (hyphen, not colon — filesystems).

**Where they live**

- Repo source: `commands/<namespace>/<namespace>-<verb>.md` — organized into subdirectories for readability.
- Loaded registry: `.claude/commands/<namespace>-<verb>.md` — **flat**. Claude Code does not load from subdirectories.

**The flat-copy convention**

This is the single most-missed rule. Every command authored in `commands/web/stack-audit.md` must also exist as `.claude/commands/stack-audit.md`. The subdirectories under `commands/` are for humans; the flat copy under `.claude/commands/` is what Claude Code loads. `./install.ps1` handles the copy; if you edit a command and the slash menu doesn't update, you forgot to sync.

Catalog: `commands/README.md`. New commands also need a row in the `## Commands` table in `CLAUDE.md`.

---

## Hook

A **hook** is a small JSON recipe that wires a shell action into a Claude Code lifecycle event — pre/post tool use, session start, etc. Hooks are how the harness enforces invariants Claude can't enforce itself.

**Recipe format**

Every recipe lives in `templates/hooks/<name>.json` with these metadata fields and a `hooks:` block:

```json
{
  "_recipe": "lint-references",
  "_description": "Block git commit if any [AGENT: X] or /cmd:y reference is broken.",
  "_requires": ["node"],
  "_scope_default": "user",
  "_files": [ { "src": "...", "dest_user": "$HOME/.claude/hooks/...", "mode": "0755" } ],
  "_test": "echo '...' | node ...",
  "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [ ... ] } ] }
}
```

`$CLAUDE_HOOK_DIR` is resolved by the installer to `$HOME/.claude/hooks` (user) or `.claude/hooks` (project).

**Scope: user vs project**

- **`user`** — installed into `~/.claude/settings.json`. Applies to every project on this machine. Best for cross-cutting guardrails (`lint-references`, `notion-url-sanitize`).
- **`project`** — installed into `<repo>/.claude/settings.json`. Applies only when Claude Code runs in that repo. Best for repo-specific formatting (`format-on-write`) or observability (`log-bash`, `sprint-banner`).

**Pre-deployed vs installable recipes**

Hooks come in two flavors. **Installable recipes** live in `templates/hooks/` — they're portable and you install them with `/setup:hooks --add <recipe>` into any project. **Pre-deployed hooks** are already committed to a specific repo's `.claude/hooks/` and wired into that repo's `.claude/settings.json` — they activate automatically when you open that repo in Claude Code and require no install step. The `stack-agents` repo ships a pre-deployed set (`bash-guard`, `format-on-write`, `session-stop`, `notify`, `session-start`) as a live example of the pattern.

Install installable recipes with `/setup:hooks --add <recipe>` or merge the `hooks` block manually.

**The watcher caveat**

**Hooks written mid-session do not fire until the config reloads.** Writing or merging a hook recipe is silent — the hook is in the file but the running session ignores it. To activate, the user must either open `/hooks` in the Claude Code UI (forces a reload) or restart Claude Code. Always document this step when shipping a hook. A hook that silently does nothing is worse than an error.

**Examples shipped in this repo** (`templates/hooks/`):

| Recipe | Event | What it does |
|--------|-------|--------------|
| `lint-references` | PreToolUse / Bash | Blocks `git commit` if any `[AGENT: X]` or `/cmd:y` reference is broken. |
| `notion-url-sanitize` | PreToolUse / Notion MCP | Blocks Notion writes whose payload URLs contain credential params (`token=`, `api_key=`, `secret=`, …). |
| `format-on-write` | PostToolUse | Runs prettier after every Write or Edit. |
| `sprint-banner` | SessionStart | Prints the active sprint name if SPRINT.md exists. |

See `templates/hooks/README.md` for the full catalog and authoring guide.

---

## Runbook

A **runbook** is a short, operational document — written when an action is non-obvious, reversible only at cost, or repeated across sessions. ADRs are a sibling type: same shape, different intent (decision record vs. action playbook).

**When to write one**

- A multi-step operation you'll run more than once (publish cycle, sprint kickoff, branch-protection bypass).
- A reversible-at-cost decision worth recording (ADR — "we picked Vercel as the CI gate").
- A recovery procedure (incident response, rollback).
- An onboarding walk-through that doesn't fit in a README.

**Repo vs Notion split**

The repo is canonical. Notion is the discoverable, comment-friendly mirror. The split:

| Surface | Role |
|---------|------|
| `docs/runbooks/<name>.md` | **Canonical.** Git history, code review, line-level diffs. |
| `docs/adr/ADR-NNN-<slug>.md` | **Canonical.** ADRs are immutable once accepted — superseded, never edited. |
| Notion **Runbooks** database | **Mirror.** Each row's `Source` points to the repo file. `Type` enum distinguishes Operational / ADR / Incident / Onboarding / Setup / Reference. Comments are the discussion. |

Publish via `/notion:publish runbook <path-or-id>`. The same Source URL re-publishes onto the same Notion row (idempotent).

**Source URL contract**

Every Notion row has a `Source` URL property. That URL is the idempotency key for `notion-publisher` — same URL = same page, every time. Rules:

- **Stable URLs only.** `https://github.com/kevinvwong/stack-agents/blob/main/docs/runbooks/foo.md` or a commit-pinned URL. Branch URLs break when the branch is deleted.
- **No credentials.** URLs with `?token=`, `?api_key=`, `?secret=` are rejected by `notion-url-sanitize` hook and refused by `notion-publisher` even without the hook. Strip and retry.
- **No Notion URLs as Source.** Circular reference; doesn't survive Notion edits.

See `docs/runbooks/notion-publish-cycle.md` for the full publish-trigger matrix and edit-in-Notion policy.

**ADR vs operational runbook**

| | ADR | Operational runbook |
|---|---|---|
| Question it answers | *Why did we decide X?* | *How do I do X?* |
| Immutable? | Yes — superseded by a new ADR, never edited | No — updated as the process changes |
| File pattern | `docs/adr/ADR-NNN-<slug>.md` | `docs/runbooks/<name>.md` |
| Notion `Type` | `ADR` | `Operational` (or `Incident`, `Onboarding`, `Setup`, `Reference`) |

---

## Putting it together

A real flow that touches every primitive:

You run **`/sprint:assemble`** (a **Command**) with a goal — *"ship the voice coaching MVP."* `sprint-assembler` (an **Agent**, the meta one) reads the agent pool, proposes a roster (data, security, ai-llm, application, observability, presentation), generates one missing **Agent** (`voice-ux`), writes `sprints/voice-coaching-mvp/`, installs `<target>/.claude/SPRINT.md`, and registers the **Sprint** in `sprints/registry.json`. You then run `/notion:publish sprint voice-coaching-mvp` to mirror it into the Notion **Sprints** database — the row's `Source` URL points back to the repo, so re-running updates the same row (idempotent). During the sprint, `/panel:sprint:voice-coaching-mvp` (a **Panel**) convenes all six agents together for cross-cutting review; `/sprint:status` reports blockers. A `lint-references` **Hook** in `~/.claude/settings.json` blocks any commit that references a deleted agent. When the team adopts a new "preview-deploys on PR" pattern, an ADR lands in `docs/adr/`, a **Runbook** in `docs/runbooks/preview-deploys.md` documents the procedure, and `/notion:publish runbook preview-deploys` mirrors it. The sprint ends; `/sprint:dissolve "voice-coaching-mvp"` removes SPRINT.md, marks the registry entry dissolved, and the Notion row flips to `Status = Dissolved`. The sprint folder and agent files remain — available to inform the next assembly.

That's the whole system. Six primitives, one router, repeatable forever.

---

**See also**

- `CLAUDE.md` — master orchestrator (source of truth for routing).
- `agents/README.md` — agent catalog.
- `commands/README.md` — command catalog and flat-copy registry.
- `agents/sprint-assembler.md` — sprint lifecycle.
- `agents/notion-architect.md` — canonical workspace schemas.
- `agents/notion-publisher.md` — Source URL contract + publish flow.
- `templates/hooks/README.md` — hook recipes + authoring guide.
- `docs/runbooks/notion-publish-cycle.md` — publish trigger matrix.
- `docs/adr/` — accepted architecture decisions.
