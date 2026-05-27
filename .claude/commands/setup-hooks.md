---
name: setup:hooks
description: Install or review hook recipes into ~/.claude/settings.json (default — applies to all projects) or a specific project's .claude/settings.json. Lists available recipes, copies any required scripts, merges hook configs, and documents the hooks watcher caveat.
---

# /setup:hooks

Install hook recipes at user scope (every project) or project scope (one repo).

## Usage

```
/setup:hooks                                       # list available recipes + show installed
/setup:hooks --add <recipe>                        # install at the recipe's default scope
/setup:hooks --add <recipe> --scope user           # install into ~/.claude/settings.json
/setup:hooks --add <recipe> --scope project        # install into ./.claude/settings.json
/setup:hooks --add lint-references,notion-url-sanitize   # install multiple
/setup:hooks --remove <recipe>                     # remove a recipe (same scope as install)
/setup:hooks --list [--scope <scope>]              # show currently installed hooks
```

## Available Recipes

| Recipe | Event | Default scope | What it does |
|--------|-------|---------------|--------------|
| `lint-references` | PreToolUse / Bash | user | Block `git commit` if any `[AGENT: X]` or `/cmd:y` reference is broken. Silent no-op in non-orchestration repos. |
| `notion-url-sanitize` | PreToolUse / Notion MCP | user | Block Notion writes when the payload contains a URL with credential params (token, api_key, secret, etc.). |
| `format-on-write` | PostToolUse / Write\|Edit | project | Runs prettier after every file write |
| `log-bash` | PreToolUse / Bash | project | Logs all bash commands to `~/.claude/bash-log.txt` |
| `sprint-banner` | SessionStart | project | Prints active sprint name if `.claude/SPRINT.md` exists |

User-scope recipes apply to every Claude Code session in every repo. Project-scope recipes apply only to the repo where they're installed.

## Install Flow

For each recipe being installed:

1. **Resolve scope** — explicit `--scope` flag wins; otherwise use the recipe's `_scope_default` (`user` or `project`).
2. **Read the recipe** — `templates/hooks/<recipe>.json`.
3. **Copy script files** — for each entry in the recipe's `_files`, copy `src` (in this repo) to `dest_user` (if scope=user) or `dest_project` (if scope=project). Set the file mode. Skip if the destination already exists with identical content.
4. **Pipe-test** the hook command from `_test` to verify it works.
5. **Read target settings** — `~/.claude/settings.json` (user) or `./.claude/settings.json` (project); create `{}` if absent.
6. **Check for duplicates** — if a hook on the same event+matcher already exists, show it and ask: keep, replace, or add alongside.
7. **Substitute placeholders** in the recipe's `hooks` block:
   - `$CLAUDE_HOOK_DIR` → `$HOME/.claude/hooks` (user) or `.claude/hooks` (project)
8. **Merge** the resulting `hooks` block into the target settings.
9. **Validate** with `jq -e '.hooks'`.
10. **Report** what was installed (recipe + scope + script files + hook entries).

## Non-destructive Contract

- Never replace the entire `hooks` block — only append to it.
- If a duplicate is found, always ask before overwriting.
- If pipe-test fails, report the error and skip installation — don't write a broken hook.
- Script files: never overwrite an existing destination if it differs from the source without confirming first (the user may have local edits).

## Output

```
## Hooks Installed

Scope: user (~/.claude/)
✓ lint-references     — PreToolUse / Bash → blocks `git commit` on broken refs
    files:
      ~/.claude/hooks/lint-references-on-commit.sh   (0755)
      ~/.claude/scripts/lint-references.mjs           (0644)
✓ notion-url-sanitize — PreToolUse / Notion MCP → blocks credential leaks
    files:
      ~/.claude/hooks/notion-url-sanitize.sh         (0755)

⚠️  IMPORTANT: These hooks were written this session.
    Open /hooks in the Claude Code UI or restart Claude Code to activate them.
    The settings watcher does not reload while a session is running.

To review: open /hooks in the UI.
To test:
  - git commit on a broken ref     → linter blocks
  - publish a URL with ?token=...  → sanitizer blocks
```

## Writing a Custom Hook

To add a hook not in the recipe library:

1. Describe what you want (event, trigger, command).
2. Claude will construct and pipe-test it following the hook construction protocol.
3. Specify scope (user or project).
4. The hook merges into the chosen settings file.

Example: "Run `npm test` after Write on `.ts` files" → typically project scope.
Example: "Block git push to main without --force" → typically user scope.
