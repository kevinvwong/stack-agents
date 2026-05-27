---
name: review:artifact
description: Agent/skill/command quality gate before publishing to the marketplace. Evaluates whether the description is specific enough for auto-routing, whether the persona has genuine opinions, whether the audit checklist is actionable, and whether scaffold output would be production-ready. Use before publishing to the marketplace or before adding to ~/.claude/agents/.
---

# /review:artifact [file]

Quality gate for agent specs, skills, and command files before publishing to the marketplace or adding to `~/.claude/agents/`.

## Usage

```
/review:artifact [file]             # review a specific agent, skill, or command file
```

Examples:
```
/review:artifact agents/web-presentation.md
/review:artifact agents/new-agent.md
/review:artifact commands/review/review-code.md
/review:artifact skills/my-skill.md
```

## Execution

```
[AGENT: artifact-auditor] [COMMAND: review]
```

The agent evaluates the artifact against the following quality criteria:

**For Agent Files (`agents/*.md`)**

1. **Description specificity** — Is the description specific enough for the master orchestrator to auto-route to this agent without ambiguity? A description that overlaps with another agent's scope is a routing failure waiting to happen.

2. **Persona with genuine opinions** — Does the agent have a point of view? Can it push back? Agents that only describe their domain without stating their standards produce safe but useless output.

3. **Audit checklist actionability** — If the agent has an audit mode, are the checklist items concrete enough to produce a yes/no answer? "Check for security issues" fails. "Verify that all Clerk `clerkMiddleware()` calls in `middleware.ts` protect non-public routes" passes.

4. **Scaffold output quality** — If the agent has a scaffold mode, would the output be production-ready? Does it include error handling, TypeScript types, and environment variable wiring?

5. **Output format completeness** — Does the agent define a structured output format (severity tags, agent/command tags, handoff protocol)?

6. **Dependency chain awareness** — Does the agent know what it receives from upstream agents and what it hands off to downstream agents?

**For Command Files (`commands/**/*.md`)**

1. **Frontmatter completeness** — Is `name` and `description` present and correct? Is the description specific enough to appear usefully in `/help` output?

2. **Usage examples** — Are there at least 3 concrete usage examples covering the common cases?

3. **Output format definition** — Is the output format defined with enough structure that another agent could parse it?

4. **Agent routing** — Does the command clearly state which agent(s) it routes to?

5. **Edge case handling** — Does the command describe what happens when the scope is ambiguous, when no findings are present, or when the target doesn't exist?

**For Skill Files**

1. **Trigger conditions** — Are the trigger conditions specific enough to avoid false activations?

2. **Skill boundary** — Is the skill's scope narrow enough to be a skill rather than an agent? Skills do one thing; agents have opinions.

3. **Output contract** — Does the skill define what it returns so the invoking agent knows what to expect?

## Output Format

```
[AGENT: artifact-auditor] [COMMAND: review]
Artifact: <file path>
Type: <agent | command | skill>

### Criterion Results

| Criterion | Result | Notes |
|-----------|--------|-------|
| <criterion name> | PASS / FAIL / WARN | [specific issue if FAIL or WARN] |
| ...               | ...                | ...                              |

### Findings

#### Failing Criteria
- [ ] **[Criterion]** — [specific issue]
  Fix: [exact change needed — quote the problematic text and show the replacement]

#### Warnings
- [ ] **[Criterion]** — [concern]
  Suggestion: [improvement]

### Verdict

**PASS** — artifact meets all quality criteria. Ready to publish.
**FAIL** — artifact fails N criteria. Fix before publishing.

Blocking issues:
1. [issue + fix]
2. ...
```

## Quality Gate Standards

- **PASS requires all criteria to pass.** A single failing criterion blocks publish. Warnings do not block.
- **Quote the failing text.** "The description is vague" is not actionable. Quoting the exact sentence and showing a replacement is.
- **Don't manufacture failures.** If the artifact is well-formed, say so. A clean PASS is a valid and useful result.
- **Distinguish FAIL from WARN.** A FAIL means the artifact will cause a routing failure, produce useless output, or mislead the user. A WARN means it could be better.
- **Check for agent name collisions.** Before passing an agent file, verify that the agent name does not conflict with an existing agent in `agents/`. If it does, it is a FAIL.
