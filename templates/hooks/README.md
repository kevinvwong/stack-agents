# Hook Recipes

Pre-built hook configurations for common Claude Code automation patterns.
Install via `/setup:hooks` or merge manually into `.claude/settings.json`.

## Available Recipes

| Recipe | File | Event | Default scope | What it does |
|--------|------|-------|---------------|--------------|
| `lint-references` | lint-references.json | PreToolUse / Bash | user | Block `git commit` if any `[AGENT: X]` or `/cmd:y` reference is broken. Silent no-op outside orchestration repos. |
| `notion-url-sanitize` | notion-url-sanitize.json | PreToolUse / Notion MCP | user | Block Notion writes when the payload contains a URL with credential query params (token, api_key, secret, etc.). |
| `format-on-write` | format-on-write.json | PostToolUse | project | Runs prettier after every Write or Edit |
| `log-bash` | log-bash.json | PreToolUse / Bash | project | Appends every bash command to `~/.claude/bash-log.txt` |
| `sprint-banner` | sprint-banner.json | SessionStart | project | Prints active sprint name if SPRINT.md exists |

**Scope**: recipes marked `user` default to installing into `~/.claude/settings.json` so they apply to every project automatically. Pass `--scope project` to install into a specific repo's `.claude/settings.json` instead.

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
- `_scope_default`: `user` (default — applies everywhere) or `project` (this-repo-only). Omit for project.
- `_files`: optional list of script files to copy alongside the hook config. Each entry has `src` (relative to repo root), `dest_user` (target path when scope=user, supports `$HOME`), `dest_project` (target path when scope=project, relative to project root), and `mode` (file mode like `0755`).
- `_test`: pipe command to validate the hook before writing it
- `hooks`: the actual hook config block. May reference `$CLAUDE_HOOK_DIR` which the installer resolves to `$HOME/.claude/hooks` (user) or `.claude/hooks` (project).

Test the `_test` command before committing. A recipe that silently does nothing is a bug.
