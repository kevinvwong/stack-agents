#!/usr/bin/env bash
# Deploy kwong-claude-marketplace artifacts to ~/.claude/
#
# Bash port of install.ps1 — see that script's header for the canonical spec.
# Copies agents, commands, and skills from the marketplace repo directly into
# the Claude Code user directory (~/.claude/). Skips files already present
# and identical; backs up any files it would overwrite.
#
# Source of truth for each artifact type:
#   Agents    — agents/  (canonical; plugins/kwong-agents/ is a sibling source)
#   Commands  — plugins/kwong-commands/commands/  (flat namespace)
#   Skills    — plugins/kwong-skills/skills/
#   CLAUDE.md — CLAUDE.md (root orchestrator → ~/.claude/CLAUDE.md)
#
# Stale-file cleanup:
#   Tracks installer-owned agent filenames in a manifest at
#   ~/.claude/kwong-stack-agents.manifest. Files previously installed
#   that no longer exist in source are removed (backed up first).
#   Foreign agents (not in the manifest) are never touched.
#
# Bash 3.2-compatible (works on macOS's default /bin/bash).

# Per-file errors must not abort the whole install — match install.ps1's
# Copy-WithBackup semantics where each file is attempted independently.
# We intentionally do NOT use `set -e`. We do enable `-u` and pipefail for
# safety on unset vars / pipe failures in the script body.
set -uo pipefail

# --- Paths ------------------------------------------------------------------

