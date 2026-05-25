#!/usr/bin/env bash
# Called by /wrap — prints structured session close summary and writes session-state.json.

set -uo pipefail
# Note: -e omitted intentionally — git upstream probes exit nonzero when no remote is configured.

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

STATE_FILE="$PROJECT_DIR/.claude/session-state.json"
ARTIFACT_PATTERNS='\.report\.html$|lighthouse.*\.json$|lighthouse.*\.html$|\.docx\.xml$|draft-commit-msg\.txt$|\.claude/worktrees/'

# --- Fetch from origin (skip if fetched recently) ---
FETCH_HEAD="$PROJECT_DIR/.git/FETCH_HEAD"
FETCH_AGE=9999
if [ -f "$FETCH_HEAD" ]; then
  FETCH_MTIME=$(stat -c %Y "$FETCH_HEAD" 2>/dev/null || stat -f %m "$FETCH_HEAD" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  FETCH_AGE=$(( NOW - FETCH_MTIME ))
fi
if [ "$FETCH_AGE" -gt 300 ]; then
  git fetch --quiet origin 2>/dev/null || true
fi

# --- Branch + remote sync ---
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
CURRENT_SHA=$(git rev-parse HEAD 2>/dev/null)
UPSTREAM=$(git rev-parse --abbrev-ref "@{upstream}" 2>/dev/null || echo "")

if [ -n "$UPSTREAM" ]; then
  AHEAD=$(git rev-list "@{upstream}..HEAD" --count 2>/dev/null || echo 0)
  BEHIND=$(git rev-list "HEAD..@{upstream}" --count 2>/dev/null || echo 0)
else
  AHEAD=0
  BEHIND=0
  UPSTREAM="none"
fi

# --- Work tree status ---
STATUS=$(git status --porcelain 2>/dev/null)
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')

TRACKED_CHANGES=$(git status --porcelain 2>/dev/null | grep -v "^??" || true)
CLEAN="false"
if [ -z "$TRACKED_CHANGES" ]; then
  CLEAN="true"
fi

PUSHED="false"
if [ "$AHEAD" -eq 0 ] && [ "$UPSTREAM" != "none" ]; then
  PUSHED="true"
fi

# --- Emit structured output ---
echo "BRANCH=$BRANCH"
echo "SHA=$CURRENT_SHA"
echo "UPSTREAM=$UPSTREAM"
echo "AHEAD=$AHEAD"
echo "BEHIND=$BEHIND"
echo "STAGED=$STAGED"
echo "UNSTAGED=$UNSTAGED"
echo "CLEAN=$CLEAN"
echo "PUSHED=$PUSHED"

if [ -z "$TRACKED_CHANGES" ]; then
  echo "STATUS=CLEAN"
else
  echo "STATUS=DIRTY"
  echo "---FILES---"
  while IFS= read -r line; do
    filepath=$(echo "$line" | awk '{print $2}')
    if echo "$filepath" | grep -qE "$ARTIFACT_PATTERNS"; then
      echo "ARTIFACT $line"
    else
      echo "WORK $line"
    fi
  done < <(echo "$STATUS")

  echo "---DIFF---"
  git diff HEAD 2>/dev/null | head -200 || true
fi

# --- Write session state (for session-start to read next open) ---
NOTE="null"
if [ "$CLEAN" = "false" ]; then
  NOTE="\"exited with uncommitted changes\""
elif [ "$PUSHED" = "false" ]; then
  NOTE="\"exited with $AHEAD unpushed commit(s) on $BRANCH\""
fi

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
