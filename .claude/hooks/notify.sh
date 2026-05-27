#!/usr/bin/env bash
# Notification hook — surface Claude Code notifications as a Windows toast
# or terminal bell fallback.
#
# Reads notification data from stdin (Claude Code hook protocol).
# Runs async — must not block Claude's response.
#
# Priority order:
#   1. BurntToast PowerShell module (rich Windows toast with title + body)
#   2. Windows msg.exe (simple popup — works without BurntToast)
#   3. Terminal bell (\\a — universal fallback)
#
# The hook always exits 0 — a notification failure must never block work.

set -uo pipefail

INPUT=$(cat)

# --- Extract message from hook JSON ---
MESSAGE=$(echo "$INPUT" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try {
      const o = JSON.parse(d);
      // Notification hook provides: { message: string }
      process.stdout.write(o?.message || o?.tool_input?.message || 'Claude Code needs your attention');
    } catch { process.stdout.write('Claude Code needs your attention'); }
  });
" 2>/dev/null || echo "Claude Code needs your attention")

TITLE="Claude Code"

# Truncate long messages for toast display
SHORT_MSG=$(echo "$MESSAGE" | head -c 200)

# --- Try Slack (async, non-blocking) ---
if [ -n "${SLACK_BOT_TOKEN:-}" ] && [ -n "${SLACK_CHANNEL:-#claude-code}" ]; then
  curl -s -X POST https://slack.com/api/chat.postMessage \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"channel\":\"${SLACK_CHANNEL:-#claude-code}\",\"text\":\"*${TITLE}*\n${SHORT_MSG}\"}" \
    &>/dev/null &
fi

# --- Try BurntToast (richest experience) ---
if powershell.exe -NonInteractive -Command "Get-Module -ListAvailable -Name BurntToast" &>/dev/null 2>&1; then
  powershell.exe -NonInteractive -Command "
    Import-Module BurntToast -ErrorAction SilentlyContinue
    New-BurntToastNotification -Text '${TITLE}', '${SHORT_MSG}' -ErrorAction SilentlyContinue
  " &>/dev/null 2>&1 &
  exit 0
fi

# --- Fallback: Windows toast via PowerShell Windows.UI.Notifications ---
powershell.exe -NonInteractive -Command "
  try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
    \$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
    \$xml.GetElementsByTagName('text')[0].AppendChild(\$xml.CreateTextNode('${TITLE}')) | Out-Null
    \$xml.GetElementsByTagName('text')[1].AppendChild(\$xml.CreateTextNode('${SHORT_MSG}')) | Out-Null
    \$toast = [Windows.UI.Notifications.ToastNotification]::new(\$xml)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Claude Code').Show(\$toast)
  } catch {}
" &>/dev/null 2>&1 &

# --- Final fallback: terminal bell ---
printf '\a' 2>/dev/null || true

exit 0
