---
name: stack:scaffold
description: Generate production-ready boilerplate for a target feature or layer. Routes to the appropriate agent(s), outputs files in dependency order, and lists required setup steps and environment variables.
---

# /scaffold [target]

Generate production-ready boilerplate. Routes to the appropriate agent(s) based on what you're building.

## Usage

```
/scaffold new feature            # full feature scaffold â€” Data â†’ Security â†’ Application â†’ Presentation
/scaffold auth middleware        # security agent
/scaffold webhook handler        # application agent
/scaffold AI voice pipeline      # ai-llm agent
/scaffold database schema        # data agent
/scaffold CI pipeline            # infrastructure agent
/scaffold error tracking         # observability agent
/scaffold React component        # presentation agent
```

Supports `STACK:` override:
```
/scaffold auth middleware STACK: auth=NextAuth
/scaffold database schema STACK: database=Supabase
```

## Output Format

```
[AGENT: <name>] [COMMAND: scaffold]
Scaffolding: <description of what's being generated>

--- <filename> ---
<file contents>

--- <filename> ---
<file contents>

### Setup Steps
1. [Manual step 1]
2. [Manual step 2]

### Environment Variables Required
| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| VAR_NAME | What it's for | Source |
```

Files are emitted in dependency order â€” a file is never shown before a file it imports.

## Scaffold Standards

- **Always TypeScript with strict types.** No `any`, no implicit `any`, no untyped function parameters.
- **Always include error handling.** Every async operation has a try/catch or `.catch()`. Every edge function returns a typed error response, not an unhandled rejection.
- **Always include a file purpose comment** on the first line: `// [filename] â€” [what this file does]`
- **Flag manual setup steps.** Anything that requires a dashboard action (creating a Clerk webhook, setting a Vercel env var, enabling Neon RLS) is listed in Setup Steps, not left as an assumption.
- **Show files in dependency order.** Types before implementations, utilities before consumers, schema before queries.
- **Mark optional sections** with `// OPTIONAL: [description]` comments so the engineer knows what they can defer.
- **No placeholder logic.** Every scaffold is functional or clearly marks the exact lines to implement: `// TODO: implement [specific thing]`.

## STACK: Override

Any scaffold supports overriding default stack components:

```
/scaffold auth middleware STACK: auth=NextAuth
/scaffold database schema STACK: database=Supabase, orm=Prisma
```

Named alternatives each agent knows are documented in the agent files. Overrides apply only to the current scaffold.
