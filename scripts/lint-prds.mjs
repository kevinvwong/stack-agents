#!/usr/bin/env node
// scripts/lint-prds.mjs
//
// Structural lint for PRDs — the parts of /panel:publish's "product" lens
// that can be checked without invoking Claude. Verifies each PRD file
// (default: docs/prds/*.md) has the canonical sections and a measurable
// success metric.
//
// This is NOT a replacement for /panel:publish — that requires the LLM to
// judge whether the metric is good and the scope is tight. This is a
// cheap pre-flight that blocks obviously incomplete PRDs in CI.
//
// Usage:
//   node scripts/lint-prds.mjs                       # lint docs/prds/*.md in cwd
//   node scripts/lint-prds.mjs <path>...             # lint specific files
//   node scripts/lint-prds.mjs --root <repo-root>    # set the search root
//   node scripts/lint-prds.mjs --json                # JSON output for CI consumption
//   node scripts/lint-prds.mjs --quiet               # errors only
//
// Exits non-zero on any blocking finding.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const argv = process.argv.slice(2);
const args = new Set(argv);
const JSON_MODE = args.has("--json");
const QUIET = args.has("--quiet");

function getFlag(name) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
}

const ROOT = resolve(getFlag("--root") || process.cwd());
const explicitPaths = argv.filter((a) => !a.startsWith("--") && (a !== getFlag("--root")));

function walkPrds(dir) {
  const out = [];
  try {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      const stat = statSync(path);
      if (stat.isDirectory()) out.push(...walkPrds(path));
      else if (entry.endsWith(".md") && !entry.toLowerCase().includes("readme")) out.push(path);
    }
  } catch {}
  return out;
}

const SECTIONS = [
  { name: "Problem",          re: /^#{1,3}\s+problem\b/im,                                                  severity: "blocking" },
  { name: "User segment",     re: /^#{1,3}\s+(user\s+segment|users?|audience)\b/im,                          severity: "blocking" },
  { name: "Success metrics",  re: /^#{1,3}\s+(success\s+metrics?|primary\s+metric|metrics?\b)/im,           severity: "blocking" },
  { name: "Solution overview",re: /^#{1,3}\s+(solution(\s+overview)?|approach|design)\b/im,                 severity: "blocking" },
  { name: "Out of scope",     re: /^#{1,3}\s+(out\s+of\s+scope|non[-\s]?goals)\b/im,                         severity: "advisory" },
];

// Metric specificity: must mention a target value (e.g. "from X to Y", "+15%", "by 2026-Q3").
const METRIC_SPECIFICITY_RE = /(from\s+[\w.%]+\s+to\s+[\w.%]+|[+\-]\s*\d+(\.\d+)?\s*%|by\s+\d{4}|\d+(\.\d+)?\s*(req|rps|ms|s\b|users?))/i;

function lintFile(path) {
  const body = readFileSync(path, "utf8");
  const findings = [];

  // 1. Has a title?
  if (!/^#\s+\S/m.test(body)) {
    findings.push({ severity: "blocking", title: "No top-level heading (# ...) found" });
  }

  // 2. Has each required section?
  for (const s of SECTIONS) {
    if (!s.re.test(body)) {
      findings.push({ severity: s.severity, title: `Missing section: ${s.name}` });
    }
  }

  // 3. Success metric specificity — find the metric section, check for target.
  const headingRe = /(?:^|\n)#{1,3}[ \t]+(success[ \t]+metrics?|primary[ \t]+metric|metrics?\b)/i;
  const h = body.match(headingRe);
  let metricSection = "";
  if (h) {
    const after = body.slice(h.index + h[0].length);
    const nextHeading = after.search(/\n#{1,3}[ \t]/);
    metricSection = nextHeading === -1 ? after : after.slice(0, nextHeading);
  }
  if (h && !METRIC_SPECIFICITY_RE.test(metricSection)) {
    findings.push({
      severity: "advisory",
      title: "Success metric missing a specific target (e.g. 'from X to Y', '+15%', 'by 2026-Q3')",
    });
  }

  // 4. Source URL — at least one https:// URL near the top (first 30 lines) for a stable Source.
  const head = body.split("\n").slice(0, 30).join("\n");
  if (!/\bhttps?:\/\/\S+/.test(head)) {
    findings.push({
      severity: "advisory",
      title: "No URL in the first 30 lines — publishing needs a stable Source URL (PR / file permalink)",
    });
  }

  return findings;
}

function main() {
  const targets = explicitPaths.length
    ? explicitPaths.map((p) => resolve(p))
    : walkPrds(join(ROOT, "docs", "prds"));

  if (!targets.length) {
    if (JSON_MODE) console.log(JSON.stringify({ skipped: true, reason: "no PRD files found" }));
    else if (!QUIET) console.log("lint-prds: no PRDs found under docs/prds/ — skipping.");
    process.exit(0);
  }

  const result = { files: [], totals: { blocking: 0, advisory: 0 } };
  for (const path of targets) {
    const findings = lintFile(path);
    const blocking = findings.filter((f) => f.severity === "blocking").length;
    const advisory = findings.filter((f) => f.severity === "advisory").length;
    result.totals.blocking += blocking;
    result.totals.advisory += advisory;
    result.files.push({ file: relative(ROOT, path), findings });
  }

  if (JSON_MODE) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (!QUIET) {
      console.log(`Scanned ${result.files.length} PRD(s)`);
    }
    for (const f of result.files) {
      if (!f.findings.length) {
        if (!QUIET) console.log(`  OK  ${f.file}`);
      } else {
        console.log(`  ${f.file}`);
        for (const fnd of f.findings) {
          const tag = fnd.severity === "blocking" ? "FAIL" : "warn";
          console.log(`    [${tag}] ${fnd.title}`);
        }
      }
    }
    console.log("");
    console.log(`Totals: ${result.totals.blocking} blocking, ${result.totals.advisory} advisory`);
  }

  process.exit(result.totals.blocking > 0 ? 1 : 0);
}

main();
