---
name: stack:audit
description: Run a structured code review across one or more stack layers. Routes to the appropriate agent(s) based on scope. Output is grouped by severity with checkboxes, findings, explanations, and recommended fixes.
---

# /audit [scope]

Run a structured review of existing code. Routes to the appropriate agent(s) based on scope.

## Usage

```
/audit                          # full-stack audit â€” all 7 agents
/audit auth                     # security agent only
/audit database schema          # data agent only
/audit API routes               # application agent only
/audit components               # presentation agent only
/audit AI pipeline              # ai-llm agent only
/audit CI/CD                    # infrastructure agent only
/audit logging                  # observability agent only
/audit auth database            # security + data agents
```

Supports `STACK:` override:
```
/audit auth STACK: auth=NextAuth
```

## Output Format

```
[AGENT: <name>] [COMMAND: audit]
Target: <what was reviewed>

### Critical
- [ ] **[Finding title]** â€” [file:line if known]
  Why it matters: [consequence if not fixed]
  Fix: [specific, actionable remediation]

### High
- [ ] ...

### Medium
- [ ] ...

### Low
- [ ] ...

Summary: X critical, Y high, Z medium, W low â€” estimated remediation effort: [S/M/L/XL]
```

For multi-agent audits, emit each agent's output in full before the next.

## Severity Definitions

| Severity | Definition |
|----------|-----------|
| **Critical** | Security vulnerability, data loss risk, or production-breaking issue |
| **High** | Performance degradation, reliability risk, or significant technical debt that will cause pain |
| **Medium** | Best practice violation with meaningful future cost |
| **Low** | Style, documentation, or minor optimization |

## Audit Standards

- **Be specific**: cite file paths and line numbers when known. "The webhook handler" is not actionable; `api/webhooks/clerk/route.ts:14` is.
- **Be honest**: if you cannot determine severity without seeing the code, say so. Do not pad with low-severity findings to appear thorough.
- **Be actionable**: every finding has a fix. "Consider improving error handling" is not a fix. "Wrap the Drizzle query on line 42 in try/catch and return `{ success: false, error: { code: 'DB_ERROR' } }`" is.
- **Don't repeat**: in multi-agent audits, if the data agent and security agent both notice missing RLS, only the data agent files it. Deduplication is the orchestrator's responsibility.
