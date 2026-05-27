import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge as FlowEdge,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { type AgentMeta, type AgentFamily, FAMILY_COLORS } from '../data/agents'

interface Props {
  agents: AgentMeta[]
  onSelect: (agentId: string) => void
  onFilterFamily: (family: AgentFamily) => void
}

type NodeKind = 'root' | 'family' | 'agent'

interface RootData extends Record<string, unknown> {
  kind: 'root'
  label: string
}

interface FamilyData extends Record<string, unknown> {
  kind: 'family'
  family: AgentFamily
  count: number
}

interface AgentData extends Record<string, unknown> {
  kind: 'agent'
  agent: AgentMeta
}

const FAMILY_ORDER: AgentFamily[] = [
  'Web Stack',
  'Game Design',
  'GitHub',
  'Quality',
  'Research',
  'Product',
  'Cross-cutting',
  'Meta',
]

const ROOT_Y = 0
const FAMILY_Y = 180
const AGENT_Y_BASE = 360
const AGENT_ROW_GAP = 70
const FAMILY_X_GAP = 260
const AGENT_X_GAP = 170
const ROOT_W = 280
const FAMILY_W = 200
const AGENT_W = 150

function buildLayout(agents: AgentMeta[]): { nodes: Node[]; edges: FlowEdge[] } {
  const groups = new Map<AgentFamily, AgentMeta[]>()
  for (const a of agents) {
    const arr = groups.get(a.family) ?? []
    arr.push(a)
    groups.set(a.family, arr)
  }

  const families = FAMILY_ORDER.filter((f) => (groups.get(f)?.length ?? 0) > 0)

  const totalFamilyWidth = families.length * FAMILY_X_GAP
  const familyXStart = -totalFamilyWidth / 2 + FAMILY_X_GAP / 2

  const familyXById = new Map<AgentFamily, number>()
  families.forEach((f, i) => {
    familyXById.set(f, familyXStart + i * FAMILY_X_GAP)
  })

  const nodes: Node[] = []
  const edges: FlowEdge[] = []

  nodes.push({
    id: '__root__',
    type: 'rootNode',
    position: { x: -ROOT_W / 2, y: ROOT_Y },
    data: { kind: 'root', label: 'Master Orchestrator (CLAUDE.md)' } satisfies RootData,
    style: { width: ROOT_W, height: 70 },
    draggable: false,
    selectable: false,
  })

  for (const family of families) {
    const members = groups.get(family) ?? []
    const fx = familyXById.get(family) ?? 0
    const familyId = `family:${family}`

    nodes.push({
      id: familyId,
      type: 'familyNode',
      position: { x: fx - FAMILY_W / 2, y: FAMILY_Y },
      data: { kind: 'family', family, count: members.length } satisfies FamilyData,
      style: { width: FAMILY_W, height: 60 },
      draggable: false,
    })

    edges.push({
      id: `e-root-${familyId}`,
      source: '__root__',
      target: familyId,
      style: { stroke: FAMILY_COLORS[family], strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: FAMILY_COLORS[family] },
    })

    const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name))
    const totalAgentWidth = sorted.length * AGENT_X_GAP
    const agentXStart = fx - totalAgentWidth / 2 + AGENT_X_GAP / 2

    sorted.forEach((agent, i) => {
      const row = Math.floor(i / 2)
      const ax = agentXStart + i * AGENT_X_GAP
      const ay = AGENT_Y_BASE + row * AGENT_ROW_GAP

      nodes.push({
        id: agent.id,
        type: 'agentLeafNode',
        position: { x: ax - AGENT_W / 2, y: ay },
        data: { kind: 'agent', agent } satisfies AgentData,
        style: { width: AGENT_W, height: 44 },
        draggable: false,
      })

      edges.push({
        id: `e-${familyId}-${agent.id}`,
        source: familyId,
        target: agent.id,
        style: { stroke: FAMILY_COLORS[family], strokeWidth: 1.2, opacity: 0.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: FAMILY_COLORS[family] },
      })
    })
  }

  return { nodes, edges }
}

function RootNode({ data }: { data: RootData }) {
  return (
    <div
      style={{
        background: '#1e293b',
        border: '2px solid #6366f1',
        borderRadius: 10,
        padding: '12px 16px',
        color: '#f1f5f9',
        fontSize: 14,
        fontWeight: 700,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 24px rgba(99,102,241,0.25)',
      }}
    >
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ background: '#6366f1' }} />
    </div>
  )
}

function FamilyNode({ data }: { data: FamilyData }) {
  const color = FAMILY_COLORS[data.family]
  return (
    <div
      style={{
        background: `${color}22`,
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: '8px 12px',
        color: '#f1f5f9',
        fontSize: 12,
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div style={{ fontWeight: 700, fontSize: 11, color, marginBottom: 2 }}>FAMILY</div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>
        {data.family} <span style={{ color: '#94a3b8', fontWeight: 500 }}>· {data.count}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  )
}

function AgentLeafNode({ data }: { data: AgentData }) {
  const color = FAMILY_COLORS[data.agent.family]
  return (
    <div
      style={{
        background: '#0f172a',
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: '6px 10px',
        color: '#e2e8f0',
        fontSize: 11,
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {data.agent.name}
      </div>
    </div>
  )
}

const nodeTypes = {
  rootNode: RootNode,
  familyNode: FamilyNode,
  agentLeafNode: AgentLeafNode,
}

export function ArchitectureDiagram({ agents, onSelect, onFilterFamily }: Props) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildLayout(agents), [agents])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const kind = (node.data as { kind?: NodeKind }).kind
      if (kind === 'family') {
        const data = node.data as FamilyData
        onFilterFamily(data.family)
      } else if (kind === 'agent') {
        const data = node.data as AgentData
        onSelect(data.agent.id)
      }
    },
    [onFilterFamily, onSelect],
  )

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        colorMode="dark"
        nodesDraggable={false}
      >
        <Background color="#1e293b" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as { kind?: NodeKind; family?: AgentFamily; agent?: AgentMeta }
            if (data.kind === 'root') return '#6366f1'
            if (data.kind === 'family' && data.family) return FAMILY_COLORS[data.family] ?? '#666'
            if (data.kind === 'agent' && data.agent) return FAMILY_COLORS[data.agent.family] ?? '#666'
            return '#666'
          }}
          maskColor="#0f172a99"
        />
      </ReactFlow>
    </div>
  )
}
