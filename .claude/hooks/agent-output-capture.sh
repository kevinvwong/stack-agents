#!/usr/bin/env bash
# Agent output auto-capture — archive [AGENT:] [COMMAND:] blocks at session close.
#
# Fires from the Stop hook (sibling of session-stop.sh, which writes
# session-state.json). Reads the Claude Code stdin payload, finds the
# transcript path, scans it for agent output markers, and writes each block
# to a dated history file under .claude/history/.
#
# Layout:
#   .claude/history/YYYY-MM-DD-<session-id>.md
#
# Schedule:
#   - Runs on every Stop event (configure in .claude/settings.json — see
#     setup notes at the bottom of this file).
#   - Prunes anything in .claude/history/ older than 30 days.
#
# Guarantees:
#   - Bash 3.2 compatible.
#   - NEVER blocks session exit. All failure paths exit 0.
#   - Never reads from anywhere but the transcript path Claude Code provides.
#   - .claude/history/ is gitignored (local artifacts, not canonical history).
#
# ----------------------------------------------------------------------------
# LIMITATION: transcript access
# ----------------------------------------------------------------------------
# Claude Code's Stop hook is documented to receive a JSON payload on stdin
# containing `transcript_path` and `session_id` keys. This hook reads that
# payload defensively:
#   - If stdin has no JSON (e.g. invoked manually `< /dev/null`), it scaffolds
#     the .claude/history/ directory + prunes old files and exits 0.
#   - If `transcript_path` is present but the file is unreadable (sandboxed
#     execution, MCP-internal transcript storage, etc.), it logs a single
#     LIMITATION line to .claude/history/.last-run.log and exits 0.
#   - If the transcript is readable, it extracts [AGENT: X] [COMMAND: Y]
#     blocks. Block boundary: the next [AGENT: ...] marker, or end of file.
#
# Known environments where transcript_path may NOT be available to a shell
# hook (and what this hook does in each case):
#   - Web-based Claude (transcripts are MCP-internal): scaffolds dir, no-op.
#   - Older Claude Code versions without Stop hook stdin: scaffolds dir, no-op.
#   - First-run before any agent output exists: writes empty history dir.
# ----------------------------------------------------------------------------

set -u
# Note: -e omitted intentionally — we never want this hook to abort.
# Note: pipefail also omitted — defensive for old bash on macOS (3.2).

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
HISTORY_DIR="$PROJECT_DIR/.claude/history"
LOG_FILE="$HISTORY_DIR/.last-run.log"

# Always ensure the history dir exists (idempotent).
mkdir -p "$HISTORY_DIR" 2>/dev/null || exit 0

# --- Prune anything older than 30 days (best-effort) ----------------------
# Use find with mtime; redirect errors to /dev/null so a permissions blip
# never blocks exit.
find "$HISTORY_DIR" -maxdepth 1 -type f -name "*.md" -mtime +30 -delete 2>/dev/null || true

# --- Helper: log a line to the run log, capped at 200 lines --------------
log_line() {
  printf '%s  %s\n' "$(date '+%Y-%m-%dT%H:%M:%S')" "$1" >> "$LOG_FILE" 2>/dev/null || true
  # Cap log file so it can't grow unbounded.
  if [ -f "$LOG_FILE" ]; then
    tail -n 200 "$LOG_FILE" > "$LOG_FILE.tmp" 2>/dev/null && mv "$LOG_FILE.tmp" "$LOG_FILE" 2>/dev/null || true
  fi
}

# --- Read Claude Code stdin payload (if any) -----------------------------
# Stop hooks receive a JSON object with at least: session_id, transcript_path.
# We don't require jq — extract with grep/sed for Bash 3.2 portability.
STDIN_DATA=""
if [ ! -t 0 ]; then
  # stdin is a pipe — read it, capped at 64KB to be safe.
  STDIN_DATA=$(dd bs=1024 count=64 2>/dev/null || true)
fi

if [ -z "$STDIN_DATA" ]; then
  log_line "no-stdin: scaffolded history dir, no transcript to scan"
  exit 0
fi

