Session close checkpoint. Checks git state against origin and surfaces a summary before exit.

Run this command and report the results:

```bash
bash .claude/hooks/wrap-check.sh
```

Parse the structured output and render a graphical box using Unicode box-drawing characters and glyphs. Use this exact visual language:

- Box border: `┌─ TITLE ─...─┐` / `│` / `└─...─┘`, inner width 72 chars
- Normal item: `│  · <text>` padded to inner width + `│`
- Warning/flag: `│  ▲ <text>` padded to inner width + `│`
- Section header: blank row then `│  SECTION NAME` row
- Blank separator row: `│` + 72 spaces + `│`

---

## If STATUS=CLEAN

Render a box titled `SESSION:CLOSE · <branch> · <date>` with:

- **SYNC** section:
  - If PUSHED=true: `· clean — pushed to origin`
  - If PUSHED=false: `▲ clean — <AHEAD> commit(s) NOT pushed to <UPSTREAM>`

Then below the box, if PUSHED=false ask: **"Push to origin, or exit without pushing?"**
- On PUSH: run `git push` and confirm exit-safe.
- On EXIT: note that next session open will flag the unpushed commits.

If PUSHED=true: one sentence confirming safe to exit. No question.

---

## If STATUS=DIRTY

Render a box titled `SESSION:CLOSE · <branch> · <date>` with these sections:

**SYNC**
- `· branch: <BRANCH>  ahead: <AHEAD>  behind: <BEHIND>`
- If BEHIND > 0: `▲ origin has moved — pull before committing`
- If AHEAD > 0: `▲ <AHEAD> commit(s) not yet pushed`

**WORK FILES** (lines prefixed `WORK` in script output)
- One row per file with porcelain status code: `· <XY> <filepath>`

**ARTIFACTS** (lines prefixed `ARTIFACT`) — if any exist, one compact row:
- `· <N> artifact(s) — ignored (reports, xml, worktrees)`

**COMMIT MESSAGE**
Read the `---DIFF---` section. Write a real, specific commit message for the WORK files.
Show it as a verbatim block inside the box (truncated to fit if long):
- `· <subject line>`
- `· Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

Then below the box, ask:

**"Commit, stash, push, or exit?"**

- **COMMIT**: immediately `git add` the WORK files and commit with the draft message — no follow-up questions. Then re-check AHEAD and offer push if needed.
- **STASH**: run `git stash` and confirm exit-safe.
- **PUSH**: if already committed (AHEAD > 0, STATUS=CLEAN), run `git push` and confirm exit-safe.
- **EXIT**: note that next session open will flag the uncommitted/unpushed state.

Do not exit or close anything yourself — wait for the user's response.

Commit style: imperative, lowercase, no period.
```
<subject line>

<body only if changes are non-obvious>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Notion publish step (runs after git is clean + pushed)

After the git state is clean and pushed, run:

```bash
bash .claude/hooks/notion-status.sh close
```

Parse the output lines:

- Lines starting `NOTION_PUBLISH:<type>:<path>` — one per publishable file
- Line starting `NOTION_FOUND:` — `1` if any publishables exist, `0` if none

**If `NOTION_FOUND:0`** — skip this section entirely. Do not mention Notion.

**If `NOTION_FOUND:1`** — render a **NOTION** section below the git box:

```
┌─ NOTION · <N> publishable artifact(s) ─────────────────────────────────┐
│                                                                          │
│  PUBLISH CANDIDATES                                                      │
│  · runbook  docs/runbooks/release-process.md                            │
│  · prd      docs/prds/voice-onboarding.md                               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

Then ask: **"Publish to Notion, skip, or pick individual files?"**

- **PUBLISH ALL**: run `/notion:publish <type> <path>` for each candidate in sequence. Report the Notion page URL for each after publishing.
- **SKIP**: note that files can be published later with `/notion:publish`.
- **PICK**: list each candidate with a Y/N choice; run publish only for confirmed ones.

If `.notion/config.json` is absent or `NOTION_API_KEY` is unset, skip this section silently.
