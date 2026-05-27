# Runbook: Sprint kickoff

How to start a new phase or major feature of work.

## Trigger

- A new phase has been decided (e.g. Phase 8)
- A feature warrants its own tracked body of work (>3 issues, multiple agents, >1 week)

## Steps

1. **Append the phase block to `PLAN.md`**. Use the existing phase format:
   - `## 🔲 Phase N — <name>` header
   - Sub-phase tables with `| Item | What | Issue |` columns
   - Issue numbers left as `#N` placeholders until step 2

2. **Create GitHub issues, one per work item** via `mcp__github__issue_write` (or `gh issue create` if local):
   - Title: short, action-oriented
   - Body: What / Acceptance criteria / Why / cross-refs to other issues
   - Labels: `phase-N` + domain (`notion`, `agents`, `security`, etc.)
   - Order matters — issue numbers should match the PLAN.md table

3. **Backfill the issue numbers in `PLAN.md`** if they shifted from your placeholder.

4. **Publish the phase as a Sprint row in Notion** via direct MCP (until `/notion:publish sprint` ships) or the future command:
   - Database: `Sprints` (data_source `16770389-a353-417b-b288-8d85adcf989d`)
   - `Status`: `Planned` if work hasn't started, `Active` if it has
   - `Project`: relation → stack-agents
   - `Agents`: relation → each agent involved
   - `Source`: `https://github.com/<org>/<repo>/blob/main/PLAN.md`
   - `content`: roster, dependency chain, issues table, top-N to start, decisions log

5. **Commit + push**:
   ```
   git add PLAN.md
   git commit -m "plan: Phase N — <name>"
   git push origin main
   ```

6. **(Optional) Open a tracking PR** if the phase involves significant repo changes. For pure planning, direct push to main is fine (the plan is metadata).

## Common mistakes

- **Forgetting to bump issue numbers.** GitHub auto-increments; if a Dependabot PR slipped in between, your `#37, #38, ...` plan won't match the actual issues. Always create issues first, then backfill PLAN.md.
- **Skipping the Notion sprint row.** The dogfooding rule: every phase exists in the Sprints database from kickoff. Without it, governance has no record.
- **Setting `Status = Active` immediately for a sprint where work hasn't started.** Use `Planned` until the first issue is in progress.

## See also

- `docs/SETUP.md` — local setup
- `agents/meta-sprint-assembler.md` — agent that automates this for project-level sprints
- `PLAN.md` — the canonical plan
