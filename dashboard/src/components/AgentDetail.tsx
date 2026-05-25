import ReactMarkdown from 'react-markdown'
import { type AgentMeta, FAMILY_COLORS } from '../data/agents'

interface Props {
  agent: AgentMeta
  onClose: () => void
}

export function AgentDetail({ agent, onClose }: Props) {
  const color = FAMILY_COLORS[agent.family]

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        borderLeft: `3px solid ${color}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            {agent.family}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginTop: 4 }}>{agent.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{agent.description}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 20px',
        }}
        className="agent-markdown"
      >
        <ReactMarkdown>{agent.raw}</ReactMarkdown>
      </div>
    </div>
  )
}
