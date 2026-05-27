# Runbook: Branch protection bypass

When the GitHub merge button refuses, what to do.

## Symptoms

You try to merge a PR (UI or `mcp__github__merge_pull_request`) and get one of:

- `405 At least 1 approving review is required`
- `405 Required status check "<name>" is expected` (check hasn't run yet)
- `405 Required status check "<name>" is failing`
- `mergeable_state: "blocked"` or `"behind"`

Root causes (in rough order of frequency):

1. **CI dead due to exhausted GH Actions tokens.** Required check can't run. (Happened to PR #2.)
2. **Required check name changed** (e.g. workflow file renamed) and branch protection still references the old name.
3. **PR author is the only approver available** on a small repo with `require approvals > 0`. GitHub won't let the author self-approve.
4. **Branch is behind `main`** and protection requires up-to-date.

## Triage in order

1. **Run CI equivalent locally** to know if the code is actually good:
   ```
   node scripts/lint-references.mjs && \
   node scripts/lint-prds.mjs --root . && \
   cd dashboard && npm ci && npm run build
   ```
   If everything passes, the merge bypass is safe.

2. **Try the bypass via GitHub web UI**:
   - Open the PR
   - Merge button dropdown → **"Merge without waiting for requirements to be met (bypass branch protections)"**
   - Only visible to repo admins
   - Squash + merge to match main's convention

3. **If bypass option doesn't show** (mobile app), open the PR in mobile Safari at `github.com` — the web UI exposes it; the GitHub app does not.

4. **If branch protection rule itself is the problem** (e.g. requires a check that no longer exists):
   - Settings → Branches → branch protection rule for `main` → Edit
   - Either drop the obsolete required check, or replace with the current required check name
   - Current required check: **`Dashboard — lint + build`** (GitHub Actions, not Vercel — ADR-002 describes the intended future state but the manual branch-protection step has not been executed; GH Actions remains the actual gate)
   - Merge the PR
   - Re-tighten the rule after

## Direct push fallback (admin only, last resort)

If the API merge fails and the UI is also stuck:

```
git fetch origin main
git checkout main
git reset --hard origin/main
git merge --squash <feature-branch>
git commit -m "<feature title> (#<PR>)"
git push origin main
```

This bypasses GitHub's PR merge flow entirely. The PR auto-closes when it detects the commits landed on `main`.

**Caveats:**
- If `main` blocks direct admin push (confirmed on this repo — `enforce_admins: true` was set in Phase 2), this fails with 403. Temporarily disable `enforce_admins` via the API before pushing, then re-enable immediately after. See Phase 2 notes for the exact `gh api` call.
- Squashed commits won't have GitHub's PR metadata in the message body — paste the PR description into the commit body manually.
- The branch isn't auto-deleted; delete it via UI afterwards (or wait for issue #30 to land auto-delete-on-merge).

## After bypassing

- Document why the bypass was used (in the commit message or a comment on the closed PR).
- If the bypass was due to a real CI gap (#28, #29), file a follow-up issue so it doesn't become a recurring excuse.

## Don't

- **Don't disable branch protection entirely** to merge one PR. The next ten merges will also forget to re-enable it.
- **Don't disable "Include administrators"** as a permanent fix unless your team is solo. With it off, branch protection only protects non-admins — which usually misses the people most likely to push directly.
- **Don't force-push to main**, ever, for any reason.

## See also

- `docs/adr/ADR-002-vercel-as-ci-gate.md` — describes the intended future state (Vercel as CI gate); the manual branch-protection step from that ADR has not been executed
- Issue [#28](https://github.com/kevinvwong/stack-agents/issues/28) — ✅ closed: branch protection re-tightened (Phase 6 CI fix)
- Issue [#29](https://github.com/kevinvwong/stack-agents/issues/29) — open: Vercel deployment not confirmed; current required check remains `Dashboard — lint + build` (GH Actions)
