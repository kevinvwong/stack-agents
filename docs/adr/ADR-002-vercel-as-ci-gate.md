# ADR-002: Vercel deploy check as the CI gate

**Status:** Accepted — groundwork complete; Vercel activation pending one-time web import (2026-05-28)
**Date:** 2026-05-27 (revived 2026-05-28)
**Author:** Kevin Wong

> **Update (2026-05-28):** Revived. The engineering groundwork is now on `main`:
>
> - `vercel.json` (#134) builds the dashboard from repo root — `buildCommand: cd dashboard && npm ci && npm run build`, output `dashboard/dist` — so `sync-content.mjs` can reach `../agents`, `../commands`, `../docs`.
> - `scripts/test-vercel-build.mjs` + the `Vercel build (vercel.json parity)` CI job (#151) run the exact `vercel.json` build on every PR, so the deploy config can't silently break and the gate stays trustworthy.
>
> **GH Actions remains the active merge gate until the one-time Vercel import is done.** No `stack-agents` Vercel project exists yet (verified via the Vercel API on 2026-05-28), so no Vercel check is posted on PRs — and a check that has never appeared cannot be required without permanently blocking every merge. The remaining steps are in "Manual step required" below, in strict order.

---

## Context

The dashboard is hosted on Vercel, and Vercel already runs a build for every PR (preview deployments). The repo also has a GitHub Actions workflow (`Dashboard — lint + build`) that runs the same lint + typecheck + build steps on every PR. Branch protection on `main` was configured to require that GH Actions check.

Two problems with that arrangement:

1. **GitHub Actions consumes billable minutes.** When the account's Actions quota is exhausted, the required check can't run, and PRs become unmergeable through normal branch protection. This happened in PR #2.
2. **Duplicate work.** Vercel and GH Actions both run essentially the same checks. One is enough.

---

## Decision

**Make `npm run build` a complete CI gate, and rely on Vercel's automatic deploy check as the branch-protection requirement.**

The dashboard's `build` script now chains the steps the GH Actions workflow ran separately:

```json
"build": "npm run sync-agents && eslint \"src/**/*.{ts,tsx}\" && tsc -b && vite build"
```

Failure at any step (lint, typecheck, or vite) fails the build, which fails Vercel's deploy, which fails its status check, which blocks the PR.

A `build:fast` script preserves the old fast path for local iteration:

```json
"build:fast": "npm run sync-agents && tsc -b && vite build"
```

The GitHub Actions workflow (`Dashboard — lint + build`) remains in `.github/workflows/ci.yml` as a fallback and runs when Actions quota is available. It is no longer the source of truth for the merge gate.

---

## Consequences

**Positive:**

- PRs remain mergeable when GH Actions quota is exhausted — Vercel runs independently.
- Single source of truth for the build pipeline (the `build` script in package.json), not split between package.json and a YAML file.
- Local `npm run build` now catches lint failures, matching CI behavior.

**Negative:**

- `npm run build` is slower by the lint step (~1–2s on a small dashboard). Use `build:fast` for tight iteration loops.
- Tying CI to Vercel makes the dashboard's CI dependent on Vercel's availability and Vercel's account state (free-tier deploy limits).
- The required-check name in branch protection must change from `Dashboard — lint + build` to whatever Vercel posts (typically `Vercel` or `Vercel – <project-name>`).

---

## Manual step required

Two phases, in order. **Do not reorder** — requiring a status check that does not yet exist permanently blocks all merges to `main`.

### Phase 1 — Create the Vercel check (one-time, vercel.com)

1. `vercel.com/new` → Import `kevinvwong/stack-agents`.
2. **Root Directory: leave as `./`** (not `dashboard/`). The build needs repo-root context; `vercel.json` handles the descent into `dashboard/`. The `Vercel build (vercel.json parity)` CI job already proves this path builds.
3. Framework Preset: "Other" (`vercel.json` sets `framework: null`).
4. Deploy. Confirm the first build succeeds and the dashboard renders.
5. Open any PR → confirm a check named `Vercel` (or `Vercel – stack-agents`) appears and goes green. **Note the exact string.**

### Phase 2 — Flip the gate (github.com)

1. Settings → Branches → `main` rule → Edit.
2. Under "Require status checks to pass before merging", add the exact Vercel check name from Phase 1 step 5.
3. Keep `Agent + command reference linter`, `PRD structural linter`, and `Vercel build (vercel.json parity)` required — they catch what a Vercel deploy alone won't (reference integrity, PRD structure, and `vercel.json` drift). Optionally drop `Dashboard — lint + build`, since Vercel now covers the build.
4. Re-enable "Require a pull request before merging" + 1 approving review (closes #28).
5. Save.

Until Phase 1 is complete, GH Actions is the gate and that is the intended state — not a temporary fallback.

---

## Alternatives considered

- **Self-hosted GitHub Actions runner.** Solves the quota problem but adds infra to maintain. Kept as a fallback for projects where Vercel isn't already in the loop.
- **Other CI providers (CircleCI, Buildkite).** Adds a vendor and credentials surface. Not worth it when Vercel is already deploying.
- **Keep GH Actions; top up quota.** Postpones the problem rather than fixes it. Repeat next month.
