export interface DocPage {
  id: string;
  path: string;
  group: string;
  title: string;
  content: string;
}

const docModules = import.meta.glob("/src/content/docs/**/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

// Explicit display order for sidebar groups. Unknown groups fall to the end,
// preserving insertion order among themselves.
export const GROUP_ORDER: readonly string[] = [
  "Overview",
  "Runbooks",
  "Architecture Decisions",
];

// Folder name (relative to docs/) → human-readable group label.
// Top-level files (no subdir) live under `docs` and become "Overview".
const GROUP_LABELS: Record<string, string> = {
  docs: "Overview",
  adr: "Architecture Decisions",
  runbooks: "Runbooks",
};

// Slugs (DocPage.id) that should be pinned to the top of their group,
// in this order. Unlisted items fall to the end and sort alphabetically by
// title. Currently only "Overview" has pinned items.
export const ITEM_PRIORITY: readonly string[] = ["getting-started"];

function pathRelativeToRoot(absPath: string): string {
  return absPath.replace(/^\/src\/content\/docs\//, "");
}

function groupFor(relPath: string): string {
  const parts = relPath.split("/");
  if (parts.length === 1) return GROUP_LABELS.docs;
  const folder = parts[0];
  return GROUP_LABELS[folder] ?? folder;
}

function titleFor(raw: string, relPath: string): string {
  const h1 = raw.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  const stem = relPath.split("/").pop()!.replace(/\.md$/, "");
  return stem;
}

export async function loadDocs(): Promise<DocPage[]> {
  const entries = await Promise.all(
    Object.entries(docModules).map(async ([absPath, load]) => {
      const raw = await load();
      const relPath = pathRelativeToRoot(absPath);
      const id = relPath.replace(/\.md$/, "").split("/").pop()!;
      return {
        id,
        path: relPath,
        group: groupFor(relPath),
        title: titleFor(raw, relPath),
        content: raw,
      };
    }),
  );
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Group docs by their `group` label and return entries sorted by
 * `GROUP_ORDER`, with unknown groups falling to the end. Within each group,
 * items in `ITEM_PRIORITY` come first (in that order); the rest sort
 * alphabetically by title.
 */
export function groupDocs(docs: DocPage[]): Array<[string, DocPage[]]> {
  const map = new Map<string, DocPage[]>();
  for (const d of docs) {
    const list = map.get(d.group) ?? [];
    list.push(d);
    map.set(d.group, list);
  }
  const groupRank = (name: string): number => {
    const idx = GROUP_ORDER.indexOf(name);
    return idx === -1 ? GROUP_ORDER.length : idx;
  };
  const itemRank = (slug: string): number => {
    const idx = ITEM_PRIORITY.indexOf(slug);
    return idx === -1 ? ITEM_PRIORITY.length : idx;
  };
  const entries = Array.from(map.entries());
  entries.sort(([a], [b]) => {
    const ra = groupRank(a);
    const rb = groupRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
  for (const [, pages] of entries) {
    pages.sort((a, b) => {
      const ra = itemRank(a.id);
      const rb = itemRank(b.id);
      if (ra !== rb) return ra - rb;
      return a.title.localeCompare(b.title);
    });
  }
  return entries;
}
