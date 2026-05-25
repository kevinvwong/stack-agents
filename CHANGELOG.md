# Changelog

All notable changes to this marketplace are documented here.

## [1.5.0] — 2026-05-25

### kwong-stack-agents (1.2.0)

**Changed — split the single `notion` agent into 4 Workspace specialists:**
- `notion-architect` — workspace topology, database schemas, properties, relations, views, templates. Owns `/notion:setup`.
- `notion-publisher` — outbound publishing, idempotent upserts by `Source`, body block rendering, property mapping. Owns `/notion:publish`.
- `notion-importer` — inbound reading, ID resolution, page/database rendering to markdown, provenance stamping. Read-only. Owns `/notion:import`.
- `notion-governance` — workspace health: ownership, freshness, duplicates, source integrity, schema drift, permissions. Owns `/notion:audit`.

The pre-split `notion` agent has been removed. Existing handoff lines in `product`, `analytics`, `user-research`, `focus-group`, `expert-review`, `sprint-assembler`, `gh-docs`, and the `/panel:github` synthesis have been re-pointed to the correct specialist (publisher for `/notion:publish`, importer for `/notion:import`, etc.).

Dependency chain: `notion-architect → notion-publisher → notion-importer → notion-governance`

### kwong-commands

**Added — `/notion:audit`:**
- `/notion:audit [--scope <list>] [--auto-flag] [--propose-archives]` — runs by `notion-governance`. Surfaces ownerless pages, stale drafts, duplicates, broken `Source` URLs, schema drift, and permission risks. Read-only by default; archive proposals always require confirmation.

**Added — 3 cross-agent panels:**
- `/panel:notion` — all 4 Notion specialists in dependency order, with cross-specialty synthesis (where architect/publisher/importer/governance conflict).
- `/panel:knowledge` — `notion-architect` + `notion-governance` + `gh-docs`. Cross-surface documentation audit between Notion and the repo. Surfaces docs in the wrong home, duplicated truth, and broken cross-links.
- `/panel:publish` — `product` + `analytics` + `notion-publisher`. Quality gate before publishing a PRD or analytics spec. Verdict is binary: READY / READY WITH FIXES / NOT READY. Supports `--auto-publish` only when verdict is READY.

**Updated — existing `/notion:*` commands re-pointed to specialists:**
- `/notion:setup` → `notion-architect`
- `/notion:publish` → `notion-publisher`
- `/notion:import` → `notion-importer`

### kwong (marketplace)
- Bumped to 1.5.0.

---

## [1.4.0] — 2026-05-25

### kwong-stack-agents (1.1.0)

**Added — `notion` agent (new Workspace family):**
- `notion` — Notion workspace + database design, page templates, views, canonical-database scaffolding, idempotent publishing of agent/panel/sprint outputs, and importing pages/databases as session context. Owns the Notion MCP surface (`notion-search`, `notion-fetch`, `notion-create-pages`, `notion-update-page`, `notion-create-database`, `notion-create-view`, comments).

**Changed — Handoff edits across existing agents to route publishing to Notion:**
- `product` — PRD → `/notion:publish prd`; import existing PRDs via `/notion:import --as prd --into product`
- `analytics` — event schemas + A/B test plans → `/notion:publish analytics`
- `user-research`, `focus-group`, `expert-review` — research reports → `/notion:publish research`
- `sprint-assembler` — sprint roster + status → `/notion:publish sprint`
- `gh-docs` — ADRs/runbooks → `/notion:publish runbook`; panel audit summaries → `/notion:publish github-audit`
- `/panel:github` — synthesis now emits a handoff line to publish the audit

**Updated — orchestrator routing:**
- `CLAUDE.md` adds a Workspace family, routing rules for Notion requests, and a `/notion:*` command table.

### kwong-commands (new)

**Added — 3 `/notion:*` slash commands (source: `stack-agents/commands/notion/`):**
- `/notion:setup --parent <page-url-or-id>` — bootstrap canonical databases (Sprints, PRDs, Research, Analytics specs, GitHub audits, Quality audits, Game design docs, Runbooks) with default views. Non-destructive; `--force` is additive (never deletes).
- `/notion:publish <type> <identifier>` — idempotent upsert by `Source` URL for: `sprint`, `prd`, `research`, `analytics`, `github-audit`, `quality-audit`, `game-design`, `runbook`.
- `/notion:import <url-or-id> [--as <type>] [--into <agent>]` — read-only fetch of a page or database into session context, with optional handoff to a downstream agent.

