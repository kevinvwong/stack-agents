# ADR-004: Agent family-prefix naming convention

**Status:** Accepted
**Date:** 2026-05-28
**Author:** Kevin Wong

---

## Context

The agent roster grew from a small Web Stack family (~7 files) into a multi-family system spanning Web Stack, Quality, Research, Product, Cross-cutting, Workspace, Game Design, GitHub, and Meta. By the time the roster crossed roughly 20 agents, three pain points became unavoidable:

1. **Name collisions.** Short names like `security` no longer disambiguated between the web-security agent and "security in general" (a topic many other agents — `gh-repo`, `gh-actions`, `notion-governance` — also touch). When `/panel:security` was added, it became unclear which agent file the panel was actually convening.
2. **Family attribution.** Looking at a flat list of files in `agents/`, you could not tell that `narrative` belonged to Game Design or that `i18n` was a cross-cutting concern without reading each file. The dashboard's family-grouped graph papered over this, but the filesystem and `[AGENT: <name>]` tags did not.
3. **Routing tables drift.** With short names, the master orchestrator's routing tables in `CLAUDE.md` had to spell out the family every time ("Quality: ... → `[AGENT: web-qa]`"). The mapping from short name to family lived implicitly across half a dozen files (`install.sh`, `install.ps1`, `dashboard/src/data/agents.ts`, `commands/panel-*.md`, individual orchestrator files), and they regularly fell out of sync.

PRs #66 through #83 carried out a roster-wide rename to fix this.

---

## Decision

**Every agent file in `agents/` is named `<family>-<name>.md`,** where `family` is one of:

| Family value                         | Used for                                                                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web`                                | Web Stack — `data`, `security`, `ai-llm`, `application`, `infrastructure`, `observability`, `presentation`, `qa`                                     |
| `quality`                            | Quality — `accessibility`, `performance` (note: `web-qa.md` stays in web for historical reasons, but is grouped under Quality in `agents/README.md`) |
| `research`                           | Research — `user-research`, `usability-testing`, `focus-group`, `expert-review`                                                                      |
| `product`                            | Product — `product`, `analytics`                                                                                                                     |
| `cross`                              | Cross-cutting — `i18n`, `finops`                                                                                                                     |
| `workspace` (file prefix: `notion-`) | Notion-specific workspace agents                                                                                                                     |
| `game`                               | Game Design — `design`, `narrative`, `level-design`, `ux`, `tech`, `production`, `qa`                                                                |
| `gh`                                 | GitHub — `repo`, `actions`, `issues`, `prs`, `releases`, `docs`                                                                                      |
| `meta`                               | Meta — `sprint-assembler`, `project-setup`, `agent-lifecycle`                                                                                        |

The `family` values above are the canonical taxonomy, mirrored in `dashboard/src/data/families.ts` and consumed by the family group nodes in the agent graph. **CLAUDE.md is the source of truth** for the family taxonomy — anything else that lists families (install scripts, dashboard data, panel orchestrators) must follow it.

The frontmatter `name:` field inside each agent file is the _short_ name (e.g. `name: data` inside `agents/web-data.md`), because the `[AGENT: <name>]` output tag is what users read in conversation, and the short form is easier to scan. The file path provides the disambiguation; the short name in the tag stays compact.

---

## Consequences

**Positive:**

- **No more name collisions.** `web-security.md` and a future `cross-security.md` could coexist without breaking routing.
- **Family attribution is visible at the filesystem level.** `ls agents/` is now self-documenting — every file says which family it belongs to.
- **One canonical taxonomy.** The list in `dashboard/src/data/families.ts` matches the prefixes in `agents/` matches the section headings in `agents/README.md` matches the routing tables in `CLAUDE.md`. New families require a single named addition.
- **Sprint assembly is unambiguous.** When `/sprint:assemble` generates a new agent, it picks a family first, then a name within that family — no need to invent a flat namespace that might already be used.

**Negative / costs paid during the rename:**

- **Sync surface area.** Several files reference agent file names and must be kept in sync:
  - `install.ps1` and `install.sh` — copy lists
  - `dashboard/src/data/agents.ts` (`FAMILY_MAP`) — graph node assignment
  - `commands/panel-*.md` and other orchestrator files — agent invocations
  - `CLAUDE.md` — routing tables and roster
  - `agents/README.md` — family tables
    Each rename PR had to touch all of these together. `scripts/lint-references.mjs` was added so CI catches a missed rename before merge.
- **Sprint registry needed migration.** Existing `sprints/registry.json` entries referenced old short names; the rename PRs updated registry entries in place.
- **External references break.** Anyone who had `cp agents/security.md ~/.claude/agents/` in a script needed to update to `agents/web-security.md`. This was a one-time cost paid at the time of the rename.

**Mitigations:**

- `scripts/lint-references.mjs --quiet` runs in CI and catches stale references to old agent names.
- `meta-agent-lifecycle` (the `/agents:*` family) treats family as a required argument on `/agents:hire`, so new agents cannot be created without a family prefix.

---

## Alternatives considered

**Keep flat short names and disambiguate by context.** Rejected — context-based disambiguation works in conversation but breaks down in routing tables, panel command files, and the dashboard graph, where you need a single canonical identifier. The collision between `security` (web) and `security` (everywhere else) was already causing PR review confusion before the rename.

**Use frontmatter `family:` field instead of a filename prefix.** Rejected — the filename is what `ls`, grep, IDE file pickers, and `cp` to `~/.claude/agents/` all see first. Burying the family inside the file requires every consumer to parse YAML before it can route. The frontmatter field was rejected as the _primary_ signal but is kept implicitly via the prefix.

**Nested directories (`agents/web/security.md`, `agents/game/narrative.md`).** Rejected — Claude Code loads `agents/*.md` flat, not recursively. Nesting would require either a build step or `~/.claude/agents/` install logic that flattens the tree. The flat-filename-with-prefix approach gets the same grouping benefit without the install-time complexity.

**Suffixes instead of prefixes (`security-web.md`).** Rejected — alphabetical file listing then sorts by short name, scattering families across the list. Prefix-sorting keeps families contiguous in `ls`, which is the same property the dashboard graph relies on.

---

## Implementation history

Reference PRs:

- **#66** — initial rename of Web Stack agents
- **#78–#83** — rolling rename of Game Design, GitHub, Quality, Research, Product, Cross-cutting, Workspace, and Meta families
- Routing tables in `CLAUDE.md`, install scripts, `FAMILY_MAP` in `dashboard/src/data/agents.ts`, panel command files, and `agents/README.md` were updated in lockstep with each PR.
