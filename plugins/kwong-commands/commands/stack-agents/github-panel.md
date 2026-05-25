---
name: panel:github
description: Run all 5 GitHub agents as a panel — each reviews the same repository from their domain (governance, CI/CD, issues, PRs, releases, docs), then produces a cross-domain synthesis that surfaces gaps and conflicts no single agent would catch alone. Use for new repo setup reviews, repo health checks, and pre-open-source checklists.
---

# /panel:github

Convene all 5 GitHub agents as a panel. Each agent reviews the repository from their domain's perspective, then a synthesis pass identifies cross-domain gaps and conflicts.

## Usage

```
/panel:github                         # full review of the repo's GitHub configuration
/panel:github [focus]                 # focus the panel on a specific concern
```

Examples:
```
/panel:github
/panel:github "we're about to open-source this repo"
/panel:github "our contributor experience is poor — diagnose it"
/panel:github "prepare this repo for a v1.0 release"
/panel:github "review before onboarding a new team"
```

This is distinct from running `/audit` per agent: `/panel:github` is a **coordinated review**, not just parallel findings. Later agents see earlier findings. The synthesis section surfaces where domains conflict — which is where the real decisions live.

## Execution Order

Run agents in strict dependency order. Each agent sees the same repository and the full output of earlier agents before responding.

```
1. [AGENT: gh-repo]     — repo settings, branch protection, CODEOWNERS, Dependabot, templates
2. [AGENT: gh-actions]  — workflow security, caching, permissions, CI structure
3. [AGENT: gh-issues]   — label taxonomy, issue templates, triage workflow, Projects
4. [AGENT: gh-prs]      — PR templates, review rules, auto-merge, size labeling
5. [AGENT: gh-releases] — semver, changelog, release automation, tag conventions
6. [AGENT: gh-docs]     — README, CONTRIBUTING, API docs, ADRs, runbooks
```

## Output Format

```
[COMMAND: panel:github]
Repository: <org/repo or description of what is being reviewed>

---

[AGENT: gh-repo] [COMMAND: audit]
Domain lens: branch protection, CODEOWNERS, Dependabot, secret scanning, community health

### Critical
...
### High
...
### Medium
...
### Low
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: gh-actions] [COMMAND: audit]
Domain lens: workflow triggers, permissions, action pinning, secrets, caching, job structure

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: gh-issues] [COMMAND: audit]
Domain lens: label taxonomy, issue templates, triage workflow, milestones, Projects v2

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: gh-prs] [COMMAND: audit]
Domain lens: PR templates, review rules, auto-merge, size labeling, review culture

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: gh-releases] [COMMAND: audit]
Domain lens: semver discipline, changelog, GitHub Releases, tag conventions, release automation

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: gh-docs] [COMMAND: audit]
Domain lens: README, CONTRIBUTING, SECURITY.md, API docs, ADRs, runbooks

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

## Cross-domain Findings

Findings that reveal a conflict or gap *between* domains. Each cites the agents involved. These are the findings that would be missed if agents worked in isolation.

### Critical
- [ ] **[Finding title]** — [agents: X + Y]
  Gap: [what each domain expects that the other doesn't deliver]
  Fix: [specific remediation that touches both domains]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Panel Verdict

One-paragraph summary: the most important action this repo needs to take, and what each domain's stake in it is. If preparing to open-source, state whether the repo is ready.

---

## Rollup

| Agent | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| gh-repo | | | | |
| gh-actions | | | | |
| gh-issues | | | | |
| gh-prs | | | | |
| gh-releases | | | | |
| gh-docs | | | | |
| **cross-domain** | | | | |
| **Total** | | | | |

Top 3 actions to take before proceeding:
1. [action + which domains it unblocks]
2. [action + which domains it unblocks]
3. [action + which domains it unblocks]

→ HANDOFF TO [notion]: publish this audit to the GitHub audits database via `/notion:publish github-audit <owner/repo>` (or `pr:<number>` if scoped to a PR)
```

## Cross-domain Check Patterns

Look for these classes of conflict after all agents have run:

**Repo ↔ Actions mismatch** (`gh-repo` + `gh-actions`)
- Branch protection requires status checks that don't exist in any workflow
- Required status check names don't match job names in CI workflows
- Dependabot is configured in `.github/dependabot.yml` but no auto-merge workflow exists

**Actions ↔ Releases gap** (`gh-actions` + `gh-releases`)
- Release workflow exists but no tag push triggers it
- CI required checks don't include the build step needed before release artifacts
- Release workflow creates GitHub Release but doesn't close the milestone

**Issues ↔ PRs mismatch** (`gh-issues` + `gh-prs`)
- Issue template auto-applies `status:triage` but no triage workflow exists to process it
- PR template asks for `Closes #` but issues have no labels that map to PR categories
- Stale issue automation closes issues that have linked open PRs

**PRs ↔ Repo gap** (`gh-prs` + `gh-repo`)
- PR auto-merge enabled but branch protection doesn't require all status checks to pass
- CODEOWNERS defines reviewers but branch protection doesn't require code owner review
- Squash merge set as the only strategy but PR descriptions don't survive the squash (no template)

**Releases ↔ Issues gap** (`gh-releases` + `gh-issues`)
- Releases reference milestones that don't exist in the issue tracker
- CHANGELOG updated manually but no milestone is closed when a release ships
- `Unreleased` section in CHANGELOG has items that were never in any milestone

**Docs ↔ Any domain gap** (`gh-docs` + any agent)
- CONTRIBUTING.md describes a setup process that doesn't match current CI requirements
- README CI badge points to a workflow that was renamed or deleted
- SECURITY.md exists but no secret scanning or vulnerability alert routing is configured
- ADRs reference architecture that contradicts current Drizzle schema or infra config
- Release runbook in docs/ is out of date with the automated release workflow

**Actions ↔ Docs gap** (`gh-actions` + `gh-docs`)
- CI runs axe-core accessibility checks but results aren't referenced in CONTRIBUTING.md
- Stale workflow references outdated action versions that are pinned in CI to different SHAs
- No runbook for "CI is broken" despite complex multi-job workflow

## Panel Standards

- **Each agent speaks from their domain.** `gh-docs` does not file branch protection bugs; `gh-repo` does not file changelog gaps. Cross-domain findings go in the synthesis section only.
- **Cross-domain findings require a fix.** Unlike single-agent findings (which just need a fix in their domain), cross-domain findings are coordination decisions — they need a specific remediation that addresses both sides.
- **Later agents reference earlier findings.** `gh-docs` may cite `gh-releases`'s changelog finding when flagging a stale CHANGELOG. Make the chain explicit.
- **The Panel Verdict is mandatory.** Every `/panel:github` run ends with the one-paragraph verdict.
- **Don't manufacture findings.** If a domain is clean, say so. The rollup row shows zeros. Don't pad.