---

## [1.3.0] — 2026-05-25

### kwong-stack-agents (new — 1.0.0)

**Added — 33 specialist agents across 8 engineering domains (source: `stack-agents`):**

Web Stack (dependency chain: data → security → ai-llm → application → infrastructure → observability → presentation):
- `data` — Neon, Drizzle ORM, migrations, RLS, blob storage
- `security` — Clerk, RBAC, Upstash rate limiting, RLS, CSP/HSTS headers
- `ai-llm` — Claude API, Deepgram STT, ElevenLabs TTS, system prompts, streaming, cost tracking
- `application` — Vercel Edge Functions, API routes, webhooks, Zod, Resend, QStash
- `infrastructure` — Vercel, GitHub Actions, secrets, feature flags, monorepo tooling
- `observability` — Sentry, Axiom, Vercel Analytics, AI call logging, alerting
- `presentation` — Next.js 15 App Router, Server Components, Tailwind CSS 4, shadcn/ui

Game Design (dependency chain: game-design → narrative → level-design → game-ux → game-tech → production):
- `game-design` — core mechanics, systems, game loop, balance, design pillars
- `narrative` — story structure, dialogue systems, branching narrative, lore
- `level-design` — spatial design, pacing, encounter design, player flow
- `game-ux` — controls, HUD, feedback, accessibility, onboarding
- `game-tech` — systems architecture, ECS, state machines, save/load, asset pipeline
- `production` — scope management, milestone planning, playtesting, risk, release readiness

GitHub (dependency chain: gh-repo → gh-actions → gh-issues → gh-prs → gh-releases → gh-docs):
- `gh-repo` — branch protection, CODEOWNERS, Dependabot, secret scanning
- `gh-actions` — GitHub Actions workflows, permissions, action pinning, caching
- `gh-issues` — label taxonomy, issue templates, triage workflow, Projects v2
- `gh-prs` — PR templates, review rules, auto-merge, size labeling
- `gh-releases` — semver, changelog, GitHub Releases, release automation
- `gh-docs` — README, CONTRIBUTING, SECURITY.md, API docs, ADRs, runbooks

Quality (dependency chain: web-qa → accessibility → performance):
- `web-qa` — Playwright E2E, Vitest unit/integration, test pyramid, flake triage
- `accessibility` — WCAG 2.1/2.2 AA/AAA, axe-core, screen-reader testing, ARIA authoring
- `performance` — Core Web Vitals, Lighthouse CI, bundle analysis, rendering strategy
- `game-qa` — playtesting protocols, functional QA, regression suites, certification

Research (dependency chain: user-research → usability-testing → focus-group → expert-review):
- `user-research` — user interviews, surveys, JTBD, personas, affinity mapping
- `usability-testing` — think-aloud protocols, moderated/unmoderated studies, task analysis
- `focus-group` — focus group design, facilitation, concept testing, synthesis
- `expert-review` — heuristic evaluation (Nielsen, Mayer, PLAY), design critique

Product:
- `product` — PRDs, user stories, RICE/MoSCoW, OKRs, success metrics, roadmap framing
- `analytics` — PostHog event schemas, funnel design, A/B test design, retention analysis

Cross-cutting:
- `i18n` — next-intl, ICU messages, RTL support, locale routing, locale-aware formatting
- `finops` — Claude/ElevenLabs/Deepgram cost tracking, Vercel/Neon spend, prompt caching, budgets

Meta:
- `sprint-assembler` — assembles custom sprint teams, generates missing agents, installs sprint orchestrators
- `project-setup` — installs Claude Code orchestration into existing repos or bootstraps new repos from scratch

### kwong-commands (1.1.0 → 1.2.0)

**Added — 13 stack-agents commands (source: `stack-agents`):**

Orchestration:
- `orchestrate` — master orchestrator; routes any request to the correct agent(s), emits output in dependency order, synthesizes cross-cutting findings. Requires kwong-stack-agents.

