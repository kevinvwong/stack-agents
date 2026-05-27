#!/usr/bin/env bash
# Session briefing: last session state + sync + resume + recently changed + memory + PRs + CI

set -uo pipefail
# Note: -e omitted intentionally — git upstream probes exit nonzero when no remote is configured,
# and we want silent fallback rather than a blank briefing.

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

# Box renderer via Node — handles multi-byte Unicode correctly
# Total visible width: 74 (┌ + 72 inner + ┐)
INNER=72

box() {
  node -e "
const INNER = 72;
const pad = (s, n) => { const len = [...s].length; return s + ' '.repeat(Math.max(0, n - len)); };
const trunc = (s, n) => {
  const chars = [...s];
  if (chars.length <= n) return s;
  // word-boundary truncation: back up to last space before limit
  let cut = n - 1;
  while (cut > 0 && chars[cut] !== ' ') cut--;
  if (cut === 0) cut = n - 1; // no space found, hard cut
  return chars.slice(0, cut).join('').trimEnd() + '…';
};
let data = '';
process.stdin.on('data', d => data += d);
process.stdin.on('end', () => {
  for (const raw of data.split('\n')) {
    if (raw.startsWith('TOP:')) {
      const label = raw.slice(4);
      const used = 2 + [...label].length + 1;
      const dashes = INNER - used;
      process.stdout.write('┌─ ' + label + ' ' + '─'.repeat(Math.max(1, dashes)) + '┐\n');
    } else if (raw === 'BOTTOM') {
      process.stdout.write('└' + '─'.repeat(INNER) + '┘\n');
    } else if (raw === 'BLANK') {
      process.stdout.write('│' + ' '.repeat(INNER) + '│\n');
    } else if (raw.startsWith('HDR:')) {
      const label = raw.slice(4);
      process.stdout.write('│' + ' '.repeat(INNER) + '│\n');
      process.stdout.write('│  ' + pad(trunc(label, INNER - 2), INNER - 2) + '│\n');
    } else if (raw.startsWith('OK:')) {
      const text = trunc(raw.slice(3), INNER - 4);
      process.stdout.write('│  · ' + pad(text, INNER - 4) + '│\n');
    } else if (raw.startsWith('WRN:')) {
      const text = trunc(raw.slice(4), INNER - 4);
      process.stdout.write('│  ▲ ' + pad(text, INNER - 4) + '│\n');
    } else if (raw.startsWith('ROW:')) {
      const text = trunc(raw.slice(4), INNER - 2);
      process.stdout.write('│  ' + pad(text, INNER - 2) + '│\n');
    }
  }
});
"
}

# stat mtime — portable across Linux (stat -c) and macOS (stat -f)
stat_mtime() {
  stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null || echo 0
}

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
TITLE="STACK-AGENTS · $(date '+%Y-%m-%d %H:%M') · $BRANCH"

LINES=()
LINES+=("TOP:$TITLE")

