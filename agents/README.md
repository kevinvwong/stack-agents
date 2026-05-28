# agents/

Specialized agent definition files. Each file defines a persona, stack, opinions, and the behavior for `/audit`, `/scaffold`, and `/advise` within that discipline.

The **master orchestrator** is `CLAUDE.md` at the repo root — it routes all requests to these agents.

The `Description` column below mirrors each agent file's frontmatter `description:` field (trimmed for scanability). See the agent file itself for the full description.

---

## Meta

| File                                                 | Agent                   | Responsibility                                                                                                                                             | Description                                                                                           |
| ---------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [meta-sprint-assembler.md](meta-sprint-assembler.md) | `meta-sprint-assembler` | Assembles sprint teams, generates missing agents, installs sprint orchestrators, tracks usage in registry                                                  | Assembles custom sprint teams, generates missing agents, installs scoped orchestrators, tracks usage. |
| [meta-agent-lifecycle.md](meta-agent-lifecycle.md)   | `meta-agent-lifecycle`  | Owns the `/agents:*` lifecycle commands (hire, fire, train, combine, review). Treats the roster as a workforce; mutates agent files as a normal operation. | Workforce manager owning `/agents:*` lifecycle — hire, fire, train, combine, review.                  |
| [meta-project-setup.md](meta-project-setup.md)       | `meta-project-setup`    | Installs Claude Code orchestration into existing repos (--mode config) or bootstraps new repos from scratch (--mode bootstrap)                             | Installs Claude Code config into existing repos or bootstraps new ones from scratch.                  |

---

## Web Stack

Files prefixed `web-`. Dependency order: `data → security → ai-llm → application → infrastructure → observability → presentation`

| File                                           | Agent            | Responsibility                                                             | Description                                                                       |
| ---------------------------------------------- | ---------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [web-data.md](web-data.md)                     | `data`           | Neon, Drizzle ORM, migrations, Vercel Blob, R2, full-text search           | Data layer for Neon + Drizzle — schema, migrations, RLS, blob storage, search.    |
| [web-security.md](web-security.md)             | `security`       | Clerk, RBAC, Upstash rate limiting, RLS, CSP/HSTS headers                  | Security layer for Clerk auth, RBAC, rate limiting, RLS, security headers.        |
| [web-ai-llm.md](web-ai-llm.md)                 | `ai-llm`         | Claude API, Deepgram STT, ElevenLabs TTS, prompt versioning, cost tracking | AI/LLM layer for Claude, Deepgram, ElevenLabs — prompts, streaming, evals, cost.  |
| [web-application.md](web-application.md)       | `application`    | Vercel Edge Functions, API routes, webhooks, Zod, Resend, QStash           | Backend for Vercel Edge — API routes, Zod, webhooks, Resend, QStash jobs.         |
| [web-infrastructure.md](web-infrastructure.md) | `infrastructure` | Vercel, GitHub Actions, secrets, feature flags, pnpm workspaces            | Infrastructure and CI/CD for Vercel + GitHub Actions — secrets, env, flags.       |
| [web-observability.md](web-observability.md)   | `observability`  | Sentry, Axiom, Vercel Analytics, AI call logging, alerting                 | Observability for Sentry, Axiom, AI call monitoring — errors, logs, alerts.       |
| [web-presentation.md](web-presentation.md)     | `presentation`   | Next.js 15 App Router, Server Components, Tailwind, shadcn/ui, Playwright  | Frontend for Next.js 15 + Tailwind + shadcn/ui — Server Components, state, tests. |

---

## Game Design

Files prefixed `game-`. Dependency order: `game-design → narrative → level-design → game-ux → game-tech → production`

