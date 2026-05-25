# Hook Recipes

Pre-built hook configurations for common Claude Code automation patterns.
Install via `/setup:hooks` or merge manually into `.claude/settings.json`.

## Available Recipes

| Recipe | File | Event | What it does |
|--------|------|-------|--------------|
| `format-on-write` | format-on-write.json | PostToolUse | Runs prettier after every Write or Edit |
| `log-bash` | log-bash.json | PreToolUse | Appends every bash command to `~/.claude/bash-log.txt` |
| `sprint-banner` | sprint-banner.json | SessionStart | Prints active sprint name if SPRINT.md exists |

## How to Install

### Via command
```
/setup:hooks --add format-on-write
```

### Manual merge
Copy the `hooks` block from the recipe into your `.claude/settings.json`, merging with any existing hooks.

## Hooks Watcher Caveat

**Hooks written mid-session don't fire immediately.** After writing or merging a hooks recipe, the user must:
1. Open `/hooks` in the Claude Code UI (triggers config reload), OR
2. Restart Claude Code

Silent non-firing is worse than an error — always document this step.

## Writing a New Recipe

Copy an existing recipe file and update:
- `_recipe`: kebab-case name
- `_description`: one line, what it does
- `_requires`: tools that must be on PATH
- `_test`: pipe command to validate the hook before writing it
- `hooks`: the actual hook config block (merges into settings.json)

Test the `_test` command before committing. A recipe that silently does nothing is a bug.
