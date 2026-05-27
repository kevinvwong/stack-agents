#!/usr/bin/env bash
# .claude/hooks/notion-url-sanitize.sh
#
# PreToolUse hook for Notion write MCP tools (notion-create-pages,
# notion-update-page). Inspects the payload for URLs containing credential
# query params and blocks the call before any data lands in Notion.
#
# Belt-and-suspenders for notion-publisher's sanitizeSourceUrl logic. Cheap
# to run (~5ms), and the cost of a leaked credential persisted as a Notion
# property is high.

set -uo pipefail

input=$(cat)

# Extract only string values that look like URLs (start with http:// or
# https://). This avoids false positives on markdown body content that
# *describes* credential patterns (e.g. "don't pass `?token=...`").
urls=$(echo "$input" | jq -r '.tool_input | .. | strings | select(test("^https?://"))' 2>/dev/null)

if [ -z "$urls" ]; then
  exit 0
fi

# Pattern: URL query param with a credential-looking name and a non-empty
# value. Anchored with ? or & so we only match query-string position.
CRED_RE='[?&](token|access[_-]?token|refresh[_-]?token|api[_-]?key|client[_-]?secret|password|secret|signature|sig|auth|x-amz-signature)=[^&"#[:space:]]+'

if echo "$urls" | grep -qiE "$CRED_RE"; then
  matches=$(echo "$urls" | grep -oiE "$CRED_RE" | sort -u | head -3)
  echo "" >&2
  echo "Blocked: Notion publish payload contains a URL property with credential params." >&2
  echo "" >&2
  echo "Detected (param names only — values redacted):" >&2
  while IFS= read -r m; do
    key=$(echo "$m" | sed -E 's/=.*$//')
    echo "  $key=***REDACTED***" >&2
  done <<< "$matches"
  echo "" >&2
  echo "Sanitize the offending URL (strip those query params) and retry." >&2
  echo "See agents/notion-publisher.md → sanitizeSourceUrl." >&2
  exit 2
fi

exit 0
