# Local Machine Setup

How to get the stack-agents Notion integration working on a new machine, end to end.

Estimated time: 15 minutes for the one-time pieces, 2 minutes per additional repo.

---

## Prerequisites

| Requirement | Why | Check |
|-------------|-----|-------|
| **Node.js 18+** | Linter, hook scripts | `node --version` |
| **jq** | Hook scripts parse MCP payloads | `jq --version` |
| **git** | Everything is in git | `git --version` |
| **Claude Code** (CLI or desktop) | The agent harness | `claude --version` or the app |
| **A Notion workspace** | Publishing target | Free tier is fine |

Install missing pieces:
- macOS: `brew install node jq git`
- Linux (Debian/Ubuntu): `apt install nodejs npm jq git`
- Windows: `winget install jqlang.jq` (or `choco install jq` if Chocolatey is installed)
- Claude Code: https://docs.claude.com/en/docs/claude-code

---

## 1. Get the marketplace

Two options:

### Option A — Install via the kwong marketplace (recommended once published)

```
/plugin marketplace add kevinvwong/kwong-claude-marketplace
/plugin install kwong-stack-agents
/plugin install kwong-commands
```

### Option B — Clone the source repo directly

```
git clone https://github.com/kevinvwong/stack-agents.git ~/stack-agents
cd ~/stack-agents
```

**Windows** — run the installer (PowerShell 5.1+):
```powershell
.\install.ps1
```

This deploys four artifact types to `~/.claude/`:
- `CLAUDE.md` → `~/.claude/CLAUDE.md` (root orchestrator, loads in every session)
- Agents from `agents/` (canonical source, excluding `README.md` and `.deprecated/`) and `plugins/kwong-agents/agents/`
- Commands from `plugins/kwong-commands/commands/`
- Skills from `plugins/kwong-skills/skills/`

The installer is idempotent — it hash-checks every file and skips identical ones. Any file it would overwrite is backed up to `~/.claude/backups/<timestamp>/` first. Re-running it is safe: stale cleanup only removes agents the installer previously installed (tracked in `~/.claude/kwong-stack-agents.manifest`) that no longer exist in source. Foreign agents installed by other plugins or by hand are never touched.

**macOS / Linux** — copy CLAUDE.md manually:
```bash
cp ~/stack-agents/CLAUDE.md ~/.claude/CLAUDE.md
```

(Or symlink: `ln -s ~/stack-agents/CLAUDE.md ~/.claude/CLAUDE.md` — keeps you on the latest.)

---

## 2. Connect the Notion MCP server

The Notion integration runs through an MCP server. You configure this once per machine.

1. **Create a Notion integration**:
   - Go to https://www.notion.so/my-integrations
   - "New integration" → name it `Claude Code` → choose your workspace → save
   - Copy the **Internal Integration Secret** (`secret_...`)

2. **Add the MCP server to Claude Code**:
   In Claude Code settings (`~/.claude/settings.json` or the UI), add the Notion MCP server. The exact form depends on your Notion MCP server provider — common pattern:
   ```json
   {
     "mcpServers": {
       "notion": {
         "command": "npx",
         "args": ["-y", "@notionhq/notion-mcp-server"],
         "env": { "NOTION_TOKEN": "secret_..." }
       }
     }
   }
   ```
   Restart Claude Code so the MCP server loads.

3. **Verify**: in a Claude Code session, ask "who am I in Notion?" — the `notion-importer` agent should call `notion-get-users` and return your name. If it returns nothing, the token is wrong or the integration hasn't been added to any page yet (see step 4).

---

## 3. Install the user-scope hooks

These apply to every project automatically. Run once per machine:

```
/setup:hooks --add lint-references,notion-url-sanitize --scope user
```

What this installs:

| Path | What |
|------|------|
| `~/.claude/scripts/lint-references.mjs` | Reference linter (Node, no deps) |
| `~/.claude/hooks/lint-references-on-commit.sh` | PreToolUse on `git commit` |
| `~/.claude/hooks/notion-url-sanitize.sh` | PreToolUse on Notion writes |
| `~/.claude/settings.json` (merged) | Hook config wiring it together |

