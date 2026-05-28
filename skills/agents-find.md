---
name: agents:find
description: Natural-language search across the agent roster. Takes a free-form query, scans every agents/*.md frontmatter (name + description) plus the first 200 chars of body, scores by keyword overlap + fuzzy match, and returns the top 3 ranked agents with a concrete example invocation. Use when you don't know which agent to invoke — there are 38+ agents and the routing table in CLAUDE.md only covers the common cases.
---

# /agents:find

Natural-language search across the agent roster.

With 38+ agents spread across Web Stack, Quality, Research, Product, Cross-cutting, Workspace, Game Design, GitHub, and Meta families, users often can't remember which agent owns a given concern. The routing rules in `CLAUDE.md` cover the common cases, but anything ambiguous ("who handles webhook security?", "what about prompt caching costs?", "I need someone to review my Drizzle migration") benefits from a lookup-by-meaning rather than lookup-by-name.

This skill is a **read-only search** over the roster. It never invokes the matched agents — it just surfaces them. The caller picks one (or convenes a panel) based on the results.

## Usage

```
/agents:find <natural-language query>
```

**Examples:**

```
/agents:find webhook signature verification
/agents:find playtesting protocols for a roguelike
/agents:find prompt caching cost optimization
/agents:find PR auto-merge rules
/agents:find who owns RLS policies
/agents:find heuristic evaluation
```

## How To Run This Skill

When invoked, do the following in order:

1. **Load the canonical roster table**
   - Read `agents/README.md` — it has a Description column per agent (synced from each agent file's frontmatter `description:`). This is the fastest scannable index.
   - If anything is ambiguous after that pass, read the matching agent files' frontmatter directly (`agents/<name>.md`, lines 1–10).

2. **Score each agent against the query**
   - Tokenize the query: lowercase, split on whitespace, strip stopwords (`the`, `a`, `an`, `for`, `of`, `to`, `in`, `on`, `with`, `who`, `what`, `is`).
   - For each agent, compute a score from:
     - **+5** per query token that appears in the agent's `name` (exact or substring).
     - **+3** per query token that appears in the agent's frontmatter `description:`.
     - **+1** per query token that appears in the first 200 characters of the agent body (the persona/stack lines).
     - **+2** if the query mentions a family keyword (`react`, `frontend`, `db`, `database`, `auth`, `security`, `game`, `level`, `narrative`, `webhook`, `api`, `ci`, `release`, `pr`, `issue`, `notion`, `prd`, `research`, `accessibility`, `performance`, `cost`, `prompt`, `llm`, `ai`, `cache`, `rate limit`, `i18n`, `analytics`, `sprint`, `lifecycle`) and the agent is in the matching family.
   - **Ties broken by alphabetical order.**

3. **Rank and select the top 3** — drop anything with score 0.

4. **Emit results** in this exact format:

   ```
   [AGENT: <name-1>] — <one-line description from frontmatter, trimmed to ~120 chars>
     Invoke with: <concrete example, e.g. /stack:audit data, /panel:game, [AGENT: gh-prs]>

   [AGENT: <name-2>] — <description>
     Invoke with: <example>

   [AGENT: <name-3>] — <description>
     Invoke with: <example>
   ```

5. **If a panel is a better answer** (the top 3 are all in the same family — e.g. all three GitHub agents), add a final line:

   ```
   Tip: all top matches are in the <family> family. Consider /panel:<family> for a cross-domain review.
   ```

6. **If nothing scores > 0**, respond:

   ```
   No agents matched "<query>".
   Try a more specific term, or browse agents/README.md for the full roster.
   ```

## Output Format

Always lead with the standard tag:

```
[AGENT: orchestrator] [COMMAND: agents:find]
Query: "<original query>"

<results as above>
```

## Picking The Right Invocation Example

Use this rule of thumb when filling in the `Invoke with:` line:

| Agent family                                                                                               | Default invocation example                                                 |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Web Stack (`data`, `security`, `ai-llm`, `application`, `infrastructure`, `observability`, `presentation`) | `/stack:audit <name>` or `/stack:advise <question>`                        |
| Quality (`web-qa`, `quality-accessibility`, `quality-performance`, `game-qa`)                              | `/panel:quality` (or `[AGENT: <name>]` for a single concern)               |
| Research (`research-*`)                                                                                    | `/panel:research` (or `[AGENT: <name>]`)                                   |
| Product (`product-product`, `product-analytics`)                                                           | `[AGENT: product-product]` / `[AGENT: product-analytics]`                  |
| Cross-cutting (`cross-i18n`, `cross-finops`)                                                               | `[AGENT: <name>]`                                                          |
| Workspace (`notion-*`)                                                                                     | `/notion:<verb>` (bootstrap / publish / import / audit) or `/panel:notion` |
| Game Design (`game-*`, `narrative`, `level-design`, `production`)                                          | `/panel:game` or `[AGENT: <name>]`                                         |
| GitHub (`gh-*`)                                                                                            | `/panel:github` or `[AGENT: <name>]`                                       |
| Meta (`meta-*`)                                                                                            | `/sprint:assemble`, `/setup:project`, `/agents:hire` etc.                  |

## Constraints

- **Read-only.** This skill must not edit files, write to Notion, or invoke other agents. It only surfaces matches.
- **Do not invent agents.** Only return names that exist in `agents/*.md` (verified via frontmatter `name:`).
- **Be terse.** Three results, one line of description each, one line of invocation. No prose.
- **Reference the README table** as the canonical lookup — keep this skill in sync with `agents/README.md` rather than duplicating the description text here.

## Why This Exists

The routing table in `CLAUDE.md` lists ~30 example phrasings, but real questions rarely match those examples verbatim. Before this skill, an unmatched query would force the orchestrator to either guess or ask a clarifying question. This skill gives the orchestrator a cheap, deterministic fallback: "I'm not sure — let me search the roster" → three concrete suggestions in one round trip.
