---
description: Scan ~/GitHub for Claude Code artifacts (agents, skills, commands, hooks), deduplicate, audit for confidential content, and rebuild the kwong-claude-marketplace repo. Self-updating — run this command to refresh the marketplace after adding new artifacts to any project.
---

Rebuild the Claude Code plugin marketplace at `C:\Users\kwong318\GitHub\kwong-claude-marketplace` by scanning all repos under `C:\Users\kwong318\GitHub` for artifacts and running the full compile pipeline.

This command executes the marketplace compile prompt in full. Follow every phase exactly, pausing at all STOP gates.

---

## Phase 1: Discovery

Recursively scan `C:\Users\kwong318\GitHub` for four artifact types. For each, the directory pattern is the discovery signal; YAML frontmatter with at minimum `name:` and `description:` is the validity check (except hooks, which use JSON).

**Agents** — `.md` files inside any `agents/` directory. Skip `README.md`.

**Skills** — directories at `**/skills/<skill-name>/` containing a `SKILL.md`. The whole directory is the artifact.

**Slash commands** — `.md` files inside any `commands/` directory. Skip `README.md`.

**Hooks** — `hooks/hooks.json` files. No frontmatter; validate as JSON. Surface the event types each hook registers.

Exclude globally: `node_modules/`, `.git/`, `dist/`, `build/`, `.venv/`, `__pycache__/`, anything under a directory beginning with `.archive` or `.deprecated`.

**Also exclude the marketplace repo itself:** `C:\Users\kwong318\GitHub\kwong-claude-marketplace` — do not scan it as a source.

For each artifact capture: full path, name, description, mtime, size, declared tools/permissions if any, and (for skills) the count and list of supporting files.

Output four tables before proceeding. Modify nothing.

---

## Phase 2: Deduplicate

Group by `name:` within each artifact type. For any group with >1 entry:
- Show each version: path, mtime, size, first 10 lines of body
- Recommend keeping the most recently modified
- Ask me to confirm or pick a different one

---

## Phase 2.5: Curate — STOP

Present the deduplicated inventory as a numbered include-list, all marked `[x]` by default. Mark anything whose path contains `test`, `wip`, `draft`, `scratch`, or `tmp` with `[?]`. Wait for me to toggle items before proceeding.

---

## Phase 2.6: Cross-reference graph

For every included artifact, grep its body for the names of other included artifacts. Build a delegation graph. Show me the graph. Note any cross-references that would break if the referenced artifact ends up in a different plugin.

---

## Phase 3: Plan — STOP

Since this is a re-run against an existing repo, default to **update mode**:
- Read existing `marketplace.json` and each `plugin.json` to learn current versions
- For each artifact, diff source vs. existing copy
- Bump plugin.json version: patch for content edits, minor for new artifacts
- Bump marketplace version if any plugin changed
- Append a CHANGELOG.md entry listing what changed

Ask me to confirm the update plan, or switch to fresh-build mode, before proceeding.

---

## Phase 4: Build (update mode)

- Copy changed or new artifacts into the appropriate plugin directories
- Update manifests and CHANGELOG
- Preserve any files I've manually edited — diff before overwriting
- Never touch `.git/`
- For skills: copy entire directory tree, preserve any executable bits

---

## Phase 4.5: Confidential content audit — STOP

Scan every compiled artifact for:
- Email addresses (flag `.edu` specifically)
- Hardcoded absolute paths under `/Users/`, `/home/`, `C:\Users\`, `~/`
- Credential patterns: `sk-`, `xoxb-`, `ghp_`, `AKIA`, `Bearer `, `password=`, `api_key=`, `secret=`, `token=`
- GTLI/Georgia Tech institutional references: `gtli`, `georgia tech`, `gatech`, `sevis`, `sevp`
- Person names (capitalized First Last) that are not "Kevin Wong"
- IP addresses, internal hostnames, `.internal`, `.local` domains
- F-1, FERPA, student ID patterns
- Internal-looking URLs

Output a table: artifact, line number, snippet, category. Ask me line-by-line: keep / redact / exclude artifact.

---

## Phase 5: Validate

1. Parse every `.json` file — report syntax errors
2. Verify every agent, SKILL.md, and command has `name:` and `description:` frontmatter
3. Verify no filename collisions within any `agents/` or `commands/` directory
4. Verify no directory-name collisions within any `skills/` directory
5. Print `find <output-dir> -type f | sort` for final review
6. Run git commit with message: `Update: <summary from CHANGELOG entry>`

---

## Rules

- Never modify source files in their original locations. Copy only.
- Stop and ask at every STOP marker.
- Hooks execute arbitrary commands — treat `hooks.json` as high-sensitivity in the Phase 4.5 audit.
- If Phase 1 finds zero artifacts of any type, stop and report exactly which paths were searched.
