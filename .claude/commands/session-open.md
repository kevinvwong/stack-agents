Session open briefing. Runs the startup script and renders the session briefing box on demand.

Run this command and report the results:

```bash
bash .claude/hooks/session-start.sh
```

Display the output exactly as rendered — do not reformat or summarize it.

---

## Notion workspace status (if NOTION_CONFIGURED appears in output)

If the briefing output contains a line `· NOTION_CONFIGURED`, the workspace is configured. After rendering the briefing box, query Notion for live status using MCP tools:

1. Read `.notion/config.json` to get the `runbooks` and `prds` database IDs.
2. Call `notion-query-database` on the `runbooks` database — sort by `last_edited_time` descending, limit 3 — and extract page titles + last-edited dates.
3. Call `notion-query-database` on the `prds` database — filter `Status != Archived`, sort by `last_edited_time` ascending, limit 1 — to detect stale PRDs (not edited in 30+ days).

Then append a second box directly below the briefing box:

```
┌─ NOTION · <workspace title> ───────────────────────────────────────────┐
│                                                                         │
│  RUNBOOKS (recent)                                                      │
│  · <title> — <N days ago / today / yesterday>                           │
│  · <title> — <N days ago>                                               │
│  · <title> — <N days ago>                                               │
│                                                                         │
│  PRDs                                                                   │
│  · <N> active — <oldest title> last updated <N>d ago                   │  ← only if stale
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

- If no runbooks exist yet: show `· no runbooks published yet`
- If no stale PRDs: omit the PRDs section entirely
- If the MCP query fails: omit the NOTION box silently — never error

Do not show `NOTION_CONFIGURED` in the rendered output — it is a signal only.

---

## Closing statement

After all boxes are rendered, in one sentence state the most pressing thing to address based on what the briefing showed (SYNC warnings, CI failure, stale Notion content, or memory context). If everything is clean, say so and ask what to work on.
