# Contributing to stack-agents

## Adding an agent

1. Copy `templates/agent-template.md` → `agents/<name>.md`
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
3. Add the agent to the correct family table in `CLAUDE.md` (root) and `~/.claude/CLAUDE.md` (global)
4. Add it to the dependency chain if it belongs in one
5. Run `cd dashboard && npm run dev` — the new node appears in the graph automatically

## Adding a command

1. Add the `.md` file to the appropriate `commands/<family>/` subdirectory
2. Copy it to `~/.claude/commands/` for global availability
3. Commands use `**$ARGUMENTS**` as the placeholder for slash command arguments
4. Register the command in the Commands table in `CLAUDE.md`

## Dashboard changes

```bash
cd dashboard
npm install
npm run dev       # starts on http://localhost:5173
npm run build     # production build check
npx eslint "src/**/*.{ts,tsx}"   # lint check
```

All three must pass before committing.

## Commit style

```
feat: add finops agent with Claude/ElevenLabs cost tracking
fix: correct handoff edge from game-qa to performance
chore: bump @xyflow/react to 12.11.0
```

## Pull requests

- One agent or feature per PR
- Include a screenshot if changing dashboard UI
- Run `npm run build` in `dashboard/` and confirm it succeeds before opening the PR
