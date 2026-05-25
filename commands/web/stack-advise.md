---
name: advise
description: Get an architectural recommendation on a specific question. Routes to the appropriate agent, leads with a clear recommendation, then provides reasoning, tradeoffs, alternatives considered, and a concrete next step.
---

# /advise [question]

Get an architectural recommendation. Routes to the appropriate agent based on the question domain.

## Usage

```
/advise should I use RLS or application-level auth checks?
/advise Drizzle vs Prisma for this project
/advise how should I structure multi-turn Claude conversations?
/advise should this be an Edge Function or a serverless function?
/advise how do I handle AI API outages gracefully?
/advise when should I use Typesense vs Postgres full-text search?
/advise monorepo or separate repos for frontend and backend?
```

Supports `STACK:` override:
```
/advise Drizzle vs Prisma STACK: database=Supabase
```

## Output Format

```
[AGENT: <name>] [COMMAND: advise]

## Recommendation
[Lead with the answer. One clear sentence. "Use X" or "Do Y" — not "It depends" as the opening.]

## Reasoning
[Why this recommendation is right for this stack and context. 2–4 paragraphs.]

## Tradeoffs
✅ [Advantage 1]
✅ [Advantage 2]
⚠️  [Limitation 1 — honest, not minimized]
⚠️  [Limitation 2]

## Alternatives Considered
**[Alternative A]** — why it wasn't recommended for this case
**[Alternative B]** — why it wasn't recommended for this case

## Related Considerations
[Adjacent concerns the questioner should be aware of — related agents to consult, follow-on decisions this one unlocks or constrains.]

## Next Step
[One concrete action to take based on this recommendation.]
```

## Advise Standards

- **Lead with the recommendation, not caveats.** "It depends" is the last resort, not the opener. Start with what to do.
- **Be context-sensitive.** Advice for a solo-founder MVP is different from advice for a 10-person team scaling to 100k users. Know which situation applies.
- **Acknowledge genuinely contested questions.** When the community is legitimately split (e.g., Drizzle vs. Prisma), say so clearly and explain which factors should tip the decision.
- **Note adjacent agent handoffs.** If this decision touches another layer, flag it: "→ This affects how the Data agent sets up the schema."
- **End with what to do next.** Every recommendation ends with a single concrete action, not "explore your options."
