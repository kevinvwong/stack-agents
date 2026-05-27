#!/usr/bin/env node
// dashboard/scripts/sync-content.mjs
//
// Copies repo content (agents/, commands/, docs/) into the dashboard's
// build-time content directory. Excluded from git via .gitignore.
//
// Why a script: the old inline `sync-agents` command only handled agents/.
// Phase 9 (#47) extended this to commands/ and docs/ so the dashboard can
// render every spec at routes like /agents/<name>, /commands/<ns>/<verb>,
// /docs/<slug>.
//
// No external dependencies. Targets Node 18+.

import { cpSync, rmSync, mkdirSync, statSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DASHBOARD = resolve(fileURLToPath(new URL("..", import.meta.url)));
const REPO = resolve(DASHBOARD, "..");
const TARGET = resolve(DASHBOARD, "src", "content");

const SOURCES = [
  { name: "agents",   from: resolve(REPO, "agents") },
  { name: "commands", from: resolve(REPO, "commands") },
  { name: "docs",     from: resolve(REPO, "docs") },
];

// Skip README.md (catalog indexes, not content pages in the dashboard sense)
// and any file under a .deprecated/ subdir.
const filter = (src) => {
  if (src.endsWith("README.md")) return false;
  if (src.includes("/.deprecated/")) return false;
  return true;
};

function countMd(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) n += countMd(p);
    else if (e.name.endsWith(".md")) n++;
  }
  return n;
}

mkdirSync(TARGET, { recursive: true });

const results = SOURCES.map(({ name, from }) => {
  try { statSync(from); }
  catch {
    console.error(`sync-content: source missing: ${from} — skipping`);
    return { name, copied: 0 };
  }
  const to = resolve(TARGET, name);
  // Clean target subdir first so deletions in source propagate.
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true, filter });
  return { name, copied: countMd(to) };
});

const total = results.reduce((s, r) => s + r.copied, 0);
console.log(
  `sync-content: ${total} markdown files copied — ` +
  results.map((r) => `${r.name}=${r.copied}`).join(", ")
);
