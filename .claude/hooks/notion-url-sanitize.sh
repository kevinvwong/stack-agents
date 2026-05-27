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

# Flatten the entire tool_input to a string so we catch URLs anywhere in the
# payload (Source property, body blocks, page references, etc.).
payload=$(echo "$input" | jq -r '.tool_input | tostring' 2>/dev/null)

if [ -z "$payload" ]; then
  exit 0
fi

# Pattern: URL query param with a credential-looking name and a non-empty
# value. Anchored with ? or & to avoid matching JSON property names.
CRED_RE='[?&](token|access[_-]?token|refresh[_-]?token|api[_-]?key|client[_-]?secret|password|secret|signature|sig|auth|x-amz-signature)=[^&"]+'

if echo "$payload" | grep -qiE "$CRED_RE"; then
  matches=$(echo "$payload" | grep -oiE "$CRED_RE" | sort -u | head -3)
  echo "" >&2
  echo "Blocked: Notion publish payload contains a URL with credential params." >&2
  echo "" >&2
  echo "Detected (showing up to 3):" >&2
  while IFS= read -r m; do
    # Mask the value half so the credential isn't echoed.
    key=$(echo "$m" | sed -E 's/=.*$//')
    echo "  $key=***REDACTED***" >&2
  done <<< "$matches"
  echo "" >&2
  echo "Sanitize the Source URL (strip those query params) and retry." >&2
  echo "See agents/notion-publisher.md → sanitizeSourceUrl." >&2
  exit 2
fi

exit 0
