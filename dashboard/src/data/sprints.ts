// dashboard/src/data/sprints.ts
//
// Loads the stack-agents sprint registry from the synced content tree
// (dashboard/src/content/sprints/, populated by scripts/sync-content.mjs).
//
// The canonical store is sprints/registry.json — { sprints: [...] }. Each
// sprint entry follows the shape documented in agents/meta-sprint-assembler.md.
// We also support per-sprint JSONL entries as a forward-compatible fallback
// (e.g. sprints/registry.jsonl), though the current registry is a single JSON
// file.

export interface Sprint {
  name: string;
  goal: string;
  projectPath: string;
  status: "active" | "dissolved";
  lastActiveAt: string | null;
  agentCount: number;
  agents: string[];
}

// Raw shape of an entry as written by meta-sprint-assembler. All fields are
// optional from this layer's point of view — we coerce + default everything
// so a malformed entry doesn't break the dashboard.
interface RawSprintEntry {
  name?: string;
  slug?: string;
  goal?: string;
  project?: string;
  projectPath?: string;
  created?: string;
  updated?: string;
  lastActiveAt?: string;
  duration?: string;
  agents?: string[];
  generated_agents?: string[];
  panel_command?: string;
  status?: string;
  dissolved?: string | null;
}

// Build-time imports. Vite resolves these as raw strings via the
// `md-raw` plugin (in vite.config.ts), which is a permissive "ends with .md"
// loader. For .json and .jsonl we use the explicit `?raw` query so Vite
// returns the file content as a string instead of trying to parse it.
const jsonModules = import.meta.glob("/src/content/sprints/**/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const jsonlModules = import.meta.glob("/src/content/sprints/**/*.jsonl", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function toStatus(raw: unknown): "active" | "dissolved" {
  return raw === "dissolved" ? "dissolved" : "active";
}

function normalize(entry: RawSprintEntry): Sprint | null {
  const name = entry.name ?? entry.slug;
  if (!name) return null;
  const agents = Array.isArray(entry.agents) ? entry.agents : [];
  const projectPath = entry.projectPath ?? entry.project ?? "";
  // Prefer explicit lastActiveAt, then dissolved/updated, then created.
  const lastActiveAt =
    entry.lastActiveAt ??
    entry.dissolved ??
    entry.updated ??
    entry.created ??
    null;
  return {
    name,
    goal: entry.goal ?? "",
    projectPath,
    status: toStatus(entry.status),
    lastActiveAt,
    agentCount: agents.length,
    agents,
  };
}

function parseJson(raw: string): RawSprintEntry[] {
  try {
    const data = JSON.parse(raw);
    // Two accepted shapes: { sprints: [...] } or a bare array.
    if (Array.isArray(data)) return data as RawSprintEntry[];
    if (data && Array.isArray(data.sprints)) {
      return data.sprints as RawSprintEntry[];
    }
    return [];
  } catch {
    return [];
  }
}

function parseJsonl(raw: string): RawSprintEntry[] {
  const out: RawSprintEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as RawSprintEntry);
    } catch {
      // skip malformed lines — never crash the dashboard
    }
  }
  return out;
}

/**
 * Load all sprints from the synced registry. Returns an empty array when no
 * registry exists (or it's empty) — callers should render a "no sprints"
 * fallback rather than crashing.
 */
export function loadSprints(): Sprint[] {
  const raw: RawSprintEntry[] = [];
  for (const content of Object.values(jsonModules)) {
    raw.push(...parseJson(content));
  }
  for (const content of Object.values(jsonlModules)) {
    raw.push(...parseJsonl(content));
  }
  const sprints: Sprint[] = [];
  for (const entry of raw) {
    const sprint = normalize(entry);
    if (sprint) sprints.push(sprint);
  }
  // Active first, then most-recently-active descending, name as tiebreaker.
  sprints.sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    const da = a.lastActiveAt ?? "";
    const db = b.lastActiveAt ?? "";
    if (da !== db) return db.localeCompare(da);
    return a.name.localeCompare(b.name);
  });
  return sprints;
}
