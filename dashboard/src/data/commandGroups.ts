// Maps command folder names (the filesystem layout under commands/) to the
// 9 canonical agent families from families.ts, plus a few non-family buckets
// for groups that don't fit a single family (panels, docs, security, GTLI).
//
// Why this exists: the Commands tab used to group purely by folder name (~20
// alphabetical buckets like `ai`, `auth`, `gh`, `web`). That conflicted with
// the Agents tab, which groups by family. A user who internalized "Web Stack"
// on the Agents tab found no "Web Stack" group on the Commands tab — only
// `web`, `ai`, `stack`, `debug` etc. scattered alphabetically. This mapping
// re-projects the folder layout onto the family taxonomy so the two tabs
// share one mental model. (Issue #113.)

import { FAMILY_NAMES, type Family } from "../families";

// Buckets that don't correspond to a single agent family. Appended to the
// end of the sidebar after the 9 family groups.
export const NON_FAMILY_GROUPS = [
  "Panels",
  "GTLI (Language Learning)",
  "Security",
  "Docs",
  "Other",
] as const;

export type CommandGroup = Family | (typeof NON_FAMILY_GROUPS)[number];

// Canonical display order: families first (matching Agents tab), then the
// non-family buckets.
export const COMMAND_GROUP_ORDER: CommandGroup[] = [
  ...FAMILY_NAMES,
  ...NON_FAMILY_GROUPS,
];

// Folder → group. Anything not listed falls through to 'Other'.
export const FOLDER_TO_GROUP: Record<string, CommandGroup> = {
  // Web Stack
  web: "Web Stack",
  stack: "Web Stack",
  ai: "Web Stack",
  debug: "Web Stack",
  // GitHub
  gh: "GitHub",
  github: "GitHub",
  // Quality
  quality: "Quality",
  review: "Quality",
  // Research
  research: "Research",
  // Product
  product: "Product",
  analytics: "Product",
  // Cross-cutting
  finops: "Cross-cutting",
  i18n: "Cross-cutting",
  // Workspace
  notion: "Workspace",
  knowledge: "Workspace",
  publish: "Workspace",
  // Game Design
  game: "Game Design",
  // Meta
  agents: "Meta",
  sprint: "Meta",
  setup: "Meta",
  // Top-level *.md files (e.g. orchestrate.md) — data/commands.ts emits
  // group: 'commands' for those.
  commands: "Meta",
  // Non-family buckets
  panel: "Panels",
  content: "Panels",
  design: "Panels",
  gtli: "GTLI (Language Learning)",
  auth: "Security",
  security: "Security",
  docs: "Docs",
};

export function groupForFolder(folder: string): CommandGroup {
  return FOLDER_TO_GROUP[folder] ?? "Other";
}
