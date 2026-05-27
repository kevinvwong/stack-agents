export type AgentFamily =
  | 'Web Stack'
  | 'Quality'
  | 'Research'
  | 'Product'
  | 'Cross-cutting'
  | 'Workspace'
  | 'Game Design'
  | 'GitHub'
  | 'Meta'

export interface AgentMeta {
  id: string
  name: string
  description: string
  family: AgentFamily
  raw: string
}

export interface Edge {
  source: string
  target: string
  type: 'chain' | 'handoff'
  label?: string
}

// Dependency chains — source of truth for chain edges
export const CHAINS: { family: AgentFamily; chain: string[] }[] = [
  {
    family: 'Web Stack',
    chain: ['data', 'security', 'ai-llm', 'application', 'infrastructure', 'observability', 'presentation'],
  },
  {
    family: 'Quality',
    chain: ['web-qa', 'accessibility', 'performance'],
  },
  {
    family: 'Research',
    chain: ['user-research', 'usability-testing', 'focus-group', 'expert-review'],
  },
  {
    family: 'Game Design',
    chain: ['game-design', 'narrative', 'level-design', 'game-ux', 'game-tech', 'production'],
  },
  {
    family: 'GitHub',
    chain: ['gh-repo', 'gh-actions', 'gh-issues', 'gh-prs', 'gh-releases', 'gh-docs'],
  },
  {
    family: 'Workspace',
    chain: ['notion-architect', 'notion-publisher', 'notion-importer', 'notion-governance'],
  },
]

export const FAMILY_COLORS: Record<AgentFamily, string> = {
  'Web Stack': '#3b82f6',
  'Quality': '#10b981',
  'Research': '#f59e0b',
  'Product': '#8b5cf6',
  'Cross-cutting': '#06b6d4',
  'Workspace': '#a855f7',
  'Game Design': '#ef4444',
  'GitHub': '#6b7280',
  'Meta': '#ec4899',
}

// Map agent file stem → family
const FAMILY_MAP: Record<string, AgentFamily> = {
  'web-data': 'Web Stack',
  'web-security': 'Web Stack',
  'web-ai-llm': 'Web Stack',
  'web-application': 'Web Stack',
  'web-infrastructure': 'Web Stack',
  'web-observability': 'Web Stack',
  'web-presentation': 'Web Stack',
  'web-qa': 'Quality',
  'game-qa': 'Quality',
  'accessibility': 'Quality',
  'performance': 'Quality',
  'user-research': 'Research',
  'usability-testing': 'Research',
  'focus-group': 'Research',
  'expert-review': 'Research',
  'product': 'Product',
  'analytics': 'Product',
  'i18n': 'Cross-cutting',
  'finops': 'Cross-cutting',
  'game-design': 'Game Design',
  'game-narrative': 'Game Design',
  'game-level-design': 'Game Design',
  'game-ux': 'Game Design',
  'game-tech': 'Game Design',
  'game-production': 'Game Design',
  'gh-repo': 'GitHub',
  'gh-actions': 'GitHub',
  'gh-issues': 'GitHub',
  'gh-prs': 'GitHub',
  'gh-releases': 'GitHub',
  'gh-docs': 'GitHub',
  'notion-architect': 'Workspace',
  'notion-publisher': 'Workspace',
  'notion-importer': 'Workspace',
  'notion-governance': 'Workspace',
  'sprint-assembler': 'Meta',
  'project-setup': 'Meta',
  'agent-lifecycle': 'Meta',
}

// Map file stem → chain id (some file names differ from chain ids)
const STEM_TO_CHAIN_ID: Record<string, string> = {
  'web-data': 'data',
  'web-security': 'security',
  'web-ai-llm': 'ai-llm',
  'web-application': 'application',
  'web-infrastructure': 'infrastructure',
  'web-observability': 'observability',
  'web-presentation': 'presentation',
  'game-narrative': 'narrative',
  'game-level-design': 'level-design',
  'game-production': 'production',
}

function getChainId(stem: string): string {
  return STEM_TO_CHAIN_ID[stem] ?? stem
}

// Parse frontmatter manually (gray-matter not available in browser)
function parseFrontmatter(raw: string): { name: string; description: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { name: '', description: '' }
  const block = match[1]
  const name = block.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? ''
  const description = block.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? ''
  return { name, description }
}

// Parse ## Handoffs section to extract handoff targets
function parseHandoffs(raw: string): string[] {
  const match = raw.match(/## Handoffs\n([\s\S]*?)(?:\n## |\n---|\n*$)/)
  if (!match) return []
  const targets: string[] = []
  const lines = match[1].split('\n')
  for (const line of lines) {
    // Match `[AGENT: foo]` in handoff lines
    const m = line.match(/\[AGENT:\s*([^\]]+)\]/)
    if (m) targets.push(m[1].trim())
  }
  return targets
}

// Load all agent .md files — lazy glob so they split into a separate chunk
const agentModules = import.meta.glob('/src/content/agents/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

export async function loadAgents(): Promise<AgentMeta[]> {
  const entries = await Promise.all(
    Object.entries(agentModules)
      .filter(([path]) => !path.includes('README'))
      .map(async ([path, load]) => {
        const raw = await load()
        const stem = path.split('/').pop()!.replace(/\.md$/, '')
        const { name, description } = parseFrontmatter(raw)
        const family: AgentFamily = FAMILY_MAP[stem] ?? 'Meta'
        return { id: stem, name: name || stem, description, family, raw }
      }),
  )
  return entries
}

export function buildEdges(agents: AgentMeta[]): Edge[] {
  const edges: Edge[] = []
  // Chain edges
  for (const { chain } of CHAINS) {
    for (let i = 0; i < chain.length - 1; i++) {
      // Find agents whose chain id matches
      const sourceAgent = agents.find((a) => getChainId(a.id) === chain[i])
      const targetAgent = agents.find((a) => getChainId(a.id) === chain[i + 1])
      if (sourceAgent && targetAgent) {
        edges.push({ source: sourceAgent.id, target: targetAgent.id, type: 'chain' })
      }
    }
  }

  // Handoff edges from each agent's ## Handoffs section
  for (const agent of agents) {
    const targets = parseHandoffs(agent.raw)
    for (const target of targets) {
      // target may be the chain id — find the agent
      const targetAgent =
        agents.find((a) => a.id === target) ||
        agents.find((a) => getChainId(a.id) === target)
      if (targetAgent && targetAgent.id !== agent.id) {
        // Only add if not already a chain edge
        const alreadyChain = edges.some(
          (e) => e.type === 'chain' && e.source === agent.id && e.target === targetAgent.id,
        )
        if (!alreadyChain) {
          edges.push({ source: agent.id, target: targetAgent.id, type: 'handoff', label: 'handoff' })
        }
      }
    }
  }

  return edges
}
