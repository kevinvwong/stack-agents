import { useState, useMemo, useEffect } from 'react'
import { AgentGraph } from './components/AgentGraph'
import { AgentDetail } from './components/AgentDetail'
import { ProjectDashboard } from './components/ProjectDashboard'
import { DocsViewer } from './components/DocsViewer'
import { CommandsViewer } from './components/CommandsViewer'
import { loadAgents, buildEdges, FAMILY_COLORS, type AgentFamily, type AgentMeta, type Edge } from './data/agents'

// TODO(Phase 9 follow-up): real URL routing for deep linkable docs/commands
type Tab = 'graph' | 'projects' | 'docs' | 'commands'

const TAB_LABELS: Record<Tab, string> = {
  graph: '🗺 Agent Graph',
  projects: '📁 Projects',
  docs: '📖 Docs',
  commands: '⌘ Commands',
}

const ALL_FAMILIES: AgentFamily[] = [
  'Web Stack', 'Quality', 'Research', 'Product', 'Cross-cutting', 'Game Design', 'GitHub', 'Meta',
]

export default function App() {
  const [tab, setTab] = useState<Tab>('graph')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [familyFilter, setFamilyFilter] = useState<AgentFamily | null>(null)
  const [allAgents, setAllAgents] = useState<AgentMeta[]>([])
  const [allEdges, setAllEdges] = useState<Edge[]>([])

  useEffect(() => {
    loadAgents().then((agents) => {
      setAllAgents(agents)
      setAllEdges(buildEdges(agents))
    })
  }, [])

  const agents = useMemo(
    () => (familyFilter ? allAgents.filter((a) => a.family === familyFilter) : allAgents),
    [allAgents, familyFilter],
  )
  const edges = useMemo(
    () =>
      familyFilter
        ? allEdges.filter((e) => agents.some((a) => a.id === e.source) && agents.some((a) => a.id === e.target))
        : allEdges,
    [allEdges, agents, familyFilter],
  )

  const selected = agents.find((a) => a.id === selectedAgent) ?? null

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        color: '#e2e8f0',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Top nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: '0 20px',
          borderBottom: '1px solid #1e293b',
          flexShrink: 0,
          height: 52,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9', marginRight: 24 }}>
          stack-agents
        </span>
        {(['graph', 'projects', 'docs', 'commands'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
              color: tab === t ? '#f1f5f9' : '#64748b',
              fontWeight: tab === t ? 600 : 400,
              padding: '0 16px',
              height: 52,
              cursor: 'pointer',
              fontSize: 13,
              textTransform: 'capitalize',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}

        {/* Family filter (graph tab only) */}
        {tab === 'graph' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFamilyFilter(null)}
              style={{
                background: familyFilter === null ? '#1e293b' : 'none',
                border: '1px solid #334155',
                borderRadius: 6,
                color: familyFilter === null ? '#f1f5f9' : '#64748b',
                padding: '4px 10px',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {ALL_FAMILIES.map((f) => (
              <button
                key={f}
                onClick={() => setFamilyFilter(familyFilter === f ? null : f)}
                style={{
                  background: familyFilter === f ? `${FAMILY_COLORS[f]}33` : 'none',
                  border: `1px solid ${familyFilter === f ? FAMILY_COLORS[f] : '#334155'}`,
                  borderRadius: 6,
                  color: familyFilter === f ? '#f1f5f9' : '#64748b',
                  padding: '4px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {tab === 'graph' && (
          <>
            <div style={{ flex: selected ? '1 1 60%' : '1 1 100%', minWidth: 0, transition: 'flex 0.2s' }}>
              <AgentGraph
                agents={agents}
                edges={edges}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
              />
            </div>
            {selected && (
              <div style={{ flex: '0 0 420px', overflow: 'hidden' }}>
                <AgentDetail agent={selected} onClose={() => setSelectedAgent(null)} />
              </div>
            )}
          </>
        )}
        {tab === 'projects' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ProjectDashboard />
          </div>
        )}
        {tab === 'docs' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <DocsViewer />
          </div>
        )}
        {tab === 'commands' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CommandsViewer />
          </div>
        )}
      </div>

      {/* Legend (graph tab) */}
      {tab === 'graph' && (
        <div
          style={{
            flexShrink: 0,
            padding: '8px 20px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            gap: 20,
            fontSize: 11,
            color: '#64748b',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 24, height: 2, background: '#94a3b8', display: 'inline-block' }} />
            dependency chain
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 24,
                height: 2,
                background: '#f59e0b',
                display: 'inline-block',
                borderTop: '2px dashed #f59e0b',
              }}
            />
            handoff
          </span>
          <span style={{ marginLeft: 'auto' }}>{agents.length} agents · {edges.length} edges</span>
        </div>
      )}
    </div>
  )
}