| File                                         | Agent          | Responsibility                                                       | Description                                                                         |
| -------------------------------------------- | -------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [game-design.md](game-design.md)             | `game-design`  | Core mechanics, systems, game loop, balance, design pillars          | Core game design — mechanics, systems, loop, economy, design pillar document.       |
| [game-narrative.md](game-narrative.md)       | `narrative`    | Story structure, dialogue systems, branching narrative, lore         | Narrative design — story structure, dialogue, branching, character, lore bibles.    |
| [game-level-design.md](game-level-design.md) | `level-design` | Spaces, pacing, encounter design, player flow                        | Level design — spatial design, pacing, encounter design, player flow.               |
| [game-ux.md](game-ux.md)                     | `game-ux`      | Controls, HUD, feedback, accessibility, onboarding                   | Game UX — controls, HUD, visual/audio/haptic feedback, accessibility, onboarding.   |
| [game-tech.md](game-tech.md)                 | `game-tech`    | Systems architecture, ECS, state machines, save/load, asset pipeline | Gameplay systems architecture — ECS, state machines, AI, save/load, asset pipeline. |
| [game-production.md](game-production.md)     | `production`   | Scope, milestones, playtesting, risk, release readiness              | Game production — scope, milestones, playtesting, risk, release readiness.          |

---

## GitHub

Files prefixed `gh-`. Dependency order: `gh-repo → gh-actions → gh-issues → gh-prs → gh-releases → gh-docs`

| File                             | Agent         | Responsibility                                                                     | Description                                                                         |
| -------------------------------- | ------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [gh-repo.md](gh-repo.md)         | `gh-repo`     | Branch protection, CODEOWNERS, Dependabot, secret scanning, community health files | Repo governance — branch protection, CODEOWNERS, Dependabot, secret scanning.       |
| [gh-actions.md](gh-actions.md)   | `gh-actions`  | GitHub Actions workflows, permissions, action pinning, caching, CI structure       | Actions CI/CD — workflows, caching, reusable workflows, secrets, hardening.         |
| [gh-issues.md](gh-issues.md)     | `gh-issues`   | Label taxonomy, issue templates, triage workflow, milestones, Projects v2          | Issues and project management — labels, templates, triage, milestones, Projects v2. |
| [gh-prs.md](gh-prs.md)           | `gh-prs`      | PR templates, review rules, auto-merge, size labeling, review culture              | Pull request workflow — templates, reviews, auto-merge, required checks.            |
| [gh-releases.md](gh-releases.md) | `gh-releases` | Semver, changelog, GitHub Releases, tag conventions, release automation            | Releases and versioning — semver, changelogs, tags, release automation.             |
| [gh-docs.md](gh-docs.md)         | `gh-docs`     | README, CONTRIBUTING, SECURITY.md, API docs, ADRs, runbooks                        | Documentation quality — READMEs, CONTRIBUTING, API docs, ADRs, runbooks.            |

---

## Quality

Dependency order: `web-qa → accessibility → performance`

| File                                                 | Agent                   | Responsibility                                                                                 | Description                                                                            |
| ---------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [web-qa.md](web-qa.md)                               | `web-qa`                | Playwright E2E, Vitest unit/integration, test pyramid strategy, flake triage, CI test pipeline | QA and automated testing — Playwright E2E, Vitest, fixtures, coverage, flake triage.   |
| [quality-accessibility.md](quality-accessibility.md) | `quality-accessibility` | WCAG 2.1/2.2 AA/AAA, axe-core, screen-reader testing, ARIA authoring, focus management         | Accessibility specialist — WCAG AA/AAA, axe-core, screen-reader, ARIA, focus.          |
| [quality-performance.md](quality-performance.md)     | `quality-performance`   | Core Web Vitals, Lighthouse CI, bundle analysis, rendering strategy, edge caching              | Web performance — Core Web Vitals, Lighthouse CI, bundles, rendering, caching.         |
| [game-qa.md](game-qa.md)                             | `game-qa`               | Game playtesting protocols, functional QA, regression suites, platform testing, certification  | Game QA — playtesting protocols, regression, platform matrices, performance, sign-off. |

---

## Research

Dependency order: `user-research → usability-testing → focus-group → expert-review`