**Activation gotcha**: hooks added mid-session don't fire immediately. After installing, open `/hooks` in the Claude Code UI or restart the session. The hooks watcher only reloads on demand.

Test:
```
# In a stack-agents-style repo, intentionally break a reference:
echo '[AGENT: nonexistent-agent]' >> agents/notion-architect.md
git add agents/notion-architect.md
git commit -m "test"        # ← linter hook should block this

# Reset:
git checkout agents/notion-architect.md
```

---

## 3b. Project-scope hooks (pre-deployed in this repo)

If you're working within the `stack-agents` repo itself (not a downstream project), a second set of hooks is already pre-wired in `.claude/settings.json` at the repo level. These activate automatically when Claude Code runs from `stack-agents/`.

| Hook | Event | What it does |
|------|-------|--------------|
| `bash-guard.sh` | `PreToolUse / Bash` | Blocks destructive shell patterns (`rm -rf` unscoped, `git reset --hard`, `DROP TABLE`, etc.) |
| `format-on-write.sh` | `PostToolUse / Edit+Write` | Runs Prettier after every file write (async, no-op if Prettier absent) |
| `session-stop.sh` | `Stop` | Writes `.claude/session-state.json` with branch, SHA, clean/dirty status at end of every turn |
| `notify.sh` | `Notification` | Routes notifications to Slack (if `SLACK_BOT_TOKEN` set), BurntToast (Windows), or terminal bell |
| `session-start.sh` | `SessionStart` | Prints the session briefing box (SYNC warnings, CI status, recent changes) |

These are project-scope (`.claude/settings.json`), not user-scope — they only fire in this repo. To install the equivalent hooks for your own downstream project, run:

```
/setup:hooks --add format-on-write,bash-guard --scope project --target <your-repo>
```

**Activation gotcha**: hooks installed mid-session don't fire until the config reloads. Always open `/hooks` in the Claude Code UI or restart Claude Code after modifying `.claude/settings.json`.

---

## 4. Set up the Notion workspace

This is the one-time Notion-side setup.

1. **Create a parent page in Notion** for stack-agents output:
   - Open Notion, create a new page at the top level (or in a teamspace).
   - Name it something memorable — e.g. `Claude Code` or `Stack Agents`.
   - Copy the page URL (looks like `https://www.notion.so/<title>-<id>`).

2. **Share the page with your integration**:
   - In Notion, open the page → click `...` (top-right) → **Connections** → **Connect to** → pick your `Claude Code` integration.
   - Make sure it has **Edit** access. Without this, every write call returns 403.

3. **Save the URL somewhere you can find it** — README, pinned chat message, personal note. You'll paste it once per repo.

---

## 5. Bootstrap a repo

In any repo where you want to publish to Notion:

```
cd <repo>
/notion:bootstrap --parent <your-pinned-Notion-URL>
```

What this does:
1. Verifies access to the parent page.
2. Shows the ancestor path and asks you to confirm before any writes (guards against writing into the wrong workspace).
3. Creates the 8 canonical databases under your parent (Sprints, PRDs, Research, Analytics specs, GitHub audits, Quality audits, Game design docs, Runbooks). Skips any that already exist.
4. Writes `.notion/config.json` to the repo — this is the map every later command reads.
5. Verifies each database by re-fetching.

**Commit the config** so your team shares the same map:
```
git add .notion/config.json
git commit -m "Bootstrap Notion workspace map"
```

The config contains no secrets — just database IDs. Safe to commit.

---

## 6. Verify everything works

End-to-end sanity check:

```
# 1. Workspace audit — should report all 8 databases as clean.
/notion:audit

# 2. Publish a sample artifact. The runbook itself is a good test —
#    this republishes the canonical instructions:
/notion:publish runbook docs/SETUP.md

# 3. Check the linter is green.
node scripts/lint-references.mjs --root .
```

If all three succeed, the integration is live.

---

## 7. Daily use

See the **Quick start** section of the runbook at the top of this repo's Notion workspace (or the `Operating rules` section here):

