import { useEffect, useState } from 'react'

interface GitInfo {
  branch: string
  recentCommits: string[]
}

interface Project {
  name: string
  path: string
  git: GitInfo
  stack: string[]
  sprints: string[]
  hasClaude: boolean
}

interface Issue {
  number: number
  title: string
  labels: { name: string }[]
}

const STACK_COLORS: Record<string, string> = {
  'Next.js': '#000',
  'React': '#61dafb',
  'Drizzle ORM': '#c5f7ae',
  'Neon': '#00e5b5',
  'Clerk': '#6c47ff',
  'Claude API': '#d97706',
  'ElevenLabs': '#a78bfa',
  'Deepgram': '#06b6d4',
  'Upstash Redis': '#e11d48',
  'Sentry': '#fb923c',
  'PostHog': '#f97316',
  'Tailwind': '#38bdf8',
  'Playwright': '#2dd4bf',
  'Vitest': '#a3e635',
  'next-intl': '#818cf8',
}

function StackBadge({ tech }: { tech: string }) {
  const color = STACK_COLORS[tech] ?? '#64748b'
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        border: `1px solid ${color}`,
        color: '#e2e8f0',
        background: `${color}22`,
      }}
    >
      {tech}
    </span>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [expanded, setExpanded] = useState(false)

  const loadIssues = () => {
    if (issues !== null) { setExpanded(!expanded); return }
    fetch(`/__api/issues?path=${encodeURIComponent(project.path)}`)
      .then((r) => r.json())
      .then((data) => { setIssues(data); setExpanded(true) })
      .catch(() => { setIssues([]); setExpanded(true) })
  }

  const latestCommit = project.git.recentCommits[0] ?? null

  return (
    <div
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{project.name}</span>
          {project.hasClaude && (
            <span
              style={{
                fontSize: 10,
                background: '#7c3aed22',
                border: '1px solid #7c3aed',
                color: '#a78bfa',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              Claude
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: '#64748b' }}>
          {project.git.branch !== 'unknown' ? `⎇ ${project.git.branch}` : ''}
        </span>
      </div>

      {/* Stack */}
      {project.stack.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {project.stack.map((t) => <StackBadge key={t} tech={t} />)}
        </div>
      )}

      {/* Latest commit */}
      {latestCommit && (
        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
          {latestCommit}
        </div>
      )}

      {/* Sprints */}
      {project.sprints.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {project.sprints.map((s) => (
            <span
              key={s}
              style={{
                fontSize: 11,
                background: '#05966922',
                border: '1px solid #059669',
                color: '#34d399',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              🏃 {s}
            </span>
          ))}
        </div>
      )}

      {/* Issues toggle */}
      <button
        onClick={loadIssues}
        style={{
          background: 'none',
          border: '1px solid #334155',
          color: '#94a3b8',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 11,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {issues === null ? '📋 Load open issues' : expanded ? '▲ Hide issues' : '▼ Show issues'}
        {issues !== null && ` (${issues.length})`}
      </button>

      {expanded && issues && issues.length > 0 && (
        <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: '#cbd5e1', lineHeight: 1.8 }}>
          {issues.map((i) => (
            <li key={i.number}>
              <span style={{ color: '#64748b' }}>#{i.number}</span> {i.title}
            </li>
          ))}
        </ul>
      )}
      {expanded && issues && issues.length === 0 && (
        <div style={{ fontSize: 11, color: '#475569' }}>No open issues</div>
      )}
    </div>
  )
}

export function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadProjects = () => {
    setLoading(true)
    fetch('/__api/projects')
      .then((r) => r.json())
      .then((data) => { setProjects(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const refresh = () => {
    fetch('/__api/projects/refresh').then(() => loadProjects())
  }

  useEffect(() => { loadProjects() }, [])

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.stack.some((s) => s.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', flexShrink: 0, display: 'flex', gap: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter projects or stack…"
          style={{
            flex: 1,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '8px 12px',
            color: '#f1f5f9',
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={refresh}
          title="Re-scan all projects"
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            color: '#94a3b8',
            padding: '8px 12px',
            fontSize: 13,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ↺
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, color: '#64748b', textAlign: 'center' }}>Scanning projects…</div>
      ) : (
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 12,
            alignContent: 'start',
          }}
        >
          {filtered.map((p) => <ProjectCard key={p.path} project={p} />)}
          {filtered.length === 0 && (
            <div style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', paddingTop: 32 }}>
              No projects match "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