# Resolve the directory containing this script (the repo root).
SCRIPT_SOURCE="${BASH_SOURCE[0]}"
# Follow symlinks to the real script location.
while [ -L "$SCRIPT_SOURCE" ]; do
    SCRIPT_DIR="$(cd -P "$(dirname "$SCRIPT_SOURCE")" && pwd)"
    SCRIPT_SOURCE="$(readlink "$SCRIPT_SOURCE")"
    case "$SCRIPT_SOURCE" in
        /*) ;;
        *) SCRIPT_SOURCE="$SCRIPT_DIR/$SCRIPT_SOURCE" ;;
    esac
done
REPO_ROOT="$(cd -P "$(dirname "$SCRIPT_SOURCE")" && pwd)"

CLAUDE_DIR="$HOME/.claude"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$CLAUDE_DIR/backups/kwong-marketplace-$TIMESTAMP"

AGENTS_SRC1="$REPO_ROOT/plugins/kwong-agents/agents"
AGENTS_SRC2="$REPO_ROOT/agents"
COMMANDS_SRC="$REPO_ROOT/plugins/kwong-commands/commands"
SKILLS_SRC="$REPO_ROOT/plugins/kwong-skills/skills"
CLAUDE_MD_SRC="$REPO_ROOT/CLAUDE.md"

AGENTS_DST="$CLAUDE_DIR/agents"
COMMANDS_DST="$CLAUDE_DIR/commands"
SKILLS_DST="$CLAUDE_DIR/skills"
CLAUDE_MD_DST="$CLAUDE_DIR/CLAUDE.md"

MANIFEST_PATH="$CLAUDE_DIR/kwong-stack-agents.manifest"

# --- Stats ------------------------------------------------------------------

stats_copied=0
stats_skipped=0
stats_backed_up=0
stats_removed=0

# --- Colors (only if stdout is a TTY) ---------------------------------------

if [ -t 1 ]; then
    C_CYAN=$'\033[36m'
    C_GREEN=$'\033[32m'
    C_YELLOW=$'\033[33m'
    C_RESET=$'\033[0m'
else
    C_CYAN=""
    C_GREEN=""
    C_YELLOW=""
    C_RESET=""
fi

# --- Helpers ----------------------------------------------------------------

ensure_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
    fi
}

# Cross-platform SHA-256 — prefer shasum (BSD/macOS + many Linux),
# fall back to sha256sum (Linux), then to openssl. Returns empty on failure.
sha256_of() {
    local file="$1"
    if command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$file" 2>/dev/null | awk '{print $1}'
    elif command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$file" 2>/dev/null | awk '{print $1}'
    elif command -v openssl >/dev/null 2>&1; then
        openssl dgst -sha256 "$file" 2>/dev/null | awk '{print $NF}'
    else
        # No hashing tool available — return empty so caller treats as
        # "different" and copies. This matches the PowerShell behavior of
        # always copying when in doubt.
        echo ""
    fi
}

copy_with_backup() {
    local src="$1"
    local dst="$2"

    if [ ! -f "$src" ]; then
        echo ""
        echo "  warning: source missing: $src" >&2
        return 1
    fi

    if [ -f "$dst" ]; then
        local src_hash dst_hash
        src_hash="$(sha256_of "$src")"
        dst_hash="$(sha256_of "$dst")"
        if [ -n "$src_hash" ] && [ -n "$dst_hash" ] && [ "$src_hash" = "$dst_hash" ]; then
            stats_skipped=$((stats_skipped + 1))
            return 0
        fi
        # Back up the existing file before overwriting. Preserve the path
        # relative to ~/.claude so the backup tree mirrors the destination.
        ensure_dir "$BACKUP_DIR"
        local rel="${dst#$CLAUDE_DIR/}"
        local backup_path="$BACKUP_DIR/$rel"
        ensure_dir "$(dirname "$backup_path")"
        if cp -p "$dst" "$backup_path" 2>/dev/null; then
            stats_backed_up=$((stats_backed_up + 1))
        else
            echo ""
            echo "  warning: failed to back up: $dst" >&2
        fi
    fi

    ensure_dir "$(dirname "$dst")"
    if cp -p "$src" "$dst" 2>/dev/null; then
        stats_copied=$((stats_copied + 1))
    else
        echo ""
        echo "  warning: failed to copy: $src → $dst" >&2
        return 1
    fi
    return 0
}

# --- Banner -----------------------------------------------------------------

echo ""
echo "${C_CYAN}kwong-claude-marketplace installer${C_RESET}"
echo "${C_CYAN}Deploying to: $CLAUDE_DIR${C_RESET}"
echo ""

ensure_dir "$CLAUDE_DIR"

# --- CLAUDE.md (root orchestrator) -----------------------------------------

printf "CLAUDE.md..."
copy_with_backup "$CLAUDE_MD_SRC" "$CLAUDE_MD_DST"
echo " done"

# --- kwong-agents -----------------------------------------------------------

printf "kwong-agents..."
ensure_dir "$AGENTS_DST"
if [ -d "$AGENTS_SRC1" ]; then
    # Bash 3.2-compatible: iterate with find + read loop (NUL-delimited
    # would need bash 4; filenames here are ASCII basenames so newline is safe).
    while IFS= read -r src_file; do
        [ -z "$src_file" ] && continue
        base="$(basename "$src_file")"
        copy_with_backup "$src_file" "$AGENTS_DST/$base"
    done <<EOF
$(find "$AGENTS_SRC1" -maxdepth 1 -type f -name '*.md' 2>/dev/null | LC_ALL=C sort)
EOF
fi
echo " done"

# --- stack-agents (from agents/ — canonical source) ------------------------

printf "stack-agents..."
ensure_dir "$AGENTS_DST"
if [ -d "$AGENTS_SRC2" ]; then
    # Exclude README.md and anything under a .deprecated/ subtree.
    while IFS= read -r src_file; do
        [ -z "$src_file" ] && continue
        base="$(basename "$src_file")"
        [ "$base" = "README.md" ] && continue
        case "$src_file" in
            */.deprecated/*) continue ;;
        esac
        copy_with_backup "$src_file" "$AGENTS_DST/$base"
    done <<EOF
$(find "$AGENTS_SRC2" -type f -name '*.md' 2>/dev/null | LC_ALL=C sort)
EOF
fi
echo " done"

# --- Commands (flat copy of all .md files from all subdirectories) ---------

printf "Commands..."
ensure_dir "$COMMANDS_DST"
if [ -d "$COMMANDS_SRC" ]; then
    while IFS= read -r src_file; do
        [ -z "$src_file" ] && continue
        base="$(basename "$src_file")"
        copy_with_backup "$src_file" "$COMMANDS_DST/$base"
    done <<EOF
$(find "$COMMANDS_SRC" -type f -name '*.md' 2>/dev/null | LC_ALL=C sort)
EOF
fi
echo " done"

# --- Skills (preserve per-skill subdirectory structure) --------------------

printf "Skills..."
ensure_dir "$SKILLS_DST"
if [ -d "$SKILLS_SRC" ]; then
    while IFS= read -r skill_dir; do
        [ -z "$skill_dir" ] && continue
        skill_name="$(basename "$skill_dir")"
        skill_dst="$SKILLS_DST/$skill_name"
        ensure_dir "$skill_dst"
        while IFS= read -r src_file; do
            [ -z "$src_file" ] && continue
            base="$(basename "$src_file")"
            copy_with_backup "$src_file" "$skill_dst/$base"
        done <<EOF
$(find "$skill_dir" -maxdepth 1 -type f 2>/dev/null | LC_ALL=C sort)
EOF
    done <<EOF
$(find "$SKILLS_SRC" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | LC_ALL=C sort)
EOF
fi
echo " done"

# --- Stale agent cleanup ---------------------------------------------------
#
# Manifest-based, matching install.ps1:
#   1. Read the previous manifest (basenames we own).
#   2. Build the current valid set from source dirs.
#   3. Remove any manifest entry no longer in the current valid set.
#   4. Rewrite the manifest with the current valid set.
# Files in ~/.claude/agents/ not in the manifest are NEVER touched.

printf "Stale cleanup..."

# Build current valid set (use a temp file — bash 3.2 has no associative arrays).
current_valid_file="$(mktemp 2>/dev/null || mktemp -t kwong-current)"
previous_owned_file="$(mktemp 2>/dev/null || mktemp -t kwong-previous)"
trap 'rm -f "$current_valid_file" "$previous_owned_file" 2>/dev/null' EXIT

if [ -d "$AGENTS_SRC1" ]; then
    find "$AGENTS_SRC1" -maxdepth 1 -type f -name '*.md' -exec basename {} \; 2>/dev/null >> "$current_valid_file"
fi
if [ -d "$AGENTS_SRC2" ]; then
    while IFS= read -r src_file; do
        [ -z "$src_file" ] && continue
        base="$(basename "$src_file")"
        [ "$base" = "README.md" ] && continue
        case "$src_file" in
            */.deprecated/*) continue ;;
        esac
        echo "$base" >> "$current_valid_file"
    done <<EOF
$(find "$AGENTS_SRC2" -type f -name '*.md' 2>/dev/null)
EOF
fi

# Deduplicate + sort the current valid set.
LC_ALL=C sort -u "$current_valid_file" -o "$current_valid_file"

# Read previous manifest (empty on first run).
if [ -f "$MANIFEST_PATH" ]; then
    # Strip empty lines + sort for diffing.
    grep -v '^[[:space:]]*$' "$MANIFEST_PATH" 2>/dev/null | LC_ALL=C sort -u > "$previous_owned_file"
fi

# Remove files we previously installed but are no longer in source.
if [ -d "$AGENTS_DST" ] && [ -s "$previous_owned_file" ]; then
    # comm -23: lines only in previous (not in current)
    while IFS= read -r stale; do
        [ -z "$stale" ] && continue
        target="$AGENTS_DST/$stale"
        if [ -f "$target" ]; then
            ensure_dir "$BACKUP_DIR"
            backup_path="$BACKUP_DIR/agents/$stale"
            ensure_dir "$(dirname "$backup_path")"
            if cp -p "$target" "$backup_path" 2>/dev/null && rm -f "$target"; then
                stats_removed=$((stats_removed + 1))
                printf "\n  removed stale: %s" "$stale"
            else
                echo ""
                echo "  warning: failed to remove stale: $stale" >&2
            fi
        fi
    done < <(comm -23 "$previous_owned_file" "$current_valid_file")
fi

# Write updated manifest.
if cp "$current_valid_file" "$MANIFEST_PATH" 2>/dev/null; then
    :
else
    echo ""
    echo "  warning: failed to write manifest: $MANIFEST_PATH" >&2
fi

echo " done"

# --- Results ----------------------------------------------------------------

echo ""
echo "${C_GREEN}Results:${C_RESET}"
echo "  Copied   : $stats_copied"
echo "  Skipped  : $stats_skipped (identical)"
echo "  Backed up: $stats_backed_up (originals in $BACKUP_DIR)"
if [ "$stats_removed" -gt 0 ]; then
    echo "${C_YELLOW}  Removed  : $stats_removed stale agents (backed up to $BACKUP_DIR)${C_RESET}"
fi
echo ""

if [ "$stats_copied" -gt 0 ] || [ "$stats_removed" -gt 0 ]; then
    echo "${C_YELLOW}Restart Claude Code (or open a new session) to pick up the changes.${C_RESET}"
else
    echo "${C_GREEN}Everything already up to date.${C_RESET}"
fi

exit 0
