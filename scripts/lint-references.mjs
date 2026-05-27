#!/usr/bin/env node
// scripts/lint-references.mjs
//
// Validates that every [AGENT: X] and /namespace:verb reference inside the
// agent / command / orchestrator markdown points to an agent or command that
// actually exists. Fails CI when a reference is broken.
//
// Usage:
//   node scripts/lint-references.mjs              # lint, exit non-zero on errors
//   node scripts/lint-references.mjs --json       # emit JSON for CI consumption
//   node scripts/lint-references.mjs --quiet      # print only errors
//
// No external dependencies. Targets Node 18+.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);

const args = new Set(process.argv.slice(2));
const JSON_MODE = args.has("--json");
const QUIET = args.has("--quiet");

const AGENT_DIR = join(ROOT, "agents");
const COMMAND_DIR = join(ROOT, "commands");
// Cross-plugin agent sources — these provide names that handoff lines may
// reference legitimately even though they don't live in agents/.
const EXTERNAL_AGENT_DIRS = [join(ROOT, "plugins/kwong-agents/agents")];
const EXTRA_FILES = ["CLAUDE.md", "agents/README.md", "commands/README.md"];
const IGNORE_FILE = join(ROOT, ".lint-references-ignore");

// Patterns we trust as "this is a placeholder, not a real reference."
// Anything containing < or > (e.g. <agent>, <name>) is treated as templated.
// Single-word tokens like agent1, agent2 are template examples.
const PLACEHOLDER_RE = /[<>]|^(agent|command|agentN?|cmd|namespace|verb)\d*$/i;

function walkMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      out.push(...walkMarkdown(path));
    } else if (entry.endsWith(".md")) {
      out.push(path);
    }
  }
  return out;
}

function readFrontmatterName(path) {
  const body = readFileSync(path, "utf8");
  const m = body.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  const nameLine = m[1].split("\n").find((l) => /^name:\s*/.test(l));
  if (!nameLine) return null;
  return nameLine.replace(/^name:\s*/, "").trim();
}

function stripCodeBlocks(body) {
  // Remove fenced code blocks so references inside ``` don't count.
  return body.replace(/```[\s\S]*?```/g, "");
}

function collectAgents() {
  const set = new Set();
  const dirs = [AGENT_DIR, ...EXTERNAL_AGENT_DIRS.filter((d) => {
    try { return statSync(d).isDirectory(); } catch { return false; }
  })];
  for (const dir of dirs) {
    for (const path of walkMarkdown(dir)) {
      if (path.endsWith("/README.md")) continue;
      const name = readFrontmatterName(path);
      if (name) set.add(name);
    }
  }
  return set;
}

function loadIgnoreList() {
  try {
    const body = readFileSync(IGNORE_FILE, "utf8");
    return new Set(
      body
        .split("\n")
        .map((l) => l.replace(/#.*$/, "").trim())
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

function collectCommands() {
  const set = new Set();
  for (const path of walkMarkdown(COMMAND_DIR)) {
    if (path.endsWith("/README.md")) continue;
    const name = readFrontmatterName(path);
    if (name) set.add(name);
  }
  return set;
}

function findAgentRefs(body) {
  // Matches [AGENT: name] — the name may include dashes, colons (sprint:foo).
  const refs = [];
  const re = /\[AGENT:\s*([A-Za-z0-9_:\-<>]+)\s*\]/g;
  let m;
  while ((m = re.exec(body))) {
    refs.push({ name: m[1], index: m.index });
  }
  return refs;
}

function findCommandRefs(body) {
  // Matches /namespace:verb at word boundaries.
  // Excludes path-like uses (e.g. /home/user/...) by requiring lowercase
  // namespace followed by colon.
  const refs = [];
  const re = /(?<![\w/])\/([a-z][a-z0-9\-]*):([a-z][a-z0-9\-<>:]*)/g;
  let m;
  while ((m = re.exec(body))) {
    refs.push({ name: `${m[1]}:${m[2]}`, index: m.index });
  }
  return refs;
}

function isPlaceholder(name) {
  if (PLACEHOLDER_RE.test(name)) return true;
  // Composite placeholders like sprint:<name>, panel:sprint:<name>
  if (name.includes("<") || name.includes(">")) return true;
  return false;
}

function lineOf(body, index) {
  return body.slice(0, index).split("\n").length;
}

function lint() {
  const agents = collectAgents();
  const commands = collectCommands();
  const ignore = loadIgnoreList();

  const files = [
    ...walkMarkdown(AGENT_DIR),
    ...walkMarkdown(COMMAND_DIR),
    ...EXTRA_FILES.map((p) => join(ROOT, p)),
  ].filter((p) => !p.endsWith("/README.md") || EXTRA_FILES.some((e) => p.endsWith(e)));

  const errors = [];
  let agentRefCount = 0;
  let commandRefCount = 0;

  for (const path of files) {
    let body;
    try {
      body = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    const stripped = stripCodeBlocks(body);
    const rel = relative(ROOT, path);

    for (const ref of findAgentRefs(stripped)) {
      if (isPlaceholder(ref.name)) continue;
      agentRefCount++;
      if (!agents.has(ref.name) && !ignore.has(`agent:${ref.name}`)) {
        errors.push({
          kind: "agent",
          name: ref.name,
          file: rel,
          line: lineOf(stripped, ref.index),
        });
      }
    }

    for (const ref of findCommandRefs(stripped)) {
      if (isPlaceholder(ref.name)) continue;
      commandRefCount++;
      if (!commands.has(ref.name) && !ignore.has(`command:${ref.name}`)) {
        errors.push({
          kind: "command",
          name: ref.name,
          file: rel,
          line: lineOf(stripped, ref.index),
        });
      }
    }
  }

  return {
    agents: [...agents].sort(),
    commands: [...commands].sort(),
    agentRefCount,
    commandRefCount,
    fileCount: files.length,
    errors,
  };
}

const result = lint();

if (JSON_MODE) {
  console.log(JSON.stringify(result, null, 2));
} else {
  if (!QUIET) {
    console.log(`Scanned ${result.fileCount} files`);
    console.log(`Found ${result.agents.length} agents, ${result.commands.length} commands`);
    console.log(`Validated ${result.agentRefCount} [AGENT:] refs, ${result.commandRefCount} /cmd: refs`);
  }
  if (result.errors.length === 0) {
    if (!QUIET) console.log("OK — all references resolve.");
  } else {
    console.error(`\n${result.errors.length} broken reference(s):\n`);
    for (const e of result.errors) {
      console.error(`  ${e.file}:${e.line}  unknown ${e.kind}: ${e.name}`);
    }
  }
}

process.exit(result.errors.length === 0 ? 0 : 1);
