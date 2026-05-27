#!/usr/bin/env bash
# Stop hook — write session state automatically at the end of every Claude turn.
#
# Keeps .claude/session-state.json fresh without requiring a manual /session:close.
# The session-start.sh briefing reads this file on next open.
#
# Writes a minimal state record:
#   closed_at, branch, sha, clean, ahead, pushed, note
#
# This is intentionally lightweight — it does NOT print a summary (that's
# /session:close's job). It just persists enough state for the next session
# open to show an accurate RESUME line.

set -uo pipefail
# -e omitted: git upstream probes exit nonzero when no remote configured

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

STATE_FILE="$PROJECT_DIR/.claude/session-state.json"

# --- Branch + SHA ---
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
CURRENT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

# --- Upstream sync (skip fetch — too slow for a stop hook) ---
UPSTREAM=$(git rev-parse --abbrev-ref "@{upstream}" 2>/dev/null || echo "")
if [ -n "$UPSTREAM" ]; then
  AHEAD=$(git rev-list "@{upstream}..HEAD" --count 2>/dev/null || echo 0)
  BEHIND=$(git rev-list "HEAD..@{upstream}" --count 2>/dev/null || echo 0)
else
  AHEAD=0
  BEHIND=0
  UPSTREAM="none"
fi

# --- Clean / pushed ---
TRACKED_CHANGES=$(git status --porcelain 2>/dev/null | grep -v "^??" || true)
CLEAN="false"
if [ -z "$TRACKED_CHANGES" ]; then
  CLEAN="true"
fi

PUSHED="false"
if [ "$AHEAD" -eq 0 ] && [ "$UPSTREAM" != "none" ]; then
  PUSHED="true"
fi

# --- Note ---
NOTE="null"
if [ "$CLEAN" = "false" ]; then
  NOTE="\"exited with uncommitted changes\""
elif [ "$PUSHED" = "false" ] && [ "$AHEAD" -gt 0 ]; then
  NOTE="\"exited with $AHEAD unpushed commit(s) on $BRANCH\""
fi

# --- Write state ---
cat > "$STATE_FILE" <<EOF
{
  "closed_at": "$(date '+%Y-%m-%dT%H:%M')",
  "branch": "$BRANCH",
  "sha": "$CURRENT_SHA",
  "clean": $CLEAN,
  "ahead": $AHEAD,
  "pushed": $PUSHED,
  "note": $NOTE
}
EOF

exit 0
