#!/usr/bin/env bash
# Notion session helpers — sourced by session-start.sh and session-close.
#
# Because the Notion API token is only available to the Claude Code MCP layer
# (not as a shell env var), this script does NOT make live API calls.
# Instead it emits signal lines that session-open.md and session-close.md
# instruct Claude to act on using MCP tools.
#
# Two entry points:
#   notion_open_signal   — emits a NOTION_CONFIGURED line for the briefing
#   notion_close_lines   — emits NOTION_PUBLISH: lines for publishable artifacts
#
# Both are silent no-ops when .notion/config.json is absent.

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CONFIG="$PROJECT_DIR/.notion/config.json"
# Node.js on Windows needs native Windows paths — convert MSYS /c/... → C:/...
CONFIG_NODE=$(echo "$CONFIG" | sed 's|^/\([a-zA-Z]\)/|\1:/|')

# Exit silently if not configured
[[ -f "$CONFIG" ]] || exit 0

# ── notion_open_signal ────────────────────────────────────────────────────────
# Emits one HDR: line and workspace metadata lines for the briefing box.
# Claude's session-open.md then sees NOTION_CONFIGURED and runs MCP queries.
notion_open_signal() {
  local workspace_title db_count last_verified stale_days=14 now ts diff_days

  workspace_title=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync('$CONFIG_NODE','utf8'));
      console.log(c.parent.title||'Notion workspace');
    } catch(e) { console.log('Notion workspace'); }
  " 2>/dev/null)

  db_count=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync('$CONFIG_NODE','utf8'));
      console.log(Object.keys(c.databases||{}).length);
    } catch(e) { console.log(0); }
  " 2>/dev/null)

  last_verified=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync('$CONFIG_NODE','utf8'));
      console.log(c.last_verified||'');
    } catch(e) { console.log(''); }
  " 2>/dev/null)

  now=$(date +%s)
  if [ -n "$last_verified" ]; then
    ts=$(node -e "console.log(Math.floor(new Date('$last_verified').getTime()/1000))" 2>/dev/null || echo "$now")
    diff_days=$(( (now - ts) / 86400 ))
  else
    diff_days=0
  fi

  echo "HDR:NOTION"
  if [ "$diff_days" -ge "$stale_days" ]; then
    echo "WRN:${workspace_title} · ${db_count} databases · last verified ${diff_days}d ago"
  else
    echo "OK:${workspace_title} · ${db_count} databases configured"
  fi
  # Signal for session-open.md to trigger MCP queries
  echo "OK:NOTION_CONFIGURED"
}

# ── notion_close_lines ────────────────────────────────────────────────────────
# Detects publishable artifacts changed vs origin/main.
# session-close.md reads NOTION_PUBLISH: lines and prompts the user.
#
# Detects:
#   docs/runbooks/*.md   → runbook
#   docs/adr/*.md        → runbook (ADRs publish as runbooks)
#   docs/prds/*.md       → prd
#   agents/*.md          → skipped (agent sync hook handles these)
notion_close_lines() {
  local changed_files
  changed_files=$(git diff --name-only origin/main...HEAD 2>/dev/null \
    || git diff --name-only HEAD~1 2>/dev/null \
    || true)

  local found=0
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in
      docs/runbooks/*.md|docs/adr/*.md)
        echo "NOTION_PUBLISH:runbook:$f"
        found=1
        ;;
      docs/prds/*.md)
        echo "NOTION_PUBLISH:prd:$f"
        found=1
        ;;
    esac
  done <<< "$changed_files"

  echo "NOTION_FOUND:$found"
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
CMD="${1:-}"
case "$CMD" in
  open)  notion_open_signal ;;
  close) notion_close_lines ;;
  *)
    echo "Usage: notion-status.sh open|close" >&2
    exit 1
    ;;
esac