Web Stack:
- `audit` — structured audit across one or more stack layers, grouped by severity
- `scaffold` — production-ready boilerplate generation for a target feature or layer
- `advise` — architectural recommendation with recommendation + tradeoffs + next step
- `fullstack` — all 7 web agents in dependency order with cross-cutting synthesis

Panels:
- `panel:game` — all 6 game design agents as a panel with cross-discipline synthesis. Requires kwong-stack-agents.
- `panel:github` — all 6 GitHub agents as a panel with cross-domain synthesis. Requires kwong-stack-agents.

Setup:
- `setup:project` — install Claude Code orchestration into an existing repo or bootstrap a new repo (--mode config | bootstrap). Stacks: nextjs, nextjs-ai, nextjs-edu, nextjs-events, nextjs-knowledge, vite-react, game.
- `setup:hooks` — install hook recipes into `.claude/settings.json`

Sprint management:
- `sprint:assemble` — assemble a custom sprint team from the agent pool and install into a target project
- `sprint:dissolve` — remove a sprint from a target project (preserves registry)
- `sprint:list` — list all sprints with usage history, status, and agent composition
- `sprint:status` — sprint health check run from within the target project

## [1.2.0] — 2026-05-19

### kwong-agents (1.0.0 → 1.1.0)

**Added — 9 new agents:**

AI tooling:
- `ai-prompt-engineer` — system prompt architecture, structured output schemas, few-shot design, agentic loop design, prompt regression. Context-aware for GTLI_YLAI, GTLI_Reimagined, lexio, ernest, accessport-analyzer, secondbrain.

Auth security auditors:
- `nextauth-auditor` — NextAuth.js v4/v5 security audit: session strategy, CSRF, JWT config, provider setup, callback security, middleware coverage, RBAC. Primary context: arscca-VMS.
- `clerk-auditor` — Clerk security audit: middleware protection, server-side authorization, org/role RBAC, JWT templates, webhook signature verification, OAuth scope. Primary context: GTLI_YLAI.

Design team (discipline-based):
- `visual-designer` — typography, color systems, spacing, visual hierarchy, brand consistency, emotional tone
- `interaction-designer` — microinteractions, feedback timing, loading states, form behavior, multi-step flows, voice/AI interaction patterns
- `cognitive-psychologist` — cognitive load (CLT), working memory, attention, Gestalt, mental model alignment, NNS readability
- `behavioral-psychologist` — motivation quality (SDT), behavior change (COM-B/Fogg), engagement mechanics audit, dark pattern detection, ethics of persuasion
- `information-architect` — navigation structure, labeling systems, taxonomy design, search/filter, multi-role IA, URL structure
- `design-synthesis` — cross-discipline synthesis after 2+ design team reviews; surfaces systemic patterns, discipline conflicts, and unified priority backlog

## [1.1.0] — 2026-05-19

### kwong-commands (1.0.0 → 1.1.0)

**Added — 4 new slash commands:**
- `ux-review` — runs all 5 UX persona agents in parallel (ux-admin, ux-coordinator, ux-director, ux-learner, ux-synthesis) then synthesizes a unified priority backlog. Requires kwong-agents.
- `doc-audit` — drives doc-writer in assessment-only mode: inventories all project docs, produces a prioritized rewrite queue without modifying anything. Requires kwong-agents.
- `security-baseline` — first-pass security sweep invoking semgrep, codeql, insecure-defaults, supply-chain-risk-auditor, and agentic-actions-auditor in parallel. Requires kwong-skills.
- `compile-marketplace` — self-updating marketplace rebuild command. Runs the full discovery → deduplicate → curate → cross-reference → plan → build → audit → validate pipeline against ~/GitHub. Run this to refresh the marketplace after adding new artifacts to any project.

## [1.0.0] — 2026-05-19

Initial release.

### kwong-agents (1.0.0)

**Added — 24 agents from 3 source repos:**

Content pipeline (source: `arscca-VMS`):
- `assessment` — generates assessment JSON for GTLI content pipeline (frontmatter synthesized)
- `lesson` — generates lesson text JSON (frontmatter synthesized)
- `orchestrator` — orchestrates video-script + lesson + assessment + qa in sequence (frontmatter synthesized)
- `qa` — auto-QA auditor for pipeline outputs (frontmatter synthesized)
- `video-script` — generates video script JSON (frontmatter synthesized)

