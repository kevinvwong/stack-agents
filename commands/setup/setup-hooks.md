---
name: setup:hooks
description: Install or review hook recipes into the current project's .claude/settings.json. Lists available recipes, merges selected ones into settings, and documents the hooks watcher caveat.
---

# /setup:hooks

Install hook recipes into `.claude/settings.json` for the current project.

## Usage

```
/setup:hooks                          # list available recipes
/setup:hooks --add <recipe>           # install one recipe
/setup:hooks --add format-on-write,log-bash   # install multiple
/setup:hooks --remove <recipe>        # remove a recipe
/setup:hooks --list                   # show currently installed hooks
```

## Available Recipes

| Recipe | Event | What it does |
|--------|-------|--------------|
| `format-on-write` | PostToolUse / Write\|Edit | Runs prettier after every file write |
| `log-bash` | PreToolUse / Bash | Logs all bash commands to `~/.claude/bash-log.txt` |
| `sprint-banner` | SessionStart | Prints active sprint name if `.claude/SPRINT.md` exists |

## Install Flow

For each recipe being installed:

1. **Read** existing `.claude/settings.json` (create `{}` if absent)
2. **Check for duplicates** — if a hook on the same event+matcher exists, show it and ask: keep, replace, or add alongside
3. **Load recipe** from `templates/hooks/<recipe>.json`
4. **Pipe-test** the hook command to verify it works in this project
5. **Merge** into settings.json
6. **Validate** with `jq -e '.hooks'`
7. **Report** what was installed

## Non-destructive Contract

- Never replace the entire `hooks` block — only append to it
- If a duplicate is found, always ask before overwriting
- If pipe-test fails, report the error and skip installation — don't write a broken hook

## Output

```
## Hooks Installed

✓ format-on-write — PostToolUse / Write|Edit → prettier
✓ sprint-banner   — SessionStart → prints active sprint

⚠️  IMPORTANT: These hooks were written this session.
    Open /hooks in the Claude Code UI or restart Claude Code to activate them.
    The settings watcher does not reload while a session is running.

To review: open /hooks in the UI.
To test: Edit a file — prettier should run automatically.
```

## Writing a Custom Hook

To add a hook not in the recipe library:

1. Describe what you want (event, trigger, command)
2. Claude will construct and pipe-test it following the hook construction protocol
3. The hook will be merged into `.claude/settings.json`

Example: "Run `npm test` after Write on `.ts` files"
