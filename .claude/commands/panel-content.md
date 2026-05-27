---
name: panel:content
description: Run the four GTLI content pipeline agents as a panel — video-script, lesson, assessment, and QA — against the same module specification, then produce a full content package with a QA verdict. Use when generating language learning module content end-to-end.
---

# /panel:content

Convene all 4 GTLI content pipeline agents as a panel. Each agent generates its artifact from the same module specification, then the QA agent runs a structural and coherence audit across all three outputs and returns a verdict before publishing.

## Usage

```
/panel:content [module spec]
```

`module spec` describes the learning objective, CEFR level, topic, and section structure. If the module spec is incomplete (missing CEFR level or learning objective), ask for clarification before running.

Examples:
```
/panel:content "B1 English | Business emails | 3 sections: greeting, body, close | formal register"
/panel:content "A2 | Asking for directions | 2 sections"
/panel:content "C1 | Job interview responses | 4 sections"
```

This is distinct from running each agent individually: `/panel:content` is a **pipeline run**, not just parallel generation. Each agent receives the same module spec, and QA receives all three preceding outputs. The QA verdict determines whether the content package is ready to publish or requires remediation.

## Execution Order

Run agents in strict pipeline order. QA receives the full output of all three preceding agents.

```
1. [AGENT: video-script]  — narration JSON: script segments, speaker notes, timing cues
2. [AGENT: lesson]        — lesson content JSON: text content, examples, vocabulary, grammar notes
3. [AGENT: assessment]    — quiz items JSON: questions, answer choices, explanations, difficulty tags
4. [AGENT: qa]            — structural + coherence audit across all three outputs; pass/flag/fail verdict
```

## Output Format

```
[COMMAND: panel:content]
Module spec: <CEFR level | topic | sections | register>

---

[AGENT: video-script] [COMMAND: generate]
Pipeline stage: narration JSON

```json
{
  "module": "<topic>",
  "cefr_level": "<level>",
  "segments": [
    {
      "section": "<section name>",
      "script": "<narration text>",
      "speaker_notes": "<production notes>",
      "duration_estimate_seconds": 0
    }
  ]
}
```

---

[AGENT: lesson] [COMMAND: generate]
Pipeline stage: lesson content JSON

```json
{
  "module": "<topic>",
  "cefr_level": "<level>",
  "sections": [
    {
      "title": "<section title>",
      "body": "<instructional text>",
      "vocabulary": ["<word>"],
      "grammar_notes": "<grammar focus>",
      "examples": ["<example sentence>"]
    }
  ]
}
```

---

[AGENT: assessment] [COMMAND: generate]
Pipeline stage: quiz items JSON

```json
{
  "module": "<topic>",
  "cefr_level": "<level>",
  "items": [
    {
      "section": "<section name>",
      "question": "<question text>",
      "type": "multiple_choice | fill_in | true_false",
      "choices": ["<choice>"],
      "correct_answer": "<answer>",
      "explanation": "<why this answer is correct>",
      "difficulty": "A | B | C"
    }
  ]
}
```

---

[AGENT: qa] [COMMAND: audit]
Pipeline stage: cross-artifact structural + coherence audit

### Structural Checks
- [ ] video-script segment count matches section count in module spec
- [ ] lesson section count matches module spec
- [ ] assessment items cover every section
- [ ] All JSON is well-formed and complete

### Coherence Checks
- [ ] Vocabulary in lesson appears in assessment items
- [ ] Script narration does not contradict lesson body text
- [ ] Assessment difficulty distribution is appropriate for stated CEFR level
- [ ] Register (formal/informal) is consistent across all three artifacts

### Flags
List each flag with the artifact it affects and the specific field:
- FLAG [artifact: field] — <description of the issue>

### Verdict

**PASS** — Content package is complete and coherent. Ready to publish.
**FLAG** — Content package has non-blocking issues listed above. Publish after resolving flags.
**FAIL** — Content package has blocking issues. Do not publish until Critical items below are resolved.

#### Critical (blocking publish)
- [ ] ...

#### High (resolve before publish)
- [ ] ...

#### Low (nice-to-fix)
- [ ] ...

Summary: verdict=<PASS|FLAG|FAIL>, X critical, Y high, Z low
```

## Cross-artifact Check Patterns

Look for these classes of conflict after all agents have run:

**Script ↔ Lesson content mismatch** (`video-script` + `lesson`)
- Script introduces vocabulary that the lesson body never defines
- Narration uses a register (formal/informal) inconsistent with the lesson's register target
- Script segment count doesn't match the lesson's section count — timing gaps or orphaned narration

**Lesson ↔ Assessment alignment gap** (`lesson` + `assessment`)
- Assessment tests vocabulary or grammar not covered in the lesson body
- Assessment difficulty tags don't match the CEFR level stated in the module spec
- A lesson section has no corresponding assessment item — learning objective untested

**Script ↔ Assessment coherence** (`video-script` + `assessment`)
- Script presents a concept in a specific order that the assessment doesn't follow — cognitive load mismatch
- Script examples contradict the correct answers in assessment items

**CEFR level inconsistency** (all agents)
- Vocabulary complexity in any artifact exceeds or falls significantly below the stated CEFR band
- Sentence complexity in narration is incompatible with the target learner level
- Assessment items assume background knowledge not introduced at this CEFR level

**Completeness gap** (`qa` catch)
- Any of the three artifact JSON outputs is missing required fields
- Section referenced in one artifact is absent in another
- Module spec specified N sections but an artifact generated N±1

## Panel Standards

- **Each agent generates its own artifact.** `lesson` does not write assessment items; `video-script` does not write quiz explanations. Cross-artifact findings go in the QA section only.
- **QA sees all three outputs.** The `qa` agent must receive the complete JSON from `video-script`, `lesson`, and `assessment` before running its audit. Do not run QA with partial inputs.
- **The QA verdict is mandatory.** Every `/panel:content` run ends with an explicit PASS, FLAG, or FAIL verdict.
- **Don't publish on FAIL.** A FAIL verdict means at least one Critical blocking issue exists. Remediate and re-run before publishing.
- **If module spec is incomplete, stop and ask.** Missing CEFR level or missing learning objective are blocking inputs — do not generate placeholder content.

→ HANDOFF TO [notion-publisher]: publish this content package via `/notion:publish content <module-id>` once QA verdict is PASS or all FLAG items are resolved
