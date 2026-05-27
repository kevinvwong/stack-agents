// Canonical source of truth for agent family names and colors.
// Imported by data/agents.ts (which re-exports FAMILY_COLORS for back-compat)
// and by the diagram components (which import FAMILY_NAMES directly).

export type Family =
  | 'Web Stack'
  | 'Quality'
  | 'Research'
  | 'Product'
  | 'Cross-cutting'
  | 'Workspace'
  | 'Game Design'
  | 'GitHub'
  | 'Meta'

// Canonical ordered list of families. Replaces the locally-defined
// FAMILY_ORDER constants in AgentGraph.tsx and ArchitectureDiagram.tsx.
export const FAMILY_NAMES: Family[] = [
  'Web Stack',
  'Game Design',
  'GitHub',
  'Quality',
  'Research',
  'Product',
  'Cross-cutting',
  'Workspace',
  'Meta',
]

// Family colors. Notes on this revision (issue #110):
//   - Workspace reassigned from #a855f7 (purple) to #14b8a6 (teal) to
//     resolve a visual collision with Product/Meta/pinned-border purples.
//   - GitHub bumped from #6b7280 to #9ca3af (gray-400) for WCAG AA
//     contrast on dark backgrounds at the 11-12px text size used in nodes.
export const FAMILY_COLORS: Record<Family, string> = {
  'Web Stack': '#3b82f6',
  'Quality': '#10b981',
  'Research': '#f59e0b',
  'Product': '#8b5cf6',
  'Cross-cutting': '#06b6d4',
  'Workspace': '#14b8a6',
  'Game Design': '#ef4444',
  'GitHub': '#9ca3af',
  'Meta': '#ec4899',
}
