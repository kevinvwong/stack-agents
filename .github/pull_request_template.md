## Why

<!-- Link the issue this closes (e.g. "Closes #12") or describe the problem in one sentence. -->

## What

<!-- One sentence: what does this PR add or fix? -->

## Type

- [ ] New agent
- [ ] Agent update (which agent? which sections changed?)
- [ ] New command
- [ ] Dashboard feature / fix
- [ ] Docs

## Checklist

- [ ] `cd dashboard && npm run build` passes
- [ ] `cd dashboard && ./node_modules/.bin/eslint "src/**/*.{ts,tsx}"` passes with no errors
- [ ] New agents have all required sections (frontmatter, /audit, /scaffold, /advise, Handoffs)
- [ ] `CLAUDE.md` updated if agent roster or command table changed
- [ ] Screenshot attached (if dashboard UI changed)

<!-- If this adds or modifies an agent/command/skill for the marketplace: -->
- [ ] `CHANGELOG.md` entry added under the correct package (`kwong-agents`, `kwong-commands`, or `kwong-skills`)
- [ ] `agents/README.md` updated if agent roster changed
- [ ] Ran `.\install.ps1` locally and confirmed the new/updated file appears in `~/.claude/`