| File                                                           | Agent                        | Responsibility                                                                         | Description                                                                          |
| -------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [research-user-research.md](research-user-research.md)         | `research-user-research`     | User interviews, surveys, personas, JTBD, affinity mapping, research planning          | User research — interviews, surveys, personas, JTBD, affinity mapping, synthesis.    |
| [research-usability-testing.md](research-usability-testing.md) | `research-usability-testing` | Think-aloud protocols, moderated/unmoderated studies, task analysis, session recording | Usability testing — moderated/unmoderated studies, think-aloud, task metrics, fixes. |
| [research-focus-group.md](research-focus-group.md)             | `research-focus-group`       | Focus group design, facilitation, concept testing, synthesis, insight reporting        | Focus groups — design, facilitation, concept testing, recruitment, synthesis.        |
| [research-expert-review.md](research-expert-review.md)         | `research-expert-review`     | Heuristic evaluation (Nielsen, Mayer, PLAY), design critique, structured walkthroughs  | Expert review and heuristic evaluation — Nielsen, WCAG, pedagogical, game UX.        |

---

## Product

| File                                         | Agent               | Responsibility                                                                           | Description                                                               |
| -------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [product-product.md](product-product.md)     | `product-product`   | PRDs, user stories, RICE/MoSCoW prioritization, OKRs, success metrics, roadmap framing   | Product management — PRDs, stories, RICE/MoSCoW, OKRs, success metrics.   |
| [product-analytics.md](product-analytics.md) | `product-analytics` | PostHog event schemas, funnel design, A/B test design, retention analysis, feature flags | Product analytics — PostHog events, funnels, A/B tests, retention, flags. |

---

## Cross-cutting

| File                                             | Agent                 | Responsibility                                                                                              | Description                                                                             |
| ------------------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [cross-i18n.md](cross-i18n.md)                   | `cross-i18n`          | next-intl, ICU message syntax, RTL support, locale routing, locale-aware formatting                         | i18n and localization — next-intl, ICU, RTL, locale routing, formatting.                |
| [cross-finops.md](cross-finops.md)               | `cross-finops`        | AI API cost tracking (Claude/ElevenLabs/Deepgram), infrastructure spend, prompt caching, budgets            | Cloud + AI cost management — token tracking, budgets, dashboards, optimization.         |
| [cross-design-system.md](cross-design-system.md) | `cross-design-system` | Tailwind config, shadcn/ui governance, typed design tokens (`theme.ts`), dark mode, focus and motion tokens | Design system and theming — typed tokens, Tailwind, shadcn/ui, dark mode, focus/motion. |

---

## Workspace

Files prefixed `notion-`. Dependency order: `notion-architect → notion-publisher → notion-importer → notion-governance`

| File                                         | Agent               | Responsibility                                                                                                               | Description                                                                          |
| -------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [notion-architect.md](notion-architect.md)   | `notion-architect`  | Workspace topology, database schemas, properties, relations, views, templates. Owns `/notion:setup`.                         | Notion workspace architect — topology, schemas, properties, relations, views.        |
| [notion-publisher.md](notion-publisher.md)   | `notion-publisher`  | Outbound publishing — idempotent upserts by `Source` URL, body block rendering, property mapping. Owns `/notion:publish`.    | Notion outbound publishing — idempotent upserts by `Source` URL.                     |
| [notion-importer.md](notion-importer.md)     | `notion-importer`   | Inbound reading — ID resolution, page/database rendering to markdown, provenance stamping. Read-only. Owns `/notion:import`. | Notion inbound reading — fetches pages/databases into session for downstream agents. |
| [notion-governance.md](notion-governance.md) | `notion-governance` | Workspace health — ownership, freshness, duplicates, source integrity, schema drift, permissions. Owns `/notion:audit`.      | Notion workspace governance — archives, ownership, duplicates, permissions.          |

---

## Adding a New Agent

1. Create `agents/<family>-<name>.md` using `templates/agent-template.md`
2. Fill in: frontmatter (`name`, `description`), persona, `## Stack`, `## Opinions`, `## /audit`, `## /scaffold`, `## /advise`, `## Handoffs`
3. Add a row to this README under the correct family
4. Add a row to the roster table in `CLAUDE.md`
5. Run `.\install.ps1` — syncs to `~/.claude/` automatically (no manual copy needed)
6. Run `cd dashboard && npm run dev` — the new node appears in the graph automatically
7. **Scaffold agents only:** If the agent writes or rewrites files (scaffold/bootstrap operations), add an `## Isolation` section documenting `isolation: worktree` usage — see `agents/meta-project-setup.md` for the standard pattern.

Agents generated by `/sprint:assemble` are added automatically.
