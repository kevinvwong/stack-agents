#!/usr/bin/env bash
# .claude/hooks/lint-references-on-commit.sh
#
# PreToolUse hook for Bash. When the command is `git commit ...`, run the
# reference linter and block the commit on broken [AGENT:] or /cmd: refs.
#
# Silent no-op for any other bash command, or if the linter isn't installed,
# or if the repo isn't a stack-agents-style orchestration project (no
# agents/ or commands/ directories).

set -uo pipefail

input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)

# Only run on `git commit` (case-insensitive match for safety).
if ! grep -qiE '(^|[[:space:]&;|])git[[:space:]]+commit([[:space:]]|$)' <<< "$cmd"; then
  exit 0
fi

# Find the linter — prefer explicit override, then user install, then project-local.
LINTER=""
for candidate in \
  "${STACK_AGENTS_LINTER:-}" \
  "$HOME/.claude/scripts/lint-references.mjs" \
  "./scripts/lint-references.mjs"; do
  if [ -n "$candidate" ] && [ -f "$candidate" ]; then
    LINTER="$candidate"
    break
  fi
done

if [ -z "$LINTER" ]; then
  exit 0  # linter not installed — silent no-op
fi

# The linter auto-detects whether it has targets and no-ops if not.
if ! out=$(node "$LINTER" --root . --quiet 2>&1); then
  echo "" >&2
  echo "Reference linter blocked the commit — broken [AGENT:] or /cmd: refs:" >&2
  echo "$out" >&2
  echo "" >&2
  echo "Run \`node $LINTER --root .\` to see details. Fix and re-commit." >&2
  exit 2
fi

exit 0
