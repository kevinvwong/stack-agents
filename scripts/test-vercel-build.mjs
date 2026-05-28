#!/usr/bin/env node
// Simulates a Vercel deployment build straight from vercel.json — exactly as
// Vercel runs it when the project's Root Directory is the repo root (`./`).
//
// Why this exists: branch protection is meant to gate `main` on the Vercel
// deploy check (ADR-002). That gate is only as trustworthy as the build it
// runs. If someone edits vercel.json's buildCommand/outputDirectory, or the
// dashboard build breaks, the Vercel deploy fails silently until a human
// notices. This test runs the vercel.json contract in CI so drift is caught
// on the PR that introduces it, not on a red deploy days later.
//
// It also de-risks the one-time web import: if this passes, importing the repo
// at vercel.com/new with Root Directory = ./ will build cleanly.
//
// Flags:
//   --check-only   validate vercel.json + assert existing output (skip build)
//   --no-clean     don't wipe outputDirectory before building
//
// Exit 0 = a Vercel deploy from this commit would succeed. Exit 1 = it wouldn't.

import {
  readFileSync,
  existsSync,
  statSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = resolve(REPO, "vercel.json");

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`✓ ${msg}`);

// 1. vercel.json must exist and parse
if (!existsSync(CONFIG)) fail("vercel.json not found at repo root");
let cfg;
try {
  cfg = JSON.parse(readFileSync(CONFIG, "utf8"));
} catch (e) {
  fail(`vercel.json is not valid JSON: ${e.message}`);
}
ok("vercel.json parses");

// 2. required fields for a Root-Directory=./ build
const { buildCommand, outputDirectory } = cfg;
if (!buildCommand) fail('vercel.json missing "buildCommand"');
if (!outputDirectory) fail('vercel.json missing "outputDirectory"');
ok(`buildCommand: ${buildCommand}`);
ok(`outputDirectory: ${outputDirectory}`);

// 3. guard the classic misconfig: the dashboard build reads ../agents,
//    ../commands, ../docs via sync-content.mjs, so the build MUST run from
//    repo root and descend into dashboard/. If buildCommand doesn't enter
//    the dashboard dir, the import was almost certainly set up with the wrong
//    Root Directory.
if (!/\bdashboard\b/.test(buildCommand)) {
  fail(
    'buildCommand does not reference "dashboard" — the build needs repo-root ' +
      "context so sync-content.mjs can read ../agents, ../commands, ../docs. " +
      "Set Vercel Root Directory to ./ (not dashboard/).",
  );
}
ok("buildCommand descends into dashboard/ (repo-root context preserved)");

const outDir = resolve(REPO, outputDirectory);

if (process.argv.includes("--check-only")) {
  if (!existsSync(outDir)) fail(`--check-only: ${outputDirectory} not present`);
  ok("--check-only: config valid + output present");
  process.exit(0);
}

// 4. clean prior output so the assertion proves THIS run produced it
if (!process.argv.includes("--no-clean") && existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}

// 5. run the exact vercel.json buildCommand from repo root
try {
  execSync(buildCommand, { cwd: REPO, stdio: "inherit", env: process.env });
} catch {
  fail("buildCommand failed — a Vercel deploy would fail with the same error");
}
ok("buildCommand completed");

// 6. assert the output is a servable SPA, not an empty/partial dir
if (!existsSync(outDir) || !statSync(outDir).isDirectory()) {
  fail(`outputDirectory "${outputDirectory}" was not produced by the build`);
}
if (!existsSync(resolve(outDir, "index.html"))) {
  fail(`${outputDirectory}/index.html missing — not a servable SPA`);
}
ok(`${outputDirectory}/index.html present`);

const assetsDir = resolve(outDir, "assets");
if (existsSync(assetsDir)) {
  const js = readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  if (js.length === 0)
    fail("no JS assets bundled — build produced an empty bundle");
  ok(`${js.length} JS asset(s) bundled`);
}

console.log(
  "\nVercel build simulation passed — a deploy from this commit will succeed " +
    "(web import: Root Directory = ./).",
);
