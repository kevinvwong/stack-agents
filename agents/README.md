# agents/

Specialized agent definition files. Each file defines a persona, stack, opinions, and the behavior for `/audit`, `/scaffold`, and `/advise` within that discipline.

The **master orchestrator** is `CLAUDE.md` at the repo root — it routes all requests to these agents.

---

## Meta

| File | Agent | Responsibility |
|------|-------|----------------|
| [sprint-assembler.md](sprint-assembler.md) | `sprint-assembler` | Assembles sprint teams, generates missing agents, installs sprint orchestrators, tracks usage in registry |
| [project-setup.md](project-setup.md) | `project-setup` | Installs Claude Code orchestration into existing repos (--mode config) or bootstraps new repos from scratch (--mode bootstrap) |

---

## Web Stack

Files prefixed `web-`. Dependency order: `data → security → ai-llm → application → infrastructure → observability → presentation`

| File | Agent | Responsibility |
|------|-------|----------------|
| [web-data.md](web-data.md) | `data` | Neon, Drizzle ORM, migrations, Vercel Blob, R2, full-text search |
| [web-security.md](web-security.md) | `security` | Clerk, RBAC, Upstash rate limiting, RLS, CSP/HSTS headers |
| [web-ai-llm.md](web-ai-llm.md) | `ai-llm` | Claude API, Deepgram STT, ElevenLabs TTS, prompt versioning, cost tracking |
| [web-application.md](web-application.md) | `application` | Vercel Edge Functions, API routes, webhooks, Zod, Resend, QStash |
| [web-infrastructure.md](web-infrastructure.md) | `infrastructure` | Vercel, GitHub Actions, secrets, feature flags, pnpm workspaces |
| [web-observability.md](web-observability.md) | `observability` | Sentry, Axiom, Vercel Analytics, AI call logging, alerting |
| [web-presentation.md](web-presentation.md) | `presentation` | Next.js 15 App Router, Server Components, Tailwind, shadcn/ui, Playwright |

---

## Game Design

Files prefixed `game-`. Dependency order: `game-design → narrative → level-design → game-ux → game-tech → production`

| File | Agent | Responsibility |
|------|-------|----------------|
| [game-design.md](game-design.md) | `game-design` | Core mechanics, systems, game loop, balance, design pillars |
| [game-narrative.md](game-narrative.md) | `narrative` | Story structure, dialogue systems, branching narrative, lore |
| [game-level-design.md](game-level-design.md) | `level-design` | Spaces, pacing, encounter design, player flow |
| [game-ux.md](game-ux.md) | `game-ux` | Controls, HUD, feedback, accessibility, onboarding |
| [game-tech.md](game-tech.md) | `game-tech` | Systems architecture, ECS, state machines, save/load, asset pipeline |
| [game-production.md](game-production.md) | `production` | Scope, milestones, playtesting, risk, release readiness |

---

## GitHub

Files prefixed `gh-`. Dependency order: `gh-repo → gh-actions → gh-issues → gh-prs → gh-releases → gh-docs`

| File | Agent | Responsibility |
|------|-------|----------------|
| [gh-repo.md](gh-repo.md) | `gh-repo` | Branch protection, CODEOWNERS, Dependabot, secret scanning, community health files |
| [gh-actions.md](gh-actions.md) | `gh-actions` | GitHub Actions workflows, permissions, action pinning, caching, CI structure |
| [gh-issues.md](gh-issues.md) | `gh-issues` | Label taxonomy, issue templates, triage workflow, milestones, Projects v2 |
| [gh-prs.md](gh-prs.md) | `gh-prs` | PR templates, review rules, auto-merge, size labeling, review culture |
| [gh-releases.md](gh-releases.md) | `gh-releases` | Semver, changelog, GitHub Releases, tag conventions, release automation |
| [gh-docs.md](gh-docs.md) | `gh-docs` | README, CONTRIBUTING, SECURITY.md, API docs, ADRs, runbooks |

---

## Quality

Dependency order: `web-qa → accessibility → performance`

| File | Agent | Responsibility |
|------|-------|----------------|
| [web-qa.md](web-qa.md) | `web-qa` | Playwright E2E, Vitest unit/integration, test pyramid strategy, flake triage, CI test pipeline |
| [accessibility.md](accessibility.md) | `accessibility` | WCAG 2.1/2.2 AA/AAA, axe-core, screen-reader testing, ARIA authoring, focus management |
| [performance.md](performance.md) | `performance` | Core Web Vitals, Lighthouse CI, bundle analysis, rendering strategy, edge caching |
| [game-qa.md](game-qa.md) | `game-qa` | Game playtesting protocols, functional QA, regression suites, platform testing, certification |

---

## Research

Dependency order: `user-research → usability-testing → focus-group → expert-review`

| File | Agent | Responsibility |
|------|-------|----------------|
| [user-research.md](user-research.md) | `user-research` | User interviews, surveys, personas, JTBD, affinity mapping, research planning |
| [usability-testing.md](usability-testing.md) | `usability-testing` | Think-aloud protocols, moderated/unmoderated studies, task analysis, session recording |
| [focus-group.md](focus-group.md) | `focus-group` | Focus group design, facilitation, concept testing, synthesis, insight reporting |
| [expert-review.md](expert-review.md) | `expert-review` | Heuristic evaluation (Nielsen, Mayer, PLAY), design critique, structured walkthroughs |

---

## Product

| File | Agent | Responsibility |
|------|-------|----------------|
| [product.md](product.md) | `product` | PRDs, user stories, RICE/MoSCoW prioritization, OKRs, success metrics, roadmap framing |
| [analytics.md](analytics.md) | `analytics` | PostHog event schemas, funnel design, A/B test design, retention analysis, feature flags |

---

## Cross-cutting

| File | Agent | Responsibility |
|------|-------|----------------|
| [i18n.md](i18n.md) | `i18n` | next-intl, ICU message syntax, RTL support, locale routing, locale-aware formatting |
| [finops.md](finops.md) | `finops` | AI API cost tracking (Claude/ElevenLabs/Deepgram), infrastructure spend, prompt caching, budgets |

---

## Workspace

Files prefixed `notion-`. Dependency order: `notion-architect → notion-publisher → notion-importer → notion-governance`

| File | Agent | Responsibility |
|------|-------|----------------|
| [notion-architect.md](notion-architect.md) | `notion-architect` | Workspace topology, database schemas, properties, relations, views, templates. Owns `/notion:setup`. |
| [notion-publisher.md](notion-publisher.md) | `notion-publisher` | Outbound publishing — idempotent upserts by `Source` URL, body block rendering, property mapping. Owns `/notion:publish`. |
| [notion-importer.md](notion-importer.md) | `notion-importer` | Inbound reading — ID resolution, page/database rendering to markdown, provenance stamping. Read-only. Owns `/notion:import`. |
| [notion-governance.md](notion-governance.md) | `notion-governance` | Workspace health — ownership, freshness, duplicates, source integrity, schema drift, permissions. Owns `/notion:audit`. |

---

## Adding a New Agent

1. Create `agents/<family>-<name>.md` using `templates/agent-template.md`
2. Fill in: frontmatter (`name`, `description`), persona, `## Stack`, `## Opinions`, `## /audit`, `## /scaffold`, `## /advise`, `## Handoffs`
3. Add a row to this README under the correct family
4. Add a row to the roster table in `CLAUDE.md`
5. Run `.\install.ps1` — syncs to `~/.claude/` automatically (no manual copy needed)
6. Run `cd dashboard && npm run dev` — the new node appears in the graph automatically

Agents generated by `/sprint:assemble` are added automatically.
