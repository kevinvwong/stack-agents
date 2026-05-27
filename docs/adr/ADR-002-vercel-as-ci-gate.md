# ADR-002: Vercel deploy check as the CI gate

**Status:** Accepted
**Date:** 2026-05-27
**Author:** Kevin Wong

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

Branch protection on `main` must be updated on github.com — this can't be done from the repo:

1. Settings → Branches → branch protection rule for `main` → Edit
2. Under "Require status checks to pass before merging":
   - Remove `Dashboard — lint + build`
   - Add the Vercel check name (search for "Vercel" in the search box; the exact name depends on the Vercel project)
3. Save

Until that change is made, branch protection still expects the (now non-running) GH Actions check.

---

## Alternatives considered

- **Self-hosted GitHub Actions runner.** Solves the quota problem but adds infra to maintain. Kept as a fallback for projects where Vercel isn't already in the loop.
- **Other CI providers (CircleCI, Buildkite).** Adds a vendor and credentials surface. Not worth it when Vercel is already deploying.
- **Keep GH Actions; top up quota.** Postpones the problem rather than fixes it. Repeat next month.
