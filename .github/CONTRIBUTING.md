# Contributing to stack-agents

## Adding an agent

1. Copy `templates/agent-template.md` → `agents/<family>-<name>.md`
2. Fill in all required sections — the dashboard will show a warning badge on any agent missing a section:
   - Frontmatter: `name`, `description`
   - `[AGENT: name]` header line
   - Persona paragraph
   - `## Stack` — tools and libraries this agent knows
   - `## Opinions` — at least 4 opinionated stances (these differentiate the agent from a generic LLM response)
   - `## /audit` — checklist format, grouped Critical / High / Medium / Low
   - `## /scaffold` — at least one concrete template with real code
   - `## /advise` — list of questions this agent can answer
   - `## Handoffs` — explicit `→ HANDOFF TO [AGENT: x]` lines
3. Add the agent to the correct family table in `CLAUDE.md` (root) and to `agents/README.md`
4. Add it to the dependency chain in `CLAUDE.md` if it belongs in one
5. Run `.\install.ps1` — syncs `CLAUDE.md` and all agents to `~/.claude/` automatically (no manual copy of `~/.claude/CLAUDE.md` needed)
6. Run `cd dashboard && npm run dev` — the new node appears in the graph automatically

## Adding a command

1. Add the `.md` file to the appropriate `commands/<family>/` subdirectory
2. Set the `name:` frontmatter to the exact slash command (e.g. `name: notion:publish`) — this is what Claude Code registers, not the filename
3. Register the command in the Commands table in `CLAUDE.md`
4. **Run `node scripts/sync-commands.mjs`** — this copies the command into `.claude/commands/` (the flat registry Claude Code actually loads). Without this step the command is invisible to Claude in this project.
5. `install.ps1` copies it to `~/.claude/commands/` for user-scope access — no manual copy needed
6. Commands use `**$ARGUMENTS**` as the placeholder for slash command arguments

CI enforces the sync: the `references` job runs `sync-commands.mjs` and fails if `.claude/commands/` is out of sync with `commands/`.

## Testing your changes globally

After adding or modifying agents, commands, or skills:

```powershell
# From the repo root — installs everything to ~/.claude/
.\install.ps1
```

The installer copies `agents/`, `commands/`, and `skills/` into `~/.claude/` with deduplication and backup. It also syncs `CLAUDE.md` to `~/.claude/CLAUDE.md`. You do not need to manually copy `~/.claude/CLAUDE.md` — the installer handles it.

Restart Claude Code after running `install.ps1` for changes to take effect.

## Dashboard changes

```bash
cd dashboard
npm install
npm run dev       # starts on http://localhost:5173
npm run build     # production build check
./node_modules/.bin/eslint "src/**/*.{ts,tsx}"   # lint check
```

All three must pass before committing.

## Commit style

```
feat: add cross-finops agent with Claude/ElevenLabs cost tracking
fix: correct handoff edge from game-qa to quality-performance
chore: bump @xyflow/react to 12.11.0
```

## Pull requests

- One agent or feature per PR — if a PR spans multiple agents, note the dependency chain in the description
- Squash merge is preferred — keeps `git log` linear and conventional-commit-friendly
- Name branches descriptively: `feat/finops-agent`, `fix/dashboard-card-links`, `chore/pin-actions-sha`
- Draft PRs are welcome for early feedback — mark ready when all checklist items pass
- After addressing review comments, re-request review from the reviewer (don't just push silently)
- PR author owns rebase/conflict resolution before merge

## Marketplace sync (agents, commands, skills)

If your PR adds or modifies anything that gets installed via `install.ps1`:

1. Add a `CHANGELOG.md` entry under the correct package (`kwong-agents`, `kwong-commands`, or `kwong-skills`)
2. Bump the patch version for fixes, minor for new additions, major for breaking changes to existing agent interfaces
3. Run `.\install.ps1` locally and confirm the file lands correctly in `~/.claude/`
4. Check the three-line checklist in the PR template under "marketplace"

See `install.ps1` for the full mapping of source paths → `~/.claude/` destinations.
