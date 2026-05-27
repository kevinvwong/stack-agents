#!/usr/bin/env bash
# .claude/hooks/agents-sync-to-notion.sh
#
# PostToolUse hook for Write|Edit. When the modified file is agents/<name>.md
# (top level, not agents/.deprecated/*), extract the agent's frontmatter name:
# and invoke a sync helper that upserts the corresponding row in the Notion
# Agents database (data_source_id 13f4dfbb-5746-477e-b7b0-41215c07dc22).
#
# Silent no-op for any other file path. Never blocks the Write/Edit — failures
# log to ~/.claude/notion-sync.log so the developer can retry manually.
#
# Owned by the agent-lifecycle meta-agent.

set -uo pipefail

LOG="${HOME}/.claude/notion-sync.log"
mkdir -p "$(dirname "$LOG")" 2>/dev/null || true

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null)

# Bail if no file path (defensive — Write/Edit always supply one, but other
# tools matching the recipe in the future might not).
if [ -z "$file_path" ]; then
  exit 0
fi

# Only act on agents/<name>.md at the top level. Reject:
#   - agents/.deprecated/<name>.md  (fired agents — re-publishing as Active is wrong)
#   - agents/README.md              (roster doc, not an agent)
#   - agents/subdir/<name>.md       (no subfolders are canonical except .deprecated/)
#   - any non-agents/ path
if ! echo "$file_path" | grep -qE '(^|/)agents/[^/]+\.md$'; then
  exit 0
fi
if echo "$file_path" | grep -qE '(^|/)agents/\.deprecated/'; then
  exit 0
fi
if echo "$file_path" | grep -qE '(^|/)agents/README\.md$'; then
  exit 0
fi

# Resolve the file to read frontmatter. Tool input usually gives an absolute
# path; if it's relative, treat it as relative to the cwd of the parent
# process (Claude Code's session cwd).
if [ ! -f "$file_path" ]; then
  # File may have been moved/deleted between Write completion and hook fire.
  echo "[$(date -u +%FT%TZ)] skip: file not found at hook time: $file_path" >> "$LOG"
  exit 0
fi

# Extract `name:` from the YAML frontmatter (first --- ... --- block).
# Defensive: trim whitespace, drop any quotes the author used.
agent_name=$(awk '
  /^---[[:space:]]*$/ { fm++; next }
  fm == 1 && /^name:[[:space:]]*/ {
    sub(/^name:[[:space:]]*/, "")
    gsub(/["'\'']/, "")
    gsub(/[[:space:]]+$/, "")
    print
    exit
  }
  fm == 2 { exit }
' "$file_path")

if [ -z "$agent_name" ]; then
  echo "[$(date -u +%FT%TZ)] skip: no frontmatter name in $file_path" >> "$LOG"
  exit 0
fi

# Sync helper. Real implementation lives in a separate node script that calls
# the Notion MCP via the same /notion:publish flow notion-publisher uses
# (upsert by Source URL). This hook stays in bash so it has no node runtime
# dependency at hook-fire time; the helper is invoked only when present.
#
# Resolution order:
#   1. STACK_AGENTS_NOTION_SYNC env var (explicit override)
#   2. $HOME/.claude/scripts/agents-sync-to-notion.mjs (user install)
#   3. ./scripts/agents-sync-to-notion.mjs              (project install)
HELPER=""
for candidate in \
  "${STACK_AGENTS_NOTION_SYNC:-}" \
  "$HOME/.claude/scripts/agents-sync-to-notion.mjs" \
  "./scripts/agents-sync-to-notion.mjs"; do
  if [ -n "$candidate" ] && [ -f "$candidate" ]; then
    HELPER="$candidate"
    break
  fi
done

if [ -z "$HELPER" ]; then
  # Helper not installed — log and exit. The hook still succeeds; the next
  # run of /agents:review will surface that the Notion row is stale.
  echo "[$(date -u +%FT%TZ)] skip: no sync helper found for $agent_name ($file_path)" >> "$LOG"
  exit 0
fi

# Fire the helper. Capture stderr to the log; never let a non-zero exit
# block the Write/Edit (the file is already on disk by the time PostToolUse
# fires — blocking would not undo the write).
if ! out=$(node "$HELPER" --agent "$agent_name" --file "$file_path" 2>&1); then
  {
    echo "[$(date -u +%FT%TZ)] FAIL: agents-sync-to-notion for $agent_name"
    echo "  file: $file_path"
    echo "  helper: $HELPER"
    echo "  output: $out"
  } >> "$LOG"
  exit 0
fi

echo "[$(date -u +%FT%TZ)] ok: synced $agent_name ($file_path)" >> "$LOG"
exit 0
