---
name: ai:prompt-design
description: Designs or reviews a system prompt for a Claude-powered feature. Covers system prompt architecture, few-shot examples, structured output schemas, tool definitions, agentic loop design, and persona/voice. Use when building or tuning any AI feature.
---

# /ai:prompt-design [feature]

Design a new system prompt from scratch, or review an existing one. Covers architecture, few-shot examples, structured output, tool definitions, agentic loops, and persona.

## Usage

```
/ai:prompt-design [feature]                  # design or review a prompt for a feature
/ai:prompt-design --scaffold "feature name" # generate a new prompt from scratch
/ai:prompt-design "review an existing prompt"
```

Examples:
```
/ai:prompt-design "CEFR placement test"
/ai:prompt-design "voice sales coach"
/ai:prompt-design --scaffold "customer support agent"
/ai:prompt-design "review an existing prompt"
/ai:prompt-design "agentic research assistant with tool use"
```

When reviewing an existing prompt: paste the prompt after the command, or reference a file path.

## Execution

```
[AGENT: ai-prompt-engineer] [COMMAND: design]
```

**Design mode** (`--scaffold` or new feature): The agent produces a complete system prompt with inline annotations explaining each design decision.

**Review mode** (existing prompt): The agent audits the prompt against all criteria below and produces annotated findings with suggested rewrites.

The agent applies the following framework:

**Prompt Architecture**
- Instruction ordering: persona → context → task → constraints → output format → examples
- Section clarity: can each section be read in isolation?
- Instruction density: is the prompt trying to do too many things at once?

**Persona and Voice**
- Is the persona specific enough to constrain tone? ("Be helpful" is not a persona. "You are a CEFR-certified language evaluator. You are precise, non-judgmental, and direct. You give scores without hedging.")
- Does the persona conflict with the task? (An "enthusiastic" persona on an evaluation task produces inflated scores.)
- Will the persona survive adversarial user inputs?

**Output Format**
- Is the expected output format defined explicitly? (JSON schema, markdown structure, length constraints)
- Does the format handle the error case? (What does the model output when it cannot complete the task?)
- Is structured output enforced via a JSON schema or tool call, or just requested in prose? (Prose requests are fragile.)

**Few-Shot Examples**
- Are examples representative of the actual input distribution?
- Do examples show the hardest cases, not just the easy ones?
- Do examples demonstrate the failure mode (what the model should NOT do)?

**Tool Definitions** (if applicable)
- Are tool descriptions specific enough that the model selects the right tool for each case?
- Are required vs. optional parameters clearly marked?
- Does the prompt define what to do when a tool call fails?

**Agentic Loop Design** (if applicable)
- Is the stopping condition explicit? (How does the agent know it's done?)
- Is the loop bounded? (Is there a max-turn or max-tool-call limit?)
- Does the prompt handle the case where the agent loops without making progress?

**Risk Factors**
- **Prompt injection**: can a user input override the system prompt?
- **Over-refusal**: will the model refuse benign inputs because of overly cautious constraints?
- **Hallucination vectors**: does the prompt ask for facts the model cannot verify?
- **Instruction conflict**: do any instructions contradict each other?

## Output Format

```
[AGENT: ai-prompt-engineer] [COMMAND: design]
Feature: <feature name>
Mode: <scaffold | review>

---

### Prompt

[Complete system prompt — ready to use]

---

### Design Rationale

#### Architecture
[Why the prompt is structured this way. Cite specific sections.]

#### Persona
[Why this persona was chosen. What it constrains. What it allows.]

#### Output Format
[Why this output format. What it handles. What it doesn't.]

#### Few-Shot Examples
[What the examples demonstrate. What edge case each one covers.]

---

### Risk Assessment

| Risk | Severity | Mitigation in This Prompt |
|------|----------|--------------------------|
| Prompt injection | [H/M/L] | [how it's addressed, or "not addressed — recommended fix"] |
| Over-refusal     | [H/M/L] | ... |
| Hallucination    | [H/M/L] | ... |
| Instruction conflict | [H/M/L] | ... |

### Identified Risks (unmitigated)
- [ ] **[Risk title]** — [what could go wrong]
  Fix: [specific prompt change that addresses this risk]

---

### Suggested Improvements (review mode only)

For each section of the reviewed prompt:

#### [Section name]
Current: "[quoted text from the reviewed prompt]"
Issue: [what is weak or wrong about it]
Suggested: "[replacement text]"
Rationale: [why this change improves the prompt]

---

### Summary
[One paragraph: the prompt's overall quality, the most important risk, and the single highest-leverage change.]
```

## Design Standards

- **Produce a complete prompt**: in scaffold mode, output a prompt that can be used immediately. Skeleton prompts ("you should include instructions here") are not outputs.
- **Annotate every design decision**: the design rationale section must explain *why* each section is written as it is. If the rationale is obvious, it's still worth stating for the next engineer who modifies the prompt.
- **Distinguish fragile prose from enforced structure**: structured output requested in prose is always flagged. Recommend a JSON schema or tool call with a schema wherever output format matters.
- **Never soften risk findings**: if a prompt has a prompt injection vector, say so directly. "This prompt may be susceptible to override" is not an honest risk assessment.
- **Review mode must quote**: every finding in review mode must quote the specific text it is critiquing. "The persona is weak" is not actionable. The quoted sentence + a replacement is.
