---
name: agents:train
description: Self-audit an agent and propose a spec diff to improve it. Runs the agent's own /audit on itself, cross-references inbound handoffs, checks MCP tool currency, and emits a unified diff for user review. On apply, bumps the Notion Last upskilled date.
---

# /agents:train

Convene the `agent-lifecycle` meta-agent to train an existing agent — surface drift in its own spec, propose a corrective diff, and (on user approval) apply the diff and update the Notion `Last upskilled` date.

This is the alternative to `/agents:fire` for an underperforming agent. Train first; fire only if training reveals no gap to close.

## Usage

```
/agents:train <name> [--apply] [--scope <list>]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `<name>` | Yes | Active agent slug to train. Must have `agents/<name>.md`. |
| `--apply` | No | Apply the proposed diff after user confirms. Without this flag, the command is advisory — it prints the diff and exits. |
| `--scope <list>` | No | Comma-separated subset to audit. Default: all. Valid: `coherence,references,tool-currency,handoffs,structure`. |

## Behavior

1. **Load the agent spec** — read `agents/<name>.md`. If the file is in `agents/.deprecated/`, fail with "agent is deprecated — `/agents:hire` to rehire, or restore the file manually first."
2. **Run self-audit (coherence)** — check the spec's internal consistency:
   - Frontmatter `name:` matches the filename slug
   - Persona paragraph uses `[AGENT: <name>]` tag
   - All standard sections present (`Stack`, `Opinions`, `/audit`, `/scaffold`, `/advise`, `Handoffs`)
   - Opinions section has at least 3 opinions
   - `/audit` section has at least one checklist
   - `/scaffold` has output format spec
3. **Cross-reference (references)** — scan inbound `[AGENT: <name>]` references in all other `agents/*.md` and `commands/**/*.md` files. For each handoff target that names this agent, check this agent's own `Handoffs` section acknowledges the handoff direction. Surface mismatches.
4. **Tool currency** — for every MCP tool name referenced in `Stack` or anywhere in the body (matching `notion-*`, `mcp__*`, etc.), check that the tool exists in the current MCP surface. Tools that no longer exist → flag for removal.
5. **Structural drift** — compare the file's section order and depth against `templates/agent-template.md`. Surface sections that exist in the template but are missing here (and vice versa, when this agent should remove something that's no longer canonical).
6. **Propose a unified diff** — emit a `diff -u` style patch with reasoning per hunk. The diff must apply cleanly: `git apply --check <patch>` succeeds.
7. **Confirmation** — without `--apply`, exit after printing the diff. With `--apply`, prompt for confirmation and then `git apply` the patch.
8. **Update Notion** — on successful apply, set the agent's `Last upskilled` property to today. (The PostToolUse sync hook from `templates/hooks/agents-sync-to-notion.json` will fire too, but this command sets `Last upskilled` explicitly so it's not just `Last edited`.)

## Output Format

```
[AGENT: agent-lifecycle] [COMMAND: train]
Training: <name>
Scope:    <scopes audited>

Self-audit findings:

  Coherence (<N>):
  - [ ] Frontmatter description is too generic ("does X stuff")
  - [ ] Persona paragraph missing [AGENT: <name>] tag

  References (<N>):
  - [ ] gh-prs hands off "release readiness" to this agent; not acknowledged in Handoffs
  - [ ] [AGENT: foo] referenced in body but foo is deprecated; rewrite to foo's replacement

  Tool currency (<N>):
  - [ ] References `notion-old-tool` which no longer exists in MCP surface; remove or replace

  Structure (<N>):
  - [ ] Missing "Versioning" section (added in template v1.0.0)

Proposed spec diff:

  --- a/agents/<name>.md
  +++ b/agents/<name>.md
  @@ -3,1 +3,1 @@
  -description: does X stuff
  +description: <specific, route-able description>
  @@ -7,1 +7,1 @@
  -You are an X agent.
  +[AGENT: <name>]
  +
  +You are an X agent who...
  @@ ...

  Reasoning per hunk:
  - Hunk 1: description was too generic; orchestrator couldn't route on it
  - Hunk 2: persona missing [AGENT:] tag — breaks output-format convention
  - ...

git apply --check: PASS

Apply? [y/N] (only with --apply)

On apply:
  ✓ Patch applied: agents/<name>.md (<N> lines changed)
  ✓ Notion `Last upskilled` set to <ISO date>
  ✓ Reference lint: OK

Staged:
  M  agents/<name>.md

Next:
  - Review the applied diff
  - Commit: git commit -m "agents: train <name>"
  - Re-run /agents:train <name> after a quarter to catch new drift
```

## Acceptance criteria

- [ ] Self-audit produces structured findings grouped by Coherence / References / Tool currency / Structure
- [ ] Proposed diff is unified-diff format and applies cleanly (`git apply --check` succeeds)
- [ ] Without `--apply`, command is advisory only (prints diff, no mutations)
- [ ] With `--apply`, requires interactive confirmation before `git apply`
- [ ] On successful apply, Notion `Last upskilled` is set to today
- [ ] Refuses to train a deprecated agent; refuses to train a file missing required structure (suggests `/agents:hire` instead)

## When Not to Use This

- The agent is functionally redundant with another — use `/agents:combine A B --into C` instead.
- The agent has zero usage and zero inbound refs — `/agents:fire` is the right call; training won't fix a missing job.
- You're adding a new opinion or checklist item — just edit `agents/<name>.md` directly; the agents-sync-to-notion hook will mirror the change to Notion. `/agents:train` is for surfacing drift you didn't know about.

Source: PLAN.md Phase 8b · Owned by `[AGENT: agent-lifecycle]`
