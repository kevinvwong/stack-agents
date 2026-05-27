#!/usr/bin/env node
// scripts/sync-commands.mjs
//
// Syncs commands/ (source tree) → .claude/commands/ (flat registry that
// Claude Code loads). Run manually or add to a pre-commit hook.
//
// Naming convention:
//   commands/<family>/<family>-<verb>.md  →  .claude/commands/<family>-<verb>.md
//   commands/<family>/<something>-panel.md  →  .claude/commands/panel-<something>.md
//   commands/orchestrate.md               →  .claude/commands/orchestrate.md
//
// Why a script: Claude Code loads commands from a flat directory. The
// subdirectory layout under commands/ is for human navigation only.
// Any file added to commands/ that isn't copied here is simply invisible
// to Claude — no error, no warning, just a silently missing slash command.
//
// No external dependencies. Node 18+.

import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO    = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC     = resolve(REPO, "commands");
const DEST    = resolve(REPO, ".claude", "commands");

mkdirSync(DEST, { recursive: true });

// Collect all .md files under commands/ recursively, skip READMEs.
function collectMd(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectMd(p));
    else if (entry.name.endsWith(".md") && entry.name !== "README.md") results.push(p);
  }
  return results;
}

// Map a source path to its flat destination filename.
// Panel commands are stored as <family>-panel.md but Claude Code convention
// names them panel-<family>.md to group them visually. We read the `name:`
// frontmatter and derive the flat filename from it instead of path heuristics.
function flatName(srcPath) {
  const raw = readFileSync(srcPath, "utf8");
  const m   = raw.match(/^---\s*\nname:\s*(.+?)\s*\n/m);
  if (!m) {
    // Fallback: use basename as-is
    return basename(srcPath);
  }
  // name: panel:notion  →  panel-notion.md
  // name: notion:publish → notion-publish.md
  // name: orchestrate    → orchestrate.md
  return m[1].replace(":", "-") + ".md";
}

const sources = collectMd(SRC);
let copied = 0, skipped = 0;

for (const src of sources) {
  const destName = flatName(src);
  const dest     = resolve(DEST, destName);

  // Only copy if source is newer or dest doesn't exist.
  let needsCopy = true;
  try {
    const srcMtime  = statSync(src).mtimeMs;
    const destMtime = statSync(dest).mtimeMs;
    const srcContent  = readFileSync(src,  "utf8");
    const destContent = readFileSync(dest, "utf8");
    if (srcContent === destContent) { needsCopy = false; }
  } catch { /* dest missing → needsCopy stays true */ }

  if (needsCopy) {
    cpSync(src, dest);
    console.log(`  synced  ${src.replace(REPO + "/", "")} → .claude/commands/${destName}`);
    copied++;
  } else {
    skipped++;
  }
}

console.log(`\nsync-commands: ${copied} updated, ${skipped} already current — ${sources.length} total commands`);
