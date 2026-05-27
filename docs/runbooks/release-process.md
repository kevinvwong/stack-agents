# Runbook: Release process

How to cut a versioned release of stack-agents and verify the GitHub Release page shows the correct CHANGELOG notes.

---

## When to release

A release is warranted when `main` contains any of the following since the last tag:

- A new agent file, command file, or panel (MINOR)
- A renamed or removed agent/command that breaks `[AGENT:]` references in callers (MAJOR)
- A bug fix to a script, workflow, or hook that was shipping broken behavior (PATCH)
- A security fix to a workflow permission or hook guard (PATCH, urgent)

Non-functional changes (doc edits, comment fixes, README typos) do not require a release. A CHANGELOG entry under `[Unreleased]` is sufficient until the next substantive bump.

---

## Semver convention for this repo

The "product" here is the agent roster and command surface, not a library API.

| Change | Bump | Example |
|--------|------|---------|
| New agent, new command, new panel | MINOR | Added `agents/finops.md` |
| Removed or renamed agent/command | MAJOR | Deleted `agents/web-security.md`; callers break |
| Bug fix to existing script/workflow/hook | PATCH | Fixed `sync-content.mjs` Windows path bug |
| Security fix to workflow permissions | PATCH | Tightened `release.yml` to `read-all` default |
| Non-functional (docs, comments, README prose) | No bump | Rewrote getting-started guide |

When in doubt: if a downstream project's `CLAUDE.md` references an `[AGENT:]` name that no longer exists after your change, that is a MAJOR bump.

---

## Step 1 — Add a CHANGELOG entry

Open `CHANGELOG.md`. Move items from `## [Unreleased]` into a new versioned section immediately below it. Use an em-dash (`—`, U+2014) as the separator — not a hyphen.

```
## [1.8.0] — 2026-06-01

### Added
- `agents/finops.md` — FinOps agent for AI API cost tracking

### Fixed
- `sync-content.mjs` — resolved Windows path doubling
```

The release workflow extracts notes by matching this exact heading pattern:

```
## [VERSION]
```

where `VERSION` is the tag name with the leading `v` stripped. If the heading does not match — wrong separator, extra spaces, wrong brackets — the workflow falls back to the string `"See CHANGELOG.md for details."` in the GitHub Release body. That fallback is the smoke signal that something is wrong.

Leave `## [Unreleased]` in place above the new section so the next cycle has somewhere to accumulate changes.

---

## Step 2 — Update the marketplace badge in README.md

Line 2 of `README.md` contains:

```
[![Marketplace](https://img.shields.io/badge/marketplace-1.7.7-blue)](./CHANGELOG.md)
```

Update the version number to match the new tag:

```
[![Marketplace](https://img.shields.io/badge/marketplace-1.8.0-blue)](./CHANGELOG.md)
```

---

## Step 3 — Commit

Commit CHANGELOG and README together. You can fold this into the feature PR or land it as a standalone commit on `main`.

```bash
git add CHANGELOG.md README.md
git commit -m "chore: bump to v1.8.0"
```

If the changes are part of a feature PR, the commit message can be the PR title; the version bump is typically a follow-up commit on the same branch or a direct commit to `main` after merge.

---

## Step 4 — Push the tag

```bash
git tag v1.8.0
git push origin v1.8.0
```

The tag push — not the commit push — is the release trigger. The `Release` workflow fires on `push` to tags matching `v*.*.*`.

---

## Step 5 — Monitor the Release workflow

```bash
gh run list --limit 3
```

Wait for the `Release` workflow run to show `completed` / `success`. The run takes under two minutes. If the run is not visible within 30 seconds of the tag push, confirm the tag reached the remote:

```bash
git ls-remote origin refs/tags/v1.8.0
```

---

## Step 6 — Verify the GitHub Release page

```bash
gh release view v1.8.0
```

Check:

- **Title** is `v1.8.0` (not `Release v1.8.0` or auto-generated PR titles)
- **Body** contains the CHANGELOG section for this version — subsections like `### Added`, `### Fixed`, prose descriptions
- **Body** does NOT say `"See CHANGELOG.md for details."` (that is the fallback for a heading mismatch)
- The release is marked **Latest** (not Pre-release), unless this is an RC tag (see below)

---

## If the release workflow fails

The only way to re-trigger the `Release` workflow is to delete the tag and re-push it. GitHub does not re-run tag-triggered workflows on an existing tag.

```bash
# Delete the tag locally and remotely
git tag -d v1.8.0
git push origin :refs/tags/v1.8.0

# If the GitHub Release was partially created, delete it first
gh release delete v1.8.0 --yes

# Fix whatever caused the failure (CHANGELOG heading, badge, workflow syntax)
# Then re-tag and push
git tag v1.8.0
git push origin v1.8.0
```

Deleting and re-pushing a tag is acceptable only if the tag has not been publicly referenced (no downstream project has pinned to it, no social announcement has gone out). If the tag is already in the wild, publish a new patch version instead.

Common failure causes and fixes:

| Symptom | Cause | Fix |
|---------|-------|-----|
| Release body says "See CHANGELOG.md for details." | CHANGELOG heading did not match tag | Check separator is em-dash `—`, brackets are `[]`, version string is exact |
| Workflow shows 0 jobs / never triggered | Tag pattern did not match `v*.*.*` | Confirm tag format: `v1.8.0`, not `1.8.0` or `release-v1.8.0` |
| `gh release create` step fails with 422 | Release already exists for this tag | Delete the existing release with `gh release delete`, then re-run |
| Checkout step fails | Tag not yet propagated to GitHub | Wait 10 seconds; re-trigger |

---

## RC tags for breaking changes

Before promoting a MAJOR version to `latest`, use release candidates to give downstream projects time to adapt.

Tag format: `vX.Y.Z-rc.N` where N starts at 1.

```bash
git tag v2.0.0-rc.1
git push origin v2.0.0-rc.1
```

The CHANGELOG heading must match exactly:

```
## [2.0.0-rc.1] — 2026-06-01
```

After the workflow creates the release, mark it as a pre-release manually — the workflow does not set this flag automatically:

```bash
gh release edit v2.0.0-rc.1 --prerelease
```

Verify it is not promoted to Latest:

```bash
gh release view v2.0.0-rc.1 --json isPrerelease,isLatest
# Expected: {"isPrerelease":true,"isLatest":false}
```

Iterate through `rc.1`, `rc.2`, etc. until stable. When ready to promote, create the final tag:

```bash
git tag v2.0.0
git push origin v2.0.0
```

The `v2.0.0` release will automatically become Latest because it is the highest non-prerelease tag.

---

## Don't

- **Don't delete a published tag** after downstream projects have referenced it. Publish a new patch instead.
- **Don't skip RC tags for MAJOR bumps.** Agent renames and removals break callers silently — give at least one RC cycle.
- **Don't amend commits after tagging.** The tag points to a specific commit SHA. Amending orphans the tag from the amended commit.
- **Don't push a tag before pushing the commit.** Push the commit first, then the tag. If the commit is not on the remote when the workflow runs, checkout will fail.

---

## See also

- `CHANGELOG.md` — full version history
- `.github/workflows/release.yml` — the release workflow; extracts CHANGELOG notes, calls `gh release create`
- `docs/runbooks/branch-protection-bypass.md` — if CI is blocking a commit that needs to land before the release tag
- [GitHub Releases page](https://github.com/kevinvwong/stack-agents/releases) — `gh release list` or the web UI