# Extract transcript_path — handles "transcript_path":"/path/to/file"
TRANSCRIPT_PATH=$(printf '%s' "$STDIN_DATA" \
  | grep -o '"transcript_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -n 1 \
  | sed 's/.*"transcript_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

SESSION_ID=$(printf '%s' "$STDIN_DATA" \
  | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -n 1 \
  | sed 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

# Fallback session id: short timestamp.
if [ -z "${SESSION_ID:-}" ]; then
  SESSION_ID=$(date '+%H%M%S')
fi

if [ -z "${TRANSCRIPT_PATH:-}" ]; then
  log_line "no-transcript-path: stdin had no transcript_path field"
  exit 0
fi

if [ ! -r "$TRANSCRIPT_PATH" ]; then
  # LIMITATION: transcript file unreadable from hook context. See header.
  log_line "LIMITATION: transcript_path=$TRANSCRIPT_PATH not readable from hook"
  exit 0
fi

# --- Scan the transcript for [AGENT: X] [COMMAND: Y] blocks --------------
# We look for lines that contain [AGENT: ...] (the canonical block opener
# defined in CLAUDE.md). A block runs from one marker to the next.
#
# Quick pre-check: if the transcript contains no marker at all, skip the
# write entirely (don't pollute history with empty files).
if ! grep -q '\[AGENT:[[:space:]]*[A-Za-z0-9_:\-]\+[[:space:]]*\]' "$TRANSCRIPT_PATH" 2>/dev/null; then
  log_line "no-markers: transcript has no [AGENT:] blocks, skipping write"
  exit 0
fi

DATE=$(date '+%Y-%m-%d')
OUT_FILE="$HISTORY_DIR/${DATE}-${SESSION_ID}.md"

# Build the history file.
# Strategy: use awk to split the transcript on [AGENT:] markers and emit
# each block with a header. Conservative — only emits blocks that have a
# matching [AGENT: name] line.
{
  printf '# Agent output archive — %s\n\n' "$DATE"
  printf '_Session: `%s`_\n' "$SESSION_ID"
  printf '_Transcript: `%s`_\n\n' "$TRANSCRIPT_PATH"
  printf -- '---\n\n'

  awk '
    BEGIN { in_block = 0; block_num = 0 }
    /\[AGENT:[[:space:]]*[A-Za-z0-9_:\-]+[[:space:]]*\]/ {
      if (in_block) print "\n---\n"
      block_num++
      printf "## Block %d\n\n", block_num
      in_block = 1
    }
    in_block { print }
  ' "$TRANSCRIPT_PATH" 2>/dev/null
} > "$OUT_FILE" 2>/dev/null || {
  log_line "write-failed: could not write $OUT_FILE"
  exit 0
}

# If the file ended up empty (awk pattern didn't match anything despite the
# grep pre-check — e.g. transcript JSON-encoded its content), remove it.
if [ ! -s "$OUT_FILE" ]; then
  rm -f "$OUT_FILE" 2>/dev/null || true
  log_line "empty-output: removed $OUT_FILE (no extractable blocks)"
  exit 0
fi

BLOCKS=$(grep -c '^## Block ' "$OUT_FILE" 2>/dev/null || echo 0)
log_line "ok: wrote $OUT_FILE ($BLOCKS blocks)"

exit 0

# ----------------------------------------------------------------------------
# Setup
# ----------------------------------------------------------------------------
# To enable this hook, add a second entry to the Stop hooks array in
# .claude/settings.json:
#
#   "Stop": [
#     {
#       "matcher": "",
#       "hooks": [
#         { "type": "command", "command": "bash .claude/hooks/session-stop.sh", "timeout": 10, "async": true },
#         { "type": "command", "command": "bash .claude/hooks/agent-output-capture.sh", "timeout": 15, "async": true }
#       ]
#     }
#   ]
#
# Wiring the hook into settings.json is intentionally NOT done here — this PR
# adds the script + gitignore entry only, so existing installs are unaffected.
# Users opt in by editing their settings.json (or running /setup:hooks once
# that recipe lands).
