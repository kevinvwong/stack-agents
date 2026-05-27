# Runbook: Branch protection bypass

When the GitHub merge button refuses, what to do.

## Symptoms

You try to merge a PR (UI or `gh pr merge`) and get one of:

- `405 At least 1 approving review is required`
- `405 Required status check "<name>" is expected` (check hasn't run yet)
- `405 Required status check "<name>" is failing`
- `GraphQL: Review Cannot approve your own pull request`
- `mergeable_state: "blocked"` or `"behind"`

Root causes (in rough order of frequency):

1. **Solo repo — can't self-approve.** GitHub disallows the PR author from approving their own PR, and `enforce_admins: true` blocks `--admin` override.
2. **CI dead due to exhausted GH Actions tokens.** Required check can't run. (Happened to PR #2.)
3. **Required check name changed** (e.g. workflow file renamed) and branch protection still references the old name.
4. **Branch is behind `main`** and protection requires up-to-date (`strict: true`).

---

## Case 1: Solo repo self-merge (most common)

GitHub won't let you approve your own PR. `gh pr merge --admin` is also blocked when `enforce_admins: true`. The safe workaround is to temporarily drop the required-reviewer rule, merge, then restore it.

### Step 1 — Verify CI is green first

```
gh run list --limit 3
```

Don't bypass unless all required checks show `success`. If CI is failing, fix that first.

### Step 2 — Temporarily remove required reviewer

```bash
gh api repos/<owner>/<repo>/branches/main/protection \
  --method PUT \
  --header "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Agent + command reference linter",
      "PRD structural linter",
      "Dashboard — lint + build"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

> Setting `required_pull_request_reviews: null` removes the reviewer requirement entirely for this window. `enforce_admins: false` lets the API merge proceed without the admin restriction. Status checks stay required.

### Step 3 — Merge

```bash
gh pr merge <number> --squash --delete-branch
```

### Step 4 — Restore full branch protection immediately

```bash
gh api repos/<owner>/<repo>/branches/main/protection \
  --method PUT \
  --header "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Agent + command reference linter",
      "PRD structural linter",
      "Dashboard — lint + build"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

Verify it took:

```bash
gh api repos/<owner>/<repo>/branches/main/protection \
  --jq '{enforce_admins: .enforce_admins.enabled, required_reviewers: .required_pull_request_reviews.required_approving_review_count}'
# should output: {"enforce_admins":true,"required_reviewers":1}
```

### Step 5 — Sync local main

```bash
git checkout main && git pull origin main
```

---

## Case 2: Required check not running (CI quota / name mismatch)

1. **Run CI equivalent locally** to confirm the code is actually good:
   ```
   node scripts/lint-references.mjs
   node scripts/lint-prds.mjs --root .
   cd dashboard && npm ci && npm run build
   ```

2. **Check if the check name in branch protection matches the workflow job name:**
   - Current required checks (as of 2026-05-27):
     - `Agent + command reference linter`
     - `PRD structural linter`
     - `Dashboard — lint + build`
   - If the workflow was renamed, update branch protection to match (Settings → Branches → Edit rule).

3. **If CI quota is exhausted**, use the web UI bypass:
   - Open the PR → Merge button dropdown → **"Merge without waiting for requirements to be met (bypass branch protections)"**
   - Only visible to repo admins. Not available in the GitHub mobile app — use `github.com` in a browser.

---

## Case 3: Branch behind main

```bash
git fetch origin
git checkout <your-branch>
git rebase origin/main
git push --force-with-lease origin <your-branch>
```

Then wait for CI to re-run on the rebased branch.

---

## Direct push fallback (last resort, `enforce_admins` must be off)

If the API merge fails and the UI is also stuck:

```bash
git fetch origin main
git checkout main
git reset --hard origin/main
git merge --squash <feature-branch>
git commit -m "<feature title> (#<PR>)"
git push origin main
```

The PR auto-closes when it detects the commits on `main`.

**Caveats:**
- Requires `enforce_admins: false` — disable it via the API (Step 2 above), push, then re-enable (Step 4).
- Squashed commits won't have GitHub's PR metadata — paste the PR description into the commit body manually.
- Delete the branch manually afterwards (`gh pr delete <branch>` or UI).

---

## After any bypass

- Add a comment on the closed PR explaining why the bypass was used.
- If you disabled `enforce_admins`, confirm it's re-enabled: `gh api repos/<owner>/<repo>/branches/main/protection --jq '.enforce_admins.enabled'` → should be `true`.

---

## Don't

- **Don't disable branch protection entirely** to merge one PR. The next ten merges will also forget to re-enable it.
- **Don't leave `enforce_admins: false` on.** It's a temporary window, not a permanent config.
- **Don't force-push to main**, ever, for any reason.

---

## See also

- `docs/adr/ADR-002-vercel-as-ci-gate.md` — GH Actions is the intentional merge gate; Vercel migration deferred (issue #29)
- Issue [#28](https://github.com/kevinvwong/stack-agents/issues/28) — ✅ closed: branch protection re-tightened (Phase 6 CI fix)
- Issue [#29](https://github.com/kevinvwong/stack-agents/issues/29) — open: Vercel deployment not confirmed; GH Actions remains the actual gate
