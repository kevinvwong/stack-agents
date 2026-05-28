#!/usr/bin/env node
// dashboard/scripts/sync-content.mjs
//
// Copies repo content (agents/, commands/, docs/, sprints/) into the
// dashboard's build-time content directory. Excluded from git via .gitignore.
//
// Why a script: the old inline `sync-agents` command only handled agents/.
// Phase 9 (#47) extended this to commands/ and docs/ so the dashboard can
// render every spec at routes like /agents/<name>, /commands/<ns>/<verb>,
// /docs/<slug>. #97 added sprints/ so the sprint registry surfaces in the
// Projects tab.
//
// No external dependencies. Targets Node 18+.

import { cpSync, rmSync, mkdirSync, statSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DASHBOARD = resolve(fileURLToPath(new URL("..", import.meta.url)));
const REPO = resolve(DASHBOARD, "..");
const TARGET = resolve(DASHBOARD, "src", "content");

const SOURCES = [
  { name: "agents", from: resolve(REPO, "agents") },
  { name: "commands", from: resolve(REPO, "commands") },
  { name: "docs", from: resolve(REPO, "docs") },
  { name: "sprints", from: resolve(REPO, "sprints") },
];

// Per-source filter: agents/commands/docs are markdown surfaces, sprints/
// also carries the JSON/JSONL registry alongside roster/panel/orchestrator
// markdown files.
const ALLOWED_EXT = {
  agents: new Set([".md"]),
  commands: new Set([".md"]),
  docs: new Set([".md"]),
  sprints: new Set([".md", ".json", ".jsonl"]),
};

function makeFilter(name) {
  const allowed = ALLOWED_EXT[name];
  return (src) => {
    if (src.endsWith("README.md")) return false;
    if (src.includes("/.deprecated/")) return false;
    // Directories pass through (cpSync calls filter for each entry — must
    // return true for dirs to recurse).
    try {
      if (statSync(src).isDirectory()) return true;
    } catch {
      /* fall through to ext check */
    }
    if (!allowed) return true;
    const dot = src.lastIndexOf(".");
    const ext = dot >= 0 ? src.slice(dot) : "";
    return allowed.has(ext);
  };
}

function countFiles(dir, exts) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) n += countFiles(p, exts);
    else {
      const dot = e.name.lastIndexOf(".");
      const ext = dot >= 0 ? e.name.slice(dot) : "";
      if (exts.has(ext)) n++;
    }
  }
  return n;
}

mkdirSync(TARGET, { recursive: true });

const results = SOURCES.map(({ name, from }) => {
  try {
    statSync(from);
  } catch {
    console.error(`sync-content: source missing: ${from} — skipping`);
    return { name, copied: 0 };
  }
  const to = resolve(TARGET, name);
  // Clean target subdir first so deletions in source propagate.
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true, filter: makeFilter(name) });
  return { name, copied: countFiles(to, ALLOWED_EXT[name]) };
});

const total = results.reduce((s, r) => s + r.copied, 0);
console.log(
  `sync-content: ${total} content files copied — ` +
    results.map((r) => `${r.name}=${r.copied}`).join(", "),
);