- **PRDs**: draft in repo → `/panel:publish` → if READY → `/notion:publish prd`
- **Sprints**: `/sprint:assemble` → `/notion:publish sprint <slug>`
- **Panel audits**: run the panel → follow the handoff line
- **Reading from Notion**: `/notion:import <url> --as <type> --into <agent>`
- **Weekly**: `/notion:audit --propose-archives`

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Notion search returns nothing" | Integration not shared with any page | Open the parent page in Notion → Connections → add your integration |
| "Notion API 401" | `NOTION_TOKEN` wrong or missing in MCP server config | Re-paste the integration secret from notion.so/my-integrations |
| "Notion API 403 on write" | Integration has Read access only | In Notion → Connections → change to Edit access |
| `/notion:publish` says "database not found" | `.notion/config.json` missing or database renamed | Run `/notion:bootstrap` to refresh |
| `git commit` blocked: "broken refs" | Renamed an agent/command without updating references | `node scripts/lint-references.mjs --root .` shows each broken ref |
| Notion publish blocked: "credential params" | A URL property value contains `?token=` (or similar) | Strip the credential query param from the URL before retrying |
| Hooks don't fire after installing | Hook watcher hasn't reloaded | Open `/hooks` in Claude Code UI, or restart Claude Code |
| "no agents/ + commands/ found" from linter | Running outside an orchestration repo | This is expected — the linter no-ops silently. Not an error. |

---

## What's installed where

After completing this guide:

```
~/.claude/                                 # User scope — applies to every project
├── CLAUDE.md                              # Master orchestrator (from stack-agents)
├── kwong-stack-agents.manifest            # Installer's record of agent files it owns — drives stale cleanup
├── settings.json                          # User-scope hooks + MCP server config
│                                          #   mcpServers: notion, github, neon, sentry, slack
│                                          #   hooks: lint-references-on-commit, notion-url-sanitize
├── scripts/
│   └── lint-references.mjs                # User-scope linter
└── hooks/
    ├── lint-references-on-commit.sh       # PreToolUse / git commit — blocks broken refs
    └── notion-url-sanitize.sh             # PreToolUse / Notion MCP — strips credential params

stack-agents/                              # Project scope — stack-agents repo only
└── .claude/
    ├── settings.json                      # Project-scope hooks (pre-deployed, Phase 6)
    ├── hooks/
    │   ├── bash-guard.sh                  # PreToolUse / Bash — blocks destructive patterns
    │   ├── format-on-write.sh             # PostToolUse — Prettier after Edit/Write
    │   ├── session-start.sh               # SessionStart — briefing box
    │   ├── session-stop.sh                # Stop — writes session-state.json
    │   └── notify.sh                      # Notification — Slack / BurntToast / bell
    └── scheduled/
        ├── daily-ci-audit.sh              # Cron 08:00 — CI + Dependabot triage
        └── weekly-pr-health.sh            # Cron Mon 09:00 — stale PR triage

<each repo>/
└── .notion/
    └── config.json                        # Per-repo workspace map (Notion database IDs)
```

---

## Updating

To pull in marketplace updates:

```
# Plugin install:
/plugin update kwong-stack-agents
/plugin update kwong-commands

# Source clone — Windows:
cd ~/stack-agents && git pull
.\install.ps1
# install.ps1 handles CLAUDE.md, agents, commands, skills, and stale cleanup in one pass.
# Then refresh user-scope hook scripts:
/setup:hooks --add lint-references,notion-url-sanitize --scope user --force

# Source clone — macOS / Linux:
cd ~/stack-agents && git pull
cp CLAUDE.md ~/.claude/CLAUDE.md   # if not symlinked
/setup:hooks --add lint-references,notion-url-sanitize --scope user --force
```

The `--force` flag on `/setup:hooks` refreshes the user-scope scripts to the new version while preserving any local customizations.

---

## Where the canonical version lives

This file is the source of truth. The Notion runbook (published via `/notion:publish runbook`) is the discoverable mirror — its body is **replaced** on every publish, so don't edit it in Notion. Discuss in Notion comments; edit here.
