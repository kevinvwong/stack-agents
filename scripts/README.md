# scripts/

Maintenance scripts for the stack-agents repo. All scripts are zero-dependency Node 18+ ESM modules. Run them from the repo root.

---

## lint-references.mjs

**Purpose.** Validates that every `[AGENT: X]` and `/namespace:verb` reference in agent, command, and orchestrator markdown files resolves to an agent or command that actually exists.

**Usage.**
```
node scripts/lint-references.mjs
node scripts/lint-references.mjs --root <path>   # explicit repo root
node scripts/lint-references.mjs --json          # machine-readable output
node scripts/lint-references.mjs --quiet         # errors only, no summary
```

**Inputs.**
- `agents/**/*.md` — each file's `name:` frontmatter registers a known agent name
- `commands/**/*.md` — each file's `name:` frontmatter registers a known command name
- `plugins/kwong-agents/agents/**/*.md` — additional cross-plugin agent names (if present)
- `CLAUDE.md`, `agents/README.md`, `commands/README.md` — also linted for broken references
- `.lint-references-ignore` — optional newline-separated ignore list; entries take the form `agent:<name>` or `command:<name>`

**Outputs.**
- Prints a summary and any broken references to stdout/stderr.
- With `--json`: prints a single JSON object with `agents`, `commands`, `errors`, and counts.

**Exit codes.**
- `0` — all references resolve (or no `agents/` + `commands/` directories found — script no-ops silently)
- `1` — one or more `[AGENT:]` or `/cmd:` references point to a name with no matching file

**When CI runs it.** Job `references` ("Agent + command reference linter") in `.github/workflows/ci.yml`, step "Lint [AGENT:] and /cmd: references".

**How to fix a failure.**

1. Read the error lines: `<file>:<line>  unknown agent: <name>` or `unknown command: <name>`.
2. Either the referenced name is a typo (fix the reference), the target agent/command file is missing its `name:` frontmatter (add it), or the file hasn't been created yet (create it).
3. If a reference is intentionally forward-declared and you want to suppress the error temporarily, add `agent:<name>` or `command:<name>` to `.lint-references-ignore` at the repo root.

---

## sync-commands.mjs

**Purpose.** Copies every command file from the human-navigable `commands/` source tree into the flat `​.claude/commands/` registry that Claude Code reads, renaming files according to frontmatter `name:` fields.

**Usage.**
```
node scripts/sync-commands.mjs
```

No flags. Always operates on the repo root relative to the script's own location.

**Inputs.**
- `commands/**/*.md` (excluding `README.md` files) — source command files; the `name:` frontmatter field determines the flat output filename

**Outputs.**
- Writes/overwrites files under `.claude/commands/` using the naming convention `<namespace>-<verb>.md` derived from `name: namespace:verb` frontmatter.
- Prints one `synced` line per file that was updated and a final summary count.
- Files already in sync (identical content) are skipped.

**Exit codes.**
- `0` always — the script does not exit non-zero on its own.

The CI job detects drift by running `git diff --exit-code .claude/commands/` after the script and failing if any files changed.

**When CI runs it.** Job `references` in `.github/workflows/ci.yml`, step "Check commands/ → .claude/commands/ sync". The job fails with exit code 1 if the sync produced any git-visible changes, meaning `.claude/commands/` was out of date.

**How to fix a failure.**

The CI error message is: `ERROR: .claude/commands/ is out of sync with commands/ — run 'node scripts/sync-commands.mjs' and commit the result`.

Run the script locally and commit the changes it produces:

```
node scripts/sync-commands.mjs
git add .claude/commands/
git commit -m "chore: sync .claude/commands/ from commands/"
```

This happens whenever you add or rename a file under `commands/` without running the sync script.

---

## lint-prds.mjs

**Purpose.** Structurally lints PRD files to verify they contain the required sections and a measurable success metric before they can be published.

**Usage.**
```
node scripts/lint-prds.mjs                        # lint docs/prds/*.md in cwd
node scripts/lint-prds.mjs <path>...              # lint specific files
node scripts/lint-prds.mjs --root <repo-root>     # set the search root
node scripts/lint-prds.mjs --json                 # machine-readable output
node scripts/lint-prds.mjs --quiet                # errors only, no summary
```

**Inputs.**
- `docs/prds/**/*.md` by default (excludes files containing "readme" in the name)
- Or explicit file paths passed as positional arguments

**Outputs.**
- Reports `[FAIL]` (blocking) and `[warn]` (advisory) findings per file, then a totals line.
- With `--json`: prints a structured object with per-file findings and aggregate totals.

**What it checks.**

| Check | Severity |
|---|---|
| Top-level `#` heading present | blocking |
| `## Problem` section present | blocking |
| `## User segment` (or `## Users` / `## Audience`) section present | blocking |
| `## Success metrics` (or `## Primary metric` / `## Metrics`) section present | blocking |
| `## Solution overview` (or `## Approach` / `## Design`) section present | blocking |
| `## Out of scope` (or `## Non-goals`) section present | advisory |
| Success metric contains a specific target (`+15%`, `from X to Y`, `by 2026-Q3`, etc.) | advisory |
| An `https://` URL appears in the first 30 lines (stable Source URL for publishing) | advisory |

**Exit codes.**
- `0` — no blocking findings (advisory findings do not block)
- `0` — no PRD files found under `docs/prds/` (script skips silently)
- `1` — one or more blocking findings across any linted file

**When CI runs it.** Job `prds` ("PRD structural linter") in `.github/workflows/ci.yml`, step "Lint docs/prds/*.md", invoked as `node scripts/lint-prds.mjs --root .`.

**How to fix a failure.**

The output identifies which file and which section is missing. Add the missing section heading to the PRD. Section headings are matched case-insensitively at `#`, `##`, or `###` level — the exact wording must match one of the accepted variants listed in the table above.

Advisory warnings (`[warn]`) do not fail CI but indicate the PRD will be rejected by `/panel:publish`'s product review lens.