UX persona reviewers (source: `arscca-VMS`; identical copies in `GTLI_Reimagined` dropped):
- `ux-admin` — GTLI administrator persona
- `ux-coordinator` — studio production coordinator persona
- `ux-director` — cohort director persona
- `ux-learner` — non-native English speaking learner persona
- `ux-synthesis` — cross-persona synthesis after 2+ persona reviews

Course analysis tools (source: `GLTI-Course_Analyzer`):
- `doc-writer` — documentation reviewer and rewriter
- `simulated-user-panel` — 5-persona usability testing panel
- `ux-ui-reviewer` — UI/UX and React component reviewer

JGCC educational quality auditors (source: `GTLI_YLAI`):
- `jgcc-developmental-appropriateness` — developmental fit (conditional)
- `jgcc-diversity-representation` — diversity and representation audit
- `jgcc-engagement-auditor` — engagement quality audit (mandatory)
- `jgcc-equity-access` — equity and access audit (mandatory)
- `jgcc-family-stakeholder` — stakeholder co-engagement (conditional)
- `jgcc-learning-scientist` — active learning review (mandatory)
- `jgcc-meaningfulness-transfer` — meaningful learning review (mandatory)
- `jgcc-privacy-commercialism` — privacy and dark patterns audit (mandatory)
- `jgcc-social-jme-reviewer` — social interaction and JME (conditional)
- `jgcc-student-usability` — student usability audit (mandatory)
- `jgcc-wellbeing-ritec8` — RITEC-8 well-being scoring (mandatory)

**Deduplication:** 10 agents existed identically in both `arscca-VMS` and `GTLI_Reimagined`; `arscca-VMS` kept as canonical source.

### kwong-commands (1.0.0)

**Added — 1 command (source: `GTLI_YLAI`):**
- `jgcc-review` — orchestrates full 11-agent JGCC suite: 7 mandatory in parallel, 4 conditional, then synthesizes a Four Pillars score + prioritized remediation backlog. **Requires kwong-agents.**

### kwong-skills (1.0.0)

**Added — 79 skills (source: `ernest`):**

Fuzzing: `address-sanitizer`, `aflpp`, `atheris`, `cargo-fuzz`, `coverage-analysis`, `fuzzing-dictionary`, `fuzzing-obstacles`, `harness-writing`, `libafl`, `libfuzzer`, `mutation-testing`, `ossfuzz`, `ruzzy`

Vulnerability scanning: `algorand-vulnerability-scanner`, `cairo-vulnerability-scanner`, `codeql`, `cosmos-vulnerability-scanner`, `firebase-apk-scanner`, `semgrep`, `semgrep-rule-creator`, `semgrep-rule-variant-creator`, `solana-vulnerability-scanner`, `substrate-vulnerability-scanner`, `ton-vulnerability-scanner`, `trailmark`, `trailmark-structural`, `trailmark-summary`

Security auditing: `agentic-actions-auditor`, `audit-augmentation`, `audit-context-building`, `audit-prep-assistant`, `burpsuite-project-parser`, `code-maturity-assessor`, `constant-time-analysis`, `constant-time-testing`, `crypto-protocol-diagram`, `genotoxic`, `insecure-defaults`, `mermaid-to-proverif`, `sarif-parsing`, `seatbelt-sandboxer`, `secure-workflow-guide`, `sharp-edges`, `supply-chain-risk-auditor`, `token-integration-analyzer`, `variant-analysis`, `wycheproof`, `yara-rule-authoring`, `zeroize-audit`

Development tooling: `ask-questions-if-underspecified`, `claude-in-chrome-troubleshooting`, `debug-buttercup`, `designing-workflow-skills`, `devcontainer-setup`, `diagramming-code`, `differential-review`, `dimensional-analysis`, `dwarf-expert`, `entry-point-analyzer`, `fp-check`, `frontend-design`, `gh-cli`, `git-cleanup`, `graph-evolution`, `guidelines-advisor`, `interpreting-culture-index`, `let-fate-decide`, `modern-python`, `property-based-testing`, `remotion-best-practices`, `second-opinion`, `skill-improver`, `spec-to-code-compliance`, `testing-handbook-generator`, `vector-forge`, `vercel-composition-patterns`, `vercel-react-best-practices`, `web-design-guidelines`, `webapp-testing`
