#!/usr/bin/env bash
# PostToolUse hook — auto-format the file that was just written or edited.
#
# Triggered after Edit and Write tool calls. Reads the file path from the
# tool input JSON on stdin (Claude Code hook protocol).
#
# Formatters:
#   .ts / .tsx / .js / .jsx / .mjs / .cjs / .json / .jsonc → Prettier (if installed)
#   Skips silently if Prettier is not found or file is not recognised.
#
# Exit codes:
#   0  — formatted OK (or skipped gracefully)
#   Non-zero exits are intentionally suppressed — a formatter failure must
#   never block Claude from proceeding.

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

# --- Read file path from stdin (hook JSON input) ---
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try {
      const o = JSON.parse(d);
      // tool_input.file_path (Edit) or tool_input.file_path (Write)
      const p = o?.tool_input?.file_path || o?.tool_input?.path || '';
      process.stdout.write(p);
    } catch { process.stdout.write(''); }
  });
" 2>/dev/null || true)

# Fallback: if node parse failed, nothing to do
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Resolve to absolute path if relative
if [[ "$FILE_PATH" != /* && "$FILE_PATH" != [A-Za-z]:* ]]; then
  FILE_PATH="$PROJECT_DIR/$FILE_PATH"
fi

# Only proceed if file actually exists
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# --- Detect extension ---
EXT="${FILE_PATH##*.}"
case "$EXT" in
  ts|tsx|js|jsx|mjs|cjs|json|jsonc|css|md|yaml|yml)
    ;;
  *)
    exit 0
    ;;
esac

# --- Run Prettier if available ---
# Look for a local Prettier first (project-installed), then global
PRETTIER=""
if [ -x "$PROJECT_DIR/node_modules/.bin/prettier" ]; then
  PRETTIER="$PROJECT_DIR/node_modules/.bin/prettier"
elif [ -x "$PROJECT_DIR/dashboard/node_modules/.bin/prettier" ]; then
  PRETTIER="$PROJECT_DIR/dashboard/node_modules/.bin/prettier"
elif command -v prettier &>/dev/null; then
  PRETTIER="prettier"
fi

if [ -n "$PRETTIER" ]; then
  "$PRETTIER" --write "$FILE_PATH" --log-level silent 2>/dev/null || true
fi

exit 0
