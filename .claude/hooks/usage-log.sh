#!/usr/bin/env bash
# .claude/hooks/usage-log.sh
#
# PreToolUse hook — lightweight agent/command usage logging.
#
# Reads a Claude Code tool-call event from stdin (JSON). Detects slash-command
# invocations and [AGENT: <name>] references inside the tool input, and appends
# one JSON line per detection to `.claude/usage.jsonl`.
#
# Optional PostHog forwarding: if POSTHOG_API_KEY is set, POSTs the same event
# shape to ${POSTHOG_HOST:-https://app.posthog.com}/capture/. Network failures
# are silent — this hook MUST NEVER block the tool call.
#
# Recognized command namespaces:
#   /stack:* /panel:* /sprint:* /agents:* /notion:* /setup:* /review:*
#   /auth:*  /docs:*  /security:* /debug:*  /ai:*   /gtli:*
#
# Constraints:
#   - Bash 3.2 compatible (no mapfile, no declare -A).
#   - Never blocks (always exit 0), even on invalid JSON, missing fields, or
#     missing jq.
#   - Local data only; .claude/usage.jsonl is gitignored.

# Note: do NOT use `set -e` — we want to swallow every error path.
set -u

# Read stdin once. If empty or anything fails, just exit clean.
INPUT=$(cat 2>/dev/null || true)
if [ -z "$INPUT" ]; then
  exit 0
fi

# Resolve project (repo basename). Fall back to "unknown".
PROJECT="unknown"
TOPLEVEL=""
if command -v git >/dev/null 2>&1; then
  TOPLEVEL=$(git rev-parse --show-toplevel 2>/dev/null || true)
  if [ -n "$TOPLEVEL" ]; then
    PROJECT=$(basename "$TOPLEVEL")
  fi
fi
if [ "$PROJECT" = "unknown" ]; then
  PROJECT=$(basename "$(pwd 2>/dev/null || echo .)")
fi

# Pull the tool input as a flat string. We accept a few shapes:
#   - { "tool_input": { "command": "..." } }      (Claude Code standard)
#   - { "input": { "command": "..." } }           (older shape, just in case)
#   - { "tool_input": { "prompt": "..." } }       (other tools)
# We collect everything stringy via jq -r '.. | strings' and grep through it.
HAYSTACK=""
if command -v jq >/dev/null 2>&1; then
  HAYSTACK=$(printf '%s' "$INPUT" | jq -r '.. | strings? // empty' 2>/dev/null || true)
fi
# Fallback: if jq missing or returned nothing, scan raw input.
if [ -z "$HAYSTACK" ]; then
  HAYSTACK="$INPUT"
fi

# Command namespace regex. Captures e.g. /stack:audit, /panel:github, /agents:hire.
CMD_RE='/(stack|panel|sprint|agents|notion|setup|review|auth|docs|security|debug|ai|gtli):[a-zA-Z][a-zA-Z0-9_-]*'

# Find the FIRST matching slash command in the haystack (if any).
COMMAND=""
if echo "$HAYSTACK" | grep -qE "$CMD_RE" 2>/dev/null; then
  COMMAND=$(echo "$HAYSTACK" | grep -oE "$CMD_RE" 2>/dev/null | head -1)
fi

# Find the FIRST [AGENT: <name>] reference in the haystack (if any).
AGENT=""
AGENT_RE='\[AGENT:[[:space:]]*[a-zA-Z][a-zA-Z0-9_-]*[[:space:]]*\]'
if echo "$HAYSTACK" | grep -qE "$AGENT_RE" 2>/dev/null; then
  AGENT=$(echo "$HAYSTACK" | grep -oE "$AGENT_RE" 2>/dev/null \
            | head -1 \
            | sed -E 's/\[AGENT:[[:space:]]*//; s/[[:space:]]*\]//')
fi
# If no [AGENT: ...] tag but we have a slash command, try the next token as agent.
if [ -z "$AGENT" ] && [ -n "$COMMAND" ]; then
  # Escape forward slash and colon for grep — these are literal in the pattern.
  ESC=$(echo "$COMMAND" | sed 's/[\/:]/\\&/g')
  AGENT=$(echo "$HAYSTACK" \
            | grep -oE "${ESC}[[:space:]]+[a-zA-Z][a-zA-Z0-9_-]*" 2>/dev/null \
            | head -1 \
            | sed -E "s|${ESC}[[:space:]]+||")
fi

# If we detected neither a command nor an agent, nothing to log.
if [ -z "$COMMAND" ] && [ -z "$AGENT" ]; then
  exit 0
fi

# ISO-8601 timestamp (UTC). Works on macOS bash 3.2 + GNU coreutils.
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "")

# Compose the JSONL line. Use jq if available for safe quoting; otherwise
# fall back to a hand-rolled minimal escape (good enough for our alphanum
# fields — none of these tokens contain quotes or backslashes by construction).
LINE=""
if command -v jq >/dev/null 2>&1; then
  LINE=$(jq -cn --arg ts "$TS" --arg cmd "$COMMAND" --arg agent "$AGENT" --arg project "$PROJECT" \
    '{ts: $ts, command: $cmd, agent: $agent, project: $project}' 2>/dev/null || true)
fi
if [ -z "$LINE" ]; then
  LINE="{\"ts\":\"$TS\",\"command\":\"$COMMAND\",\"agent\":\"$AGENT\",\"project\":\"$PROJECT\"}"
fi

# Resolve log path. Prefer repo .claude/usage.jsonl; fall back to cwd.
LOG_DIR=".claude"
if [ -n "${TOPLEVEL:-}" ]; then
  LOG_DIR="$TOPLEVEL/.claude"
fi
mkdir -p "$LOG_DIR" 2>/dev/null || true
LOG_FILE="$LOG_DIR/usage.jsonl"

# Append. Swallow any write errors silently.
printf '%s\n' "$LINE" >> "$LOG_FILE" 2>/dev/null || true

# Optional PostHog forwarding — fire-and-forget, never blocks.
if [ -n "${POSTHOG_API_KEY:-}" ] && command -v curl >/dev/null 2>&1; then
  PH_HOST="${POSTHOG_HOST:-https://app.posthog.com}"
  PH_BODY=""
  if command -v jq >/dev/null 2>&1; then
    PH_BODY=$(jq -cn \
      --arg key "$POSTHOG_API_KEY" \
      --arg ts "$TS" \
      --arg cmd "$COMMAND" \
      --arg agent "$AGENT" \
      --arg project "$PROJECT" \
      '{
        api_key: $key,
        event: "claude_usage",
        distinct_id: $project,
        timestamp: $ts,
        properties: {command: $cmd, agent: $agent, project: $project}
      }' 2>/dev/null || true)
  fi
  if [ -n "$PH_BODY" ]; then
    curl -fsS -m 2 -X POST "$PH_HOST/capture/" \
      -H 'Content-Type: application/json' \
      -d "$PH_BODY" >/dev/null 2>&1 &
    disown 2>/dev/null || true
  fi
fi

exit 0
