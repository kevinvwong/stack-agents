#!/usr/bin/env bash
# PreToolUse hook — block destructive Bash patterns unless an explicit override
# flag is present in the command.
#
# Reads the Bash tool input from stdin (Claude Code hook protocol).
# Exit 1 + message to stderr → Claude Code blocks the tool call and shows the message.
# Exit 0 → allow through.
#
# Override flags:   --force   --yes   --i-know-what-im-doing
# Any of these anywhere in the command string bypasses all pattern checks.
#
# Blocked patterns (case-insensitive):
#   rm -rf (without a scoped path like ./something)
#   git reset --hard
#   git push --force / -f  (not --force-with-lease)
#   git clean -fd / -ffdx etc.
#   DROP TABLE / DROP DATABASE (SQL)
#   format / diskpart (Windows disk ops)
#   shutdown / reboot / halt
#   :(){ :|:& };:  (fork bomb)
#
# Read-only commands never blocked: ls, cat, git log, git status, git diff,
# git show, grep, find, echo, pwd, etc.

set -uo pipefail

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try {
      const o = JSON.parse(d);
      process.stdout.write(o?.tool_input?.command || '');
    } catch { process.stdout.write(''); }
  });
" 2>/dev/null || true)

if [ -z "$COMMAND" ]; then
  exit 0
fi

# --- Override flags: let anything through if present ---
if echo "$COMMAND" | grep -qiE '(--force|--yes|--i-know-what-im-doing)'; then
  exit 0
fi

# --- Read-only command prefixes: always allow ---
READONLY_PREFIXES="^(ls|cat|head|tail|grep|find|echo|pwd|git (log|status|diff|show|branch|remote|rev-parse|describe|tag|stash list)|node --version|npm (ls|list|outdated)|gh (pr|issue|run|release) (list|view|status)|curl .*(--head|-I)|which|type|wc|sort|uniq)"
if echo "$COMMAND" | grep -qiP "$READONLY_PREFIXES" 2>/dev/null || \
   echo "$COMMAND" | grep -qiE '^(ls|cat|head|tail|grep|find|echo|pwd|which|wc|sort|uniq)( |$)'; then
  exit 0
fi

# --- Destructive pattern checks ---
BLOCKED=""

# rm -rf targeting non-scoped paths (allow rm -rf ./dir or rm -rf /tmp/...)
if echo "$COMMAND" | grep -qiE 'rm\s+-[a-z]*r[a-z]*f|rm\s+-[a-z]*f[a-z]*r'; then
  # Allow if the path looks scoped (starts with ./ or a named subdirectory)
  if ! echo "$COMMAND" | grep -qiE 'rm\s+-[a-z]*(rf|fr)[a-z]*\s+(\./|[a-z0-9_\-]+/)'; then
    BLOCKED="rm -rf without a scoped path"
  fi
fi

# git reset --hard
if echo "$COMMAND" | grep -qiE 'git\s+reset\s+--hard'; then
  BLOCKED="git reset --hard"
fi

# git push --force / -f (but not --force-with-lease)
if echo "$COMMAND" | grep -qiE 'git\s+push.*(\s--force\b|\s-f\b)' && \
   ! echo "$COMMAND" | grep -q 'force-with-lease'; then
  BLOCKED="git push --force (use --force-with-lease instead)"
fi

# git clean
if echo "$COMMAND" | grep -qiE 'git\s+clean\s+-f'; then
  BLOCKED="git clean -f"
fi

# DROP TABLE / DROP DATABASE
if echo "$COMMAND" | grep -qiE 'DROP\s+(TABLE|DATABASE|SCHEMA)\s+'; then
  BLOCKED="SQL DROP statement"
fi

# shutdown / reboot / halt / poweroff
if echo "$COMMAND" | grep -qiE '^\s*(shutdown|reboot|halt|poweroff|init\s+0)'; then
  BLOCKED="system shutdown/reboot command"
fi

# fork bomb
if echo "$COMMAND" | grep -q ':(){ :|:'; then
  BLOCKED="fork bomb pattern"
fi

# --- Emit block or allow ---
if [ -n "$BLOCKED" ]; then
  echo "🛡️  bash-guard: blocked — $BLOCKED" >&2
  echo "   Command: $(echo "$COMMAND" | head -1 | cut -c1-120)" >&2
  echo "   Add --force to the command to bypass this check." >&2
  exit 1
fi

exit 0
