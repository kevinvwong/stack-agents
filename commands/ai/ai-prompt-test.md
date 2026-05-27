---
name: ai:prompt-test
description: Designs a regression test suite for a system prompt or AI feature. Produces input/expected-output pairs, identifies behaviors most likely to regress on a specific change, and flags cases where two prompt versions produce divergent output. Works with any Claude API prompt.
---

# /ai:prompt-test [prompt]

Design a regression test suite for a system prompt or AI feature. Produces test cases, regression risk matrix, and divergence analysis between prompt versions.

## Usage

```
/ai:prompt-test [prompt]                    # design a test suite for a prompt or feature description
/ai:prompt-test --compare v1 v2            # diff two prompt versions and surface divergent cases
/ai:prompt-test --focus "tone consistency" # focus the test suite on a specific behavior
```

Examples:
```
/ai:prompt-test "voice sales coach system prompt"
/ai:prompt-test "CEFR placement test evaluator"
/ai:prompt-test --compare prompts/v1.txt prompts/v2.txt
/ai:prompt-test "customer support agent" --focus "escalation handling"
/ai:prompt-test --compare v1 v2 --focus "response length"
```

## Execution

```
[AGENT: prompt-regression] [COMMAND: test]
```

The agent designs the test suite by analyzing the prompt for the following dimensions:

**Behavior Inventory**
- Explicit behaviors: things the prompt says to do or not do
- Implicit behaviors: tone, persona, response length, structured output format
- Boundary behaviors: how the prompt handles edge cases (off-topic inputs, adversarial prompts, ambiguous requests)
- Conditional behaviors: instructions that apply only in certain contexts (user role, conversation state, prior messages)

**Regression Risk Assessment**
- Which behaviors are most fragile to prompt wording changes
- Which behaviors depend on instruction ordering (prompt position effects)
- Which behaviors conflict with the model's default tendencies (most likely to regress silently)

**Divergence Analysis (--compare mode)**
- Cases where v1 and v2 are likely to produce different output
- Cases where the difference is intentional vs. a regression
- Behaviors present in v1 that may have been accidentally removed in v2

## Output Format

```
[AGENT: prompt-regression] [COMMAND: test]
Prompt/Feature: <name or description>
Mode: <suite | compare | focused>

### Test Suite

#### Behavior Category: <category name>

**TC-001: [Test case title]**
- Input: [exact user message or scenario]
- Expected behavior: [what the model should do — be specific about format, tone, content]
- Failure mode: [what a regression would look like — be specific]
- Regression risk: [High | Medium | Low] — [one-line rationale]

**TC-002: [Test case title]**
...

[Repeat per behavior category]

### Regression Risk Matrix

| Test Case | Behavior | Risk | Why It's Fragile |
|-----------|----------|------|-----------------|
| TC-001    | ...      | High | ...             |
| TC-002    | ...      | Med  | ...             |
| ...       | ...      | ...  | ...             |

### Divergence Report (--compare mode only)

| Test Case | v1 Expected | v2 Expected | Likely Intentional? | Action |
|-----------|-------------|-------------|---------------------|--------|
| TC-001    | ...         | ...         | Yes / No / Unknown  | [confirm or revert] |
| ...       | ...         | ...         | ...                 | ...    |

### High-Priority Tests
The 3 test cases most likely to catch a real regression in this prompt:
1. TC-XXX — [why this is the most important test]
2. TC-XXX — [why]
3. TC-XXX — [why]

### Summary
N test cases across M behavior categories
High-risk regressions: N
Recommended minimum test set for CI: [list TC IDs]
```

## Test Design Standards

- **Test cases must be runnable**: every test case must include an exact input that can be copied into the Claude API. "Test the tone" is not a test case. "Input: 'I want to cancel my subscription.' Expected: empathetic acknowledgment before asking for reason" is.
- **Failure modes must be specific**: describe what the regression looks like, not just that it failed. "Model becomes too formal" is not specific. "Model responds with 'Certainly! I would be delighted to assist you' instead of a first-person casual opener" is.
- **Regression risk rationale must be honest**: if a behavior is inherently stable (e.g., formatting a JSON object), say Low risk and move on. Don't inflate risk to appear thorough.
- **--compare mode requires both versions**: if the files are not provided, ask for them before producing divergence analysis.
- **Prompt injection cases are always included**: every test suite includes at least one adversarial input that attempts to override the system prompt, ignore instructions, or extract the prompt itself.
