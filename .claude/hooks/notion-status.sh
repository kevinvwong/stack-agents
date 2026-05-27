#!/usr/bin/env bash
# Notion session helpers — sourced by session-start.sh and session-close (via wrap-check).
#
# Two entry points:
#   notion_open_lines   — prints HDR:/OK:/WRN: lines for session-start briefing box
#   notion_close_lines  — prints publishable artifact paths detected in the session
#
# Both are silent no-ops when .notion/config.json is absent or NOTION_API_KEY is unset.

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CONFIG="$PROJECT_DIR/.notion/config.json"
NOTION_KEY="${NOTION_API_KEY:-}"

# Exit silently if not configured
[[ -f "$CONFIG" && -n "$NOTION_KEY" ]] || exit 0

# ── Notion API helper ──────────────────────────────────────────────────────────
_notion_api() {
  local method="$1"; shift
  local path="$1"; shift
  curl -s -X "$method" \
    "https://api.notion.com/v1${path}" \
    -H "Authorization: Bearer $NOTION_KEY" \
    -H "Notion-Version: 2022-06-28" \
    -H "Content-Type: application/json" \
    "$@"
}

# ── Database ID lookup from config ────────────────────────────────────────────
_db_id() {
  local key="$1"
  node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync('$CONFIG','utf8'));
      console.log((c.databases['$key']||{}).id||'');
    } catch(e) { console.log(''); }
  " 2>/dev/null
}

# ── notion_open_lines ─────────────────────────────────────────────────────────
# Emits HDR:/OK:/WRN: lines for the session-start briefing box.
# Shows: workspace title, last_verified, N recently updated pages.
notion_open_lines() {
  local workspace_title last_verified stale_days=14 now ts diff_days

  workspace_title=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync('$CONFIG','utf8'));
      console.log(c.parent.title||'Notion workspace');
    } catch(e) { console.log('Notion workspace'); }
  " 2>/dev/null)

  last_verified=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync('$CONFIG','utf8'));
      console.log(c.last_verified||'');
    } catch(e) { console.log(''); }
  " 2>/dev/null)

  now=$(date +%s)
  if [ -n "$last_verified" ]; then
    # Parse ISO date → epoch (portable: node)
    ts=$(node -e "console.log(Math.floor(new Date('$last_verified').getTime()/1000))" 2>/dev/null || echo "$now")
    diff_days=$(( (now - ts) / 86400 ))
  else
    diff_days=0
  fi

  echo "HDR:NOTION"

  # Workspace status line
  if [ "$diff_days" -ge "$stale_days" ]; then
    echo "WRN:${workspace_title} — last verified ${diff_days}d ago (run /notion:bootstrap to refresh)"
  else
    echo "OK:${workspace_title} — ${#} databases configured"
    # Re-read DB count
    local db_count
    db_count=$(node -e "
      try {
        const c = JSON.parse(require('fs').readFileSync('$CONFIG','utf8'));
        console.log(Object.keys(c.databases||{}).length);
      } catch(e) { console.log(0); }
    " 2>/dev/null)
    echo "OK:${workspace_title} — ${db_count} databases configured"
  fi

  # Query runbooks DB for recently edited pages (last 3)
  local runbooks_db
  runbooks_db=$(_db_id "runbooks")
  if [ -n "$runbooks_db" ]; then
    local recent_runbooks
    recent_runbooks=$(_notion_api POST "/databases/${runbooks_db}/query" \
      -d '{"sorts":[{"timestamp":"last_edited_time","direction":"descending"}],"page_size":3}' \
      2>/dev/null \
      | node -e "
        let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
          try {
            const r=JSON.parse(d);
            const pages=(r.results||[]);
            pages.forEach(p=>{
              const title=((p.properties?.Name?.title||[])[0]?.plain_text)||'Untitled';
              const ago=new Date(p.last_edited_time);
              const days=Math.floor((Date.now()-ago)/86400000);
              const when=days===0?'today':days===1?'yesterday':days+'d ago';
              console.log('runbook: '+title+' ('+when+')');
            });
          } catch(e){}
        });
      " 2>/dev/null) || recent_runbooks=""
    if [ -n "$recent_runbooks" ]; then
      while IFS= read -r line; do [ -n "$line" ] && echo "OK:  $line"; done <<< "$recent_runbooks"
    fi
  fi

  # Check PRDs DB for any flagged/stale entries
  local prds_db
  prds_db=$(_db_id "prds")
  if [ -n "$prds_db" ]; then
    local stale_prd_count
    stale_prd_count=$(_notion_api POST "/databases/${prds_db}/query" \
      -d "{\"filter\":{\"and\":[{\"property\":\"Status\",\"status\":{\"does_not_equal\":\"Archived\"}},{\"timestamp\":\"last_edited_time\",\"last_edited_time\":{\"before\":\"$(date -d '30 days ago' '+%Y-%m-%d' 2>/dev/null || date -v-30d '+%Y-%m-%d' 2>/dev/null || date +%Y-%m-%d)\"}}]},\"page_size\":1}" \
      2>/dev/null \
      | node -e "
        let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
          try { const r=JSON.parse(d); console.log((r.results||[]).length > 0 ? 'stale' : ''); }
          catch(e) { console.log(''); }
        });
      " 2>/dev/null) || stale_prd_count=""
    if [ "$stale_prd_count" = "stale" ]; then
      echo "WRN:PRDs database has entries not updated in 30+ days — consider /notion:audit"
    fi
  fi
}

# ── notion_close_lines ────────────────────────────────────────────────────────
# Emits NOTION_PUBLISH: lines listing files touched in this session that can be
# published to Notion. The session-close command reads these and prompts the user.
#
# Detects:
#   docs/runbooks/*.md   → runbook
#   docs/prds/*.md       → prd
#   docs/adr/*.md        → runbook (ADRs publish as runbooks)
#   agents/*.md          → skipped (agent sync hook handles these)
notion_close_lines() {
  # Files changed vs origin/main (covers staged + committed but not yet in main)
  local changed_files
  changed_files=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null || true)

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

  # Always emit the summary line so session-close can decide whether to show the section
  echo "NOTION_FOUND:$found"
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
CMD="${1:-}"
case "$CMD" in
  open)  notion_open_lines ;;
  close) notion_close_lines ;;
  *)
    echo "Usage: notion-status.sh open|close" >&2
    exit 1
    ;;
esac
