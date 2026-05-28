# Getting started

By the end of this walkthrough you'll have run an audit, convened a panel, assembled a sprint, and published to Notion. Plan on about 15 minutes. Every step shows the literal command, a representative snippet of what comes back, and one line on what just happened — so you can skim, copy, and keep going.

---

## Prereqs

Full install lives in [`docs/SETUP.md`](https://github.com/kevinvwong/stack-agents/blob/main/docs/SETUP.md). The essentials:

- **Claude Code installed** and the master orchestrator on your path (clone the repo and symlink `CLAUDE.md` to `~/.claude/CLAUDE.md`, or install via the `kwong-stack-agents` marketplace).
- **Notion MCP server configured** with an integration token (only needed for Step 4 — the first three steps work without Notion).
- **A repo to point at** — any Next.js or game project will do; the examples below assume `../my-app`.

If any of those aren't in place, finish [`docs/SETUP.md`](https://github.com/kevinvwong/stack-agents/blob/main/docs/SETUP.md) first and come back.

---

## Step 1: Your first command

Pick a layer of your stack and audit it. We'll start with the data layer because it returns the most concrete findings on a typical Next.js + Postgres app.

```
cd ../my-app
/stack:audit data
```

Expected output (abridged):

```
[AGENT: data] [COMMAND: audit]
Target: db/schema/, db/migrations/, db/client.ts

### Critical
- [ ] **No RLS on `documents` table** — db/schema/documents.ts:14
  Why it matters: multi-tenant data is filtered in application code only;
  a missing `where` clause leaks across orgs.
  Fix: enable RLS on `documents` and add a policy keyed on `org_id`.
    Hand off to security agent for the policy itself.

### High
- [ ] **Missing index on `documents.owner_id`** — db/schema/documents.ts:21
  Why it matters: foreign key with no index. Every JOIN does a seq scan
  once the table passes ~10k rows.
  Fix: add `.references(() => users.id).index()` to the column.

- [ ] **Migration 0007 drops a NOT NULL column without backfill**
        — db/migrations/0007_drop_legacy_slug.sql:3
  Why it matters: in-flight inserts during deploy will 500 until the new
  column lands.
  Fix: split into expand/contract — add nullable column, backfill,
  flip NOT NULL, drop legacy in a later migration.

### Medium
- [ ] **`updated_at` not auto-maintained on `documents`** — ...
### Low
- [ ] **Naming: `doc_type` vs `documentType` mismatch** — ...

Summary: 1 critical, 2 high, 1 medium, 1 low — estimated remediation effort: M

→ HANDOFF TO security: RLS policies needed for `documents` table
```

What happened: the master orchestrator routed the request to the **`data`** agent, which ran its checklist (schema, migration safety, query patterns, RLS, backups) against your repo and emitted findings grouped by severity. Every other `/stack:audit` scope works the same way — swap `data` for `auth`, `components`, `CI/CD`, etc.

---

## Step 2: Your first panel

A panel convenes a whole agent family on the same artifact. Each agent reviews from their own domain, then a synthesis pass catches cross-domain gaps that no single agent would file.

```
/panel:github
```

Expected output (shape only — the real thing is long):

```
[COMMAND: panel:github]
Repository: my-org/my-app

---

[AGENT: gh-repo] [COMMAND: audit]
Domain lens: branch protection, CODEOWNERS, Dependabot, secret scanning
### Critical
- [ ] **No branch protection on `main`** — anyone with push can force-push.
### High
- [ ] **CODEOWNERS missing** — review assignment is manual.
Summary: 1 critical, 1 high, 2 medium, 0 low

---

[AGENT: gh-actions] [COMMAND: audit]
Domain lens: workflow triggers, permissions, action pinning, secrets
### High
- [ ] **Actions not pinned by SHA** — supply-chain risk on third-party actions.
Summary: 0 critical, 1 high, 1 medium, 0 low

---

[AGENT: gh-issues] [COMMAND: audit]
Domain lens: label taxonomy, issue templates, triage workflow, milestones
### Medium
- [ ] **No `bug` / `feat` / `chore` label taxonomy** — issues get one-off labels per author.
- [ ] **No issue templates in `.github/ISSUE_TEMPLATE/`** — repro steps land inconsistently.
Summary: 0 critical, 0 high, 2 medium, 1 low

---

[AGENT: gh-prs] [COMMAND: audit]
Domain lens: PR templates, review rules, auto-merge, size labeling
### High
- [ ] **No `CODEOWNERS`-driven required reviewers** — anyone in the org can self-approve.
### Medium
- [ ] **No PR template in `.github/pull_request_template.md`** — descriptions drift in quality.
Summary: 0 critical, 1 high, 1 medium, 0 low

---

[AGENT: gh-releases] [COMMAND: audit]
Domain lens: semver, changelog, GitHub Releases, tag conventions
### Medium
- [ ] **No `CHANGELOG.md`** — release notes are only in tag bodies; consumers can't diff.
- [ ] **Tag pattern is inconsistent** — `v1.0.0` and `release-1.0.0` both present.
Summary: 0 critical, 0 high, 2 medium, 0 low

---

[AGENT: gh-docs] [COMMAND: audit]
Domain lens: README, CONTRIBUTING, SECURITY.md, ADRs, runbooks
### High
- [ ] **No `SECURITY.md`** — vulnerability reports have no defined channel.
### Medium
- [ ] **README missing Quick Start** — first-run experience is a scavenger hunt.
Summary: 0 critical, 1 high, 1 medium, 1 low

---

## Cross-domain Findings

### Critical
- [ ] **Branch protection requires `ci/build` status check that no workflow emits**
        — [agents: gh-repo + gh-actions]
  Gap: gh-repo expects a check named `ci/build`; gh-actions ships
  `build-and-test`. Every PR is blocked.
  Fix: rename the job in `.github/workflows/ci.yml` OR update the
  required check name in branch protection. Choose one and align both.

### High
- [ ] **CONTRIBUTING.md references a setup script that CI no longer runs**
        — [agents: gh-docs + gh-actions]
  ...

---

## Panel Verdict

The repo is one step away from green: align the required status check name
across `gh-repo` and `gh-actions`, then ship branch protection. Issues, PRs,
releases, and docs are in acceptable shape for a small team but will need
templates before open-sourcing.

## Rollup
| Agent           | Critical | High | Medium | Low |
| --------------- | -------- | ---- | ------ | --- |
| gh-repo         | 1        | 1    | 2      | 0   |
| gh-actions      | 0        | 1    | 1      | 0   |
| gh-issues       | 0        | 0    | 2      | 1   |
| gh-prs          | 0        | 1    | 1      | 0   |
| gh-releases     | 0        | 0    | 2      | 0   |
| gh-docs         | 0        | 1    | 1      | 1   |
| cross-domain    | 1        | 1    | 0      | 0   |
| **Total**       | 2        | 5    | 9      | 2   |

→ HANDOFF TO notion-publisher: publish via /notion:publish github-audit my-org/my-app
```

**Why panels matter:** single-agent audits give you depth; panels surface the _seams_ between domains — the kinds of issues that exist because two systems disagree about a contract neither of them owns. The `branch-protection-name-mismatch` finding above never shows up in any single agent's audit. That's the panel's job.

Other family panels follow the same pattern — `/panel:quality`, `/panel:research`, `/panel:game`, `/panel:notion`, `/panel:stack`. Cross-cutting panels target specific gates: `/panel:security`, `/panel:design`, `/panel:ai-feature`, `/panel:launch`, `/panel:knowledge`, `/panel:publish`. GTLI-specific panels: `/panel:gtli-ux`, `/panel:gtli-jgcc`, `/panel:gtli-sim`. Full catalog in `commands/README.md`.

---

## Step 3: Your first sprint

A sprint is a custom agent team assembled for a specific goal in a specific project. The assembler proposes a roster from the agent pool, generates any missing agents, and installs a scoped orchestrator into the target project.

```
/sprint:assemble "build the auth flow" --project ../my-app
```

Expected output (abridged):

```
[AGENT: meta-sprint-assembler] [COMMAND: scaffold]
Sprint: auth-flow
Goal: build the auth flow
Duration: 2w
Target: ../my-app

Roster (5 agents):
  1. security      — Clerk wire-up, RBAC, rate limiting on auth routes
  2. data          — users / sessions / orgs schema, RLS scaffolding
  3. application   — sign-in/callback/webhook Edge Functions
  4. presentation  — sign-in UI, protected route boundaries
  5. web-qa        — Playwright auth E2E + flake triage

Dependency chain:
  data → security → application → presentation → web-qa

Files written:
  sprints/auth-flow/roster.md         — agents + goal + dependency chain
  sprints/auth-flow/panel.md          — /panel:sprint:auth-flow definition
  sprints/auth-flow/orchestrator.md   — source for SPRINT.md
  ../my-app/.claude/SPRINT.md         — installed orchestrator
  sprints/registry.json               — appended with this sprint's entry

Panel command: /panel:sprint:auth-flow
Run this in ../my-app to activate the sprint team.
```

What lands in the **target project**:

```
../my-app/
  .claude/
    SPRINT.md       # scoped orchestrator — activates in every Claude session
                    # in this project; only routes to the 5 sprint agents
```

What lands in **stack-agents**:

```
sprints/
  auth-flow/
    roster.md       # agent list, goal, duration, dependency chain
    panel.md        # /panel:sprint:auth-flow command for this team
    orchestrator.md # source template for the installed SPRINT.md
  registry.json     # appended — status: active, started: 2026-05-27
```

The new `/panel:sprint:auth-flow` command convenes just the five roster agents on whatever artifact you point them at — same shape as `/panel:github`, scoped to your sprint.

Other sprint commands: `/sprint:list`, `/sprint:status` (run from inside the target project), `/sprint:dissolve`.

---

## Step 4: Your first Notion publish

Wire Notion to the repo once, then publish artifacts on demand. Both steps are idempotent.

```
/notion:bootstrap --parent https://www.notion.so/acme/Claude-Code-abc123
```

Expected output (abridged):

```
[AGENT: notion-architect] [COMMAND: scaffold]
Bootstrap: workspace setup + config

Parent
  Title: Claude Code
  URL:   https://www.notion.so/acme/Claude-Code-abc123
  Path:  Acme > Engineering > Claude Code
  Confirm this is the correct location before proceeding.  [y/N]

Plan
  create  Sprints
  create  PRDs
  create  Research
  create  Analytics specs
  create  GitHub audits
  create  Quality audits
  create  Game design docs
  create  Runbooks

Created 8 databases.

Config written:
  ../my-app/.notion/config.json  (8 databases mapped)

Next:
  /notion:publish sprint auth-flow
  /notion:audit
  Commit .notion/config.json so the team shares the same map.
```

Now publish the sprint you just assembled:

```
/notion:publish sprint auth-flow
```

Expected output:

```
[AGENT: notion-publisher] [COMMAND: scaffold]
Type:     sprint
Source:   https://github.com/my-org/stack-agents/tree/main/sprints/auth-flow
Database: Sprints   (id: 98f9b840-..., from .notion/config.json)

Upsert lookup: no existing row with Source = <above> → create.

Created:
  Title:      auth-flow
  URL:        https://www.notion.so/acme/auth-flow-de4f...
  Properties: Goal, Status=Active, Duration=2w, Project, Agents, Started
  Body:       9 blocks (callout, roster, dependency chain, blockers, decisions log)

Verified: title + properties + 9 body blocks present.
Action: create
```

Run the same command again — the publisher finds the existing page by `Source` URL, updates it in place, and reports `Action: update`. That's the point: you can re-run `/notion:publish` any time, and the page stays a single, evolving record instead of becoming a pile of duplicates.

**Source URL discipline:** the `Source` property is the idempotency key. Every artifact you publish needs a stable URL — a `tree/main/...` path, a PR URL, a commit URL. The publisher will refuse URLs containing credentials (`token=`, `access_token=`, etc.) and strip non-allowlisted query params before writing. Keep your sources clean and re-publishing stays safe.

---

## What to learn next

- **Concepts** — the four primitives (agents, panels, sprints, Notion publishing): `docs/concepts.md`
- **Agent catalog** — every agent, what it owns, when to call it: `agents/README.md`
- **Command catalog** — every slash command grouped by surface: `commands/README.md`
- **Runbooks** — repeatable procedures for the recurring rituals (sprint kickoff, Notion publish cycle, branch protection bypass): `docs/runbooks/`
- **Changelog** — released history of every marketplace version: `CHANGELOG.md`

Once you're past these, the master orchestrator (`CLAUDE.md`) is the routing reference — keep it open whenever you're unsure which agent owns a question.