# --- Last session state (written by /wrap) ---
STATE_FILE="$PROJECT_DIR/.claude/session-state.json"
if [ -f "$STATE_FILE" ]; then
  SESSION_LINE=$(node -e "
    try {
      const s = JSON.parse(require('fs').readFileSync('$STATE_FILE','utf8'));
      const clean = s.clean ? 'clean' : 'DIRTY';
      const sync  = s.pushed ? 'pushed' : s.ahead + ' commit(s) NOT pushed';
      console.log(s.closed_at + ' on ' + s.branch + ' — ' + clean + ', ' + sync);
      if (s.note && s.note !== 'null') console.log('NOTE:' + s.note.replace(/\"/g,''));
    } catch(e) {}
  " 2>/dev/null) || SESSION_LINE=""
  if [ -n "$SESSION_LINE" ]; then
    LINES+=("HDR:LAST SESSION")
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if [[ "$line" == NOTE:* ]]; then LINES+=("WRN:${line#NOTE:}")
      else LINES+=("OK:$line"); fi
    done <<< "$SESSION_LINE"
  fi
fi

# --- Fetch + sync check (skip if fetched < 5 min ago) ---
FETCH_HEAD="$PROJECT_DIR/.git/FETCH_HEAD"
FETCH_AGE=9999
if [ -f "$FETCH_HEAD" ]; then
  FETCH_MTIME=$(stat_mtime "$FETCH_HEAD")
  NOW=$(date +%s)
  FETCH_AGE=$(( NOW - FETCH_MTIME ))
fi
if [ "$FETCH_AGE" -gt 300 ]; then
  git fetch --quiet origin 2>/dev/null || true
fi

UPSTREAM=$(git rev-parse --abbrev-ref "@{upstream}" 2>/dev/null || echo "")
AHEAD=0; BEHIND=0
if [ -n "$UPSTREAM" ]; then
  AHEAD=$(git rev-list "@{upstream}..HEAD" --count 2>/dev/null || echo 0)
  BEHIND=$(git rev-list "HEAD..@{upstream}" --count 2>/dev/null || echo 0)
fi
DIRTY=$(git status --porcelain 2>/dev/null | { grep -v "^??" || true; } | wc -l | tr -d ' ')

SYNC_CONTENT=()
[ "$AHEAD" -gt 0 ] && SYNC_CONTENT+=("WRN:${AHEAD} commit(s) ahead — run /session:close to push")
[ "$BEHIND" -gt 0 ] && SYNC_CONTENT+=("WRN:${BEHIND} commit(s) behind origin — git pull")
[ "$DIRTY" -gt 0 ] && SYNC_CONTENT+=("WRN:${DIRTY} file(s) uncommitted — run /session:close to review")
if [ "${#SYNC_CONTENT[@]}" -gt 0 ]; then
  LINES+=("HDR:SYNC")
  LINES+=("${SYNC_CONTENT[@]}")
fi

# --- Resume context (suppress on main — CI section already shows last commit) ---
STASH_COUNT=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
if [ "$BRANCH" != "main" ] || [ "$STASH_COUNT" -gt 0 ]; then
  LAST_COMMIT=$(git log -1 --pretty=format:"%h %s (%cr)" 2>/dev/null) || LAST_COMMIT=""
  LINES+=("HDR:RESUME")
  [ -n "$LAST_COMMIT" ] && LINES+=("OK:$LAST_COMMIT")
  if [ "$STASH_COUNT" -gt 0 ]; then
    STASH_TOP=$(git stash list 2>/dev/null | head -1 | sed 's/stash@{[0-9]*}: //')
    LINES+=("WRN:${STASH_COUNT} stashed — ${STASH_TOP}")
  fi
fi

# --- Recently changed agents/commands (uses git log, no HEAD~N assumption) ---
RECENT_CONTENT=()
RECENT_AGENTS=$(git log --diff-filter=ACMR --name-only --format='' -n 10 2>/dev/null \
  | grep -E '^agents/|^commands/|^templates/' \
  | sort -u | head -6 || true)
while IFS= read -r line; do [ -n "$line" ] && RECENT_CONTENT+=("OK:$line"); done <<< "$RECENT_AGENTS"
if [ "${#RECENT_CONTENT[@]}" -gt 0 ]; then
  LINES+=("HDR:RECENTLY CHANGED")
  LINES+=("${RECENT_CONTENT[@]}")
fi

# --- Project memory entries (last 3 lines from MEMORY.md, project scope) ---
MEMORY_FILE="$HOME/.claude/projects/C--Users-kwong318-GitHub-stack-agents/memory/MEMORY.md"
if [ -f "$MEMORY_FILE" ]; then
  MEMORY_LINES=$(grep -E '^\- \[' "$MEMORY_FILE" | tail -3 2>/dev/null || true)
  if [ -n "$MEMORY_LINES" ]; then
    LINES+=("HDR:MEMORY")
    while IFS= read -r line; do
      # Strip markdown link syntax: "- [Title](file.md) — hook" → "Title — hook"
      clean=$(echo "$line" | sed 's/^- \[\([^]]*\)\]([^)]*) — /\1 — /')
      [ -n "$clean" ] && LINES+=("OK:$clean")
    done <<< "$MEMORY_LINES"
  fi
fi

# --- Notion workspace status (silent no-op if .notion/config.json absent or NOTION_API_KEY unset) ---
NOTION_LINES=$(bash "$PROJECT_DIR/.claude/hooks/notion-status.sh" open 2>/dev/null) || NOTION_LINES=""
if [ -n "$NOTION_LINES" ]; then
  while IFS= read -r line; do [ -n "$line" ] && LINES+=("$line"); done <<< "$NOTION_LINES"
fi

# --- Open PRs ---
MY_PRS=$(gh pr list \
  --author "@me" \
  --state open \
  --json number,title,reviewDecision \
  --jq '.[] | "PR #\(.number) \(.title)" + (if .reviewDecision != "" then " [\(.reviewDecision)]" else "" end)' \
  2>/dev/null) || MY_PRS=""
if [ -n "$MY_PRS" ]; then
  LINES+=("HDR:OPEN PRS")
  while IFS= read -r line; do [ -n "$line" ] && LINES+=("OK:$line"); done <<< "$MY_PRS"
fi

# --- CI on main ---
CI_STATUS=$(gh run list \
  --branch main \
  --limit 1 \
  --json status,conclusion,displayTitle \
  --jq '.[0] | (if .conclusion != null then .conclusion else .status end | ascii_upcase) + " — " + .displayTitle' \
  2>/dev/null) || CI_STATUS=""
if [ -n "$CI_STATUS" ]; then
  LINES+=("HDR:CI")
  if echo "$CI_STATUS" | grep -qiE "^(FAILURE|ERROR|CANCELLED)"; then
    LINES+=("WRN:$CI_STATUS")
  else
    LINES+=("OK:$CI_STATUS")
  fi
fi

LINES+=("BLANK")
LINES+=("BOTTOM")

echo ""
printf '%s\n' "${LINES[@]}" | box
echo ""
