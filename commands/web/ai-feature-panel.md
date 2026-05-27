---
name: panel:ai-feature
description: Run three AI-layer agents as a panel — ai-llm (Claude API integration, streaming, voice pipeline), ai-prompt-engineer (system prompt design, structured output, few-shot), and web-application (API routes, webhooks, background jobs) — against the same AI feature, then produce a cross-layer synthesis. Use when designing or auditing any AI-powered feature.
---

# /panel:ai-feature

Convene the three AI-layer agents as a panel. Each agent reviews the same feature from their layer's perspective, then a synthesis pass identifies cross-layer gaps and coordination decisions that no single agent would catch alone.

## Usage

```
/panel:ai-feature [feature]
/panel:ai-feature [feature] STACK: ai=OpenAI
/panel:ai-feature [feature] STACK: tts=ElevenLabs
```

Examples:
```
/panel:ai-feature "voice sales coach"
/panel:ai-feature "CEFR placement test"
/panel:ai-feature "streaming chat with tool use"
/panel:ai-feature "structured data extraction from documents"
/panel:ai-feature "real-time transcription with feedback" STACK: stt=Deepgram
```

This is distinct from running `/audit` per agent: `/panel:ai-feature` is a **coordinated design review**, not just parallel findings. Later agents see earlier findings. The synthesis section surfaces where AI integration decisions in one layer create constraints or failures in another — which is where the real implementation decisions live.

**Stack override:** `STACK: ai=<provider>` or `STACK: tts=<provider>` or `STACK: stt=<provider>` substitutes the specified provider's guidance throughout. Valid values: `ai=OpenAI | ai=Claude | tts=ElevenLabs | stt=Deepgram`. Overrides apply only to the current request.

**Agent locations:**
- `web-ai-llm` — `agents/web-ai-llm.md` (repo)
- `ai-prompt-engineer` — `~/.claude/agents/` (marketplace)
- `web-application` — `agents/web-application.md` (repo)

## Execution Order

Run agents in strict dependency order. Each agent sees the same feature description and the full output of earlier agents before responding.

```
1. [AGENT: web-ai-llm]          — Claude API integration, streaming, voice pipeline, cost controls
2. [AGENT: ai-prompt-engineer]  — system prompt design, structured output, few-shot examples, safety
3. [AGENT: web-application]     — API routes, webhooks, background jobs, error handling, streaming transport
```

## Output Format

```
[COMMAND: panel:ai-feature]
Feature: <feature name or description>
Stack overrides: <none, or STACK: key=value pairs>

---

[AGENT: web-ai-llm] [COMMAND: audit]
Layer lens: Claude API usage, streaming config, voice pipeline (ElevenLabs/Deepgram), token cost controls

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

[AGENT: ai-prompt-engineer] [COMMAND: audit]
Layer lens: system prompt architecture, structured output schema, few-shot design, safety constraints, prompt injection surface

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

[AGENT: web-application] [COMMAND: audit]
Layer lens: API route structure, streaming transport, webhook handlers, background job design, error propagation, timeout handling

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

## Cross-layer Findings

Findings that reveal a conflict or gap *between* layers. Each cites the agents involved. These are the findings that would be missed if agents worked in isolation.

### Critical
- [ ] **[Finding title]** — [agents: X + Y]
  Chain: [how the gap propagates across layers]
  Fix: [specific remediation that touches both layers]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Panel Verdict

One-paragraph summary: the most important implementation decision this AI feature needs to make, and what each layer's stake in it is. If this is an audit of an existing feature, state whether it is ready to ship.

---

## Rollup

| Agent | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| web-ai-llm | | | | |
| ai-prompt-engineer | | | | |
| web-application | | | | |
| **cross-layer** | | | | |
| **Total** | | | | |

Top 3 actions to take before proceeding:
1. [action + which layers it unblocks]
2. [action + which layers it unblocks]
3. [action + which layers it unblocks]

→ HANDOFF TO [web-observability]: wire AI call logging so every Claude/ElevenLabs/Deepgram invocation is captured via `logAiCall` before shipping
→ HANDOFF TO [notion-publisher]: publish this AI feature audit via `/notion:publish quality-audit <feature-name>`
```

## Cross-layer Check Patterns

Look for these classes of conflict after all three agents have run:

**Prompt architecture ↔ API cost** (`ai-prompt-engineer` + `web-ai-llm`)
- System prompt is unbounded in length — no caching strategy means full token cost on every call
- Few-shot examples in the prompt are large; prompt caching breakpoint not set correctly
- Structured output schema uses `required` fields that inflate response tokens unnecessarily
- `max_tokens` not set — runaway generation possible on malformed inputs

**Streaming ↔ Application error handling** (`web-ai-llm` + `web-application`)
- `stream: true` used in the AI layer but the API route returns a non-streaming `Response` — client hangs
- Streaming errors (mid-stream API failure) not caught before the transport layer closes the connection
- Voice pipeline (ElevenLabs TTS) returns audio chunks but application route has no chunked response handler
- Timeout set too short for streaming responses — Edge Function terminates mid-generation

**Structured output ↔ API route parsing** (`ai-prompt-engineer` + `web-application`)
- Prompt engineer specifies a JSON schema but the API route parses `response.content[0].text` with `JSON.parse` without a try/catch
- Structured output schema version mismatch between what the prompt defines and what the application type expects
- `tool_use` blocks in the response not handled by the route — only `text` blocks parsed

**Tool use ↔ Application webhooks** (`web-ai-llm` + `web-application`)
- Feature uses `tools` / function calling but no webhook or background job handler exists for tool results
- Tool call loop (model calls tool → result returned → model continues) has no iteration cap — infinite loop risk
- Tool execution is synchronous in the route handler — long-running tools block the Edge Function

**Prompt injection surface ↔ Input validation** (`ai-prompt-engineer` + `web-application`)
- User-supplied text is interpolated directly into the system prompt without sanitization
- API route accepts arbitrary `system` override via request body — caller can hijack model behavior
- No content policy check before user input reaches the prompt — policy violation returned to the client

**Cost controls ↔ Rate limiting** (`web-ai-llm` + `web-application`)
- No per-user token budget enforced — a single user can exhaust the API allowance
- Rate limit is enforced at the application layer but AI calls are also made from a background job with no separate limit
- ElevenLabs or Deepgram calls not counted in the cost model — billing blind spot

**Voice pipeline sequencing** (`web-ai-llm` + `web-application`)
- STT (Deepgram) → Claude → TTS (ElevenLabs) pipeline has no error boundary between stages — a Deepgram failure throws an unhandled rejection in the Claude stage
- Audio blob from ElevenLabs stored in Vercel Blob but URL not returned to client before function timeout
- Voice pipeline invoked on every keystroke due to missing debounce in the application route

## Panel Standards

- **Each agent speaks from their layer.** `web-ai-llm` does not file API route structure bugs; `web-application` does not file prompt design issues. Cross-layer findings go in the synthesis section only.
- **Cross-layer findings require a fix.** Unlike single-layer findings, cross-layer findings are coordination decisions — they need a specific remediation that addresses both sides.
- **Later agents reference earlier findings.** `web-application` may cite `web-ai-llm`'s streaming config finding when flagging timeout handling. Make the chain explicit.
- **The Panel Verdict is mandatory.** Every `/panel:ai-feature` run ends with the one-paragraph verdict.
- **Don't manufacture findings.** If a layer is clean, say so. The rollup row shows zeros. Don't pad.
- **STACK: override applies to all agents.** If `STACK: ai=OpenAI` is set, every agent substitutes OpenAI SDK guidance for Anthropic SDK guidance throughout their section.
