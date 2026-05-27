import { useEffect, useState } from 'react'

interface ProjectLinks {
  github?: string
  production?: string
  local?: string
}

interface GitInfo {
  branch: string
  recentCommits: string[]
  lastCommitDate?: string   // ISO 8601 — used for sort-by-recency
  ahead: number
  behind: number
  dirty: number
}

interface Project {
  name: string
  path: string
  git: GitInfo
  stack: string[]
  sprints: string[]
  hasClaude: boolean
  links: ProjectLinks
  vercelProjectId?: string
}

interface Issue {
  number: number
  title: string
  labels: { name: string }[]
}

type SortKey = 'name' | 'commit'

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

// Derive all unique stack techs present across all projects
function allTechs(projects: Project[]): string[] {
  const set = new Set<string>()
  for (const p of projects) p.stack.forEach((t) => set.add(t))
  return Array.from(set).sort()
}

function StackBadge({ tech, active, onClick }: { tech: string; active?: boolean; onClick?: () => void }) {
  const color = STACK_COLORS[tech] ?? '#64748b'
  return (
    <span
      onClick={onClick}
      style={{
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        border: `1px solid ${active ? color : '#334155'}`,
        color: active ? '#f1f5f9' : '#94a3b8',
        background: active ? `${color}33` : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all 0.1s',
        flexShrink: 0,
      }}
    >
      {tech}
    </span>
  )
}

function LinkPill({ href, label, title }: { href: string; label: string; title: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: '#94a3b8',
        background: '#0f172a',
        border: '1px solid #334155',
        textDecoration: 'none',
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#f1f5f9'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#475569' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#334155' }}
    >
      {label}
    </a>
  )
}

function StatPill({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 11,
        color: color ?? '#64748b',
        background: '#0f172a',
        border: '1px solid #1e3a5f',
        borderRadius: 4,
        padding: '2px 7px',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
  )
}

const VERCEL_STATE_COLORS: Record<string, string> = {
  READY: '#22c55e',
  ERROR: '#f87171',
  BUILDING: '#f59e0b',
  CANCELED: '#64748b',
  QUEUED: '#64748b',
}

function VercelBadge({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<{ state: string; url?: string } | null>(null)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    fetch(`/__api/vercel-status?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error === 'no_token') return  // no VERCEL_TOKEN — silently skip
        if (d.error) { setFetchError(true); return }
        setStatus(d)
      })
      .catch(() => setFetchError(true))
  }, [projectId])

  if (fetchError) {
    return (
      <span
        title="Vercel status unavailable"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 11,
          color: '#64748b',
          background: '#64748b18',
          border: '1px solid #64748b55',
          borderRadius: 4,
          padding: '1px 7px',
          flexShrink: 0,
        }}
      >
        ▲ ?
      </span>
    )
  }

  if (!status) return null
  const color = VERCEL_STATE_COLORS[status.state] ?? '#64748b'
  const label = status.state === 'READY' ? '▲ live'
    : status.state === 'ERROR' ? '▲ error'
    : status.state === 'BUILDING' ? '▲ building'
    : `▲ ${status.state.toLowerCase()}`

  const pill = (
    <span
      title={`Vercel: ${status.state}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 11,
        fontWeight: 600,
        color,
        background: `${color}18`,
        border: `1px solid ${color}55`,
        borderRadius: 4,
        padding: '1px 7px',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )

  if (status.url) {
    return (
      <a href={status.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
        {pill}
      </a>
    )
  }
  return pill
}

const PINNED_KEY = 'stack-agents:pinned'

function getPinned(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(PINNED_KEY) ?? '[]')) } catch { return new Set() }
}

function savePinned(set: Set<string>) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(Array.from(set)))
}

function ProjectCard({ project, pinned, onTogglePin }: { project: Project; pinned: boolean; onTogglePin: () => void }) {
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [issuesError, setIssuesError] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const loadIssues = () => {
    if (issues !== null || issuesError) { setExpanded(!expanded); return }
    fetch(`/__api/issues?path=${encodeURIComponent(project.path)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) { setIssuesError(true); setExpanded(true); return }
        setIssues(data)
        setExpanded(true)
      })
      .catch(() => { setIssuesError(true); setExpanded(true) })
  }

  const latestCommit = project.git.recentCommits[0] ?? null
  const { ahead, behind, dirty } = project.git

  const branchColor = (project.git.branch === 'main' || project.git.branch === 'master')
    ? '#22c55e'
    : '#f59e0b'

  const hasLinks = project.links.github || project.links.production || project.links.local

  return (
    <div
      style={{
        background: '#1e293b',
        border: pinned ? '1px solid #7c3aed88' : '1px solid #334155',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {/* Pin button */}
          <button
            onClick={onTogglePin}
            title={pinned ? 'Unpin project' : 'Pin project'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 13,
              color: pinned ? '#a78bfa' : '#334155',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {pinned ? '★' : '☆'}
          </button>
          <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14, whiteSpace: 'nowrap' }}>{project.name}</span>
          {project.hasClaude && (
            <span
              style={{
                fontSize: 10,
                background: '#7c3aed22',
                border: '1px solid #7c3aed',
                color: '#a78bfa',
                borderRadius: 4,
                padding: '1px 6px',
                flexShrink: 0,
              }}
            >
              Claude
            </span>
          )}
          {project.vercelProjectId && <VercelBadge projectId={project.vercelProjectId} />}
        </div>
        {/* Branch badge */}
        <span
          style={{
            fontSize: 11,
            color: branchColor,
            background: `${branchColor}18`,
            border: `1px solid ${branchColor}55`,
            borderRadius: 4,
            padding: '1px 7px',
            flexShrink: 0,
            marginLeft: 8,
            fontFamily: 'monospace',
          }}
        >
          ⎇ {project.git.branch !== 'unknown' ? project.git.branch : '?'}
        </span>
      </div>

      {/* Links row */}
      {hasLinks && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {project.links.github && (
            <LinkPill href={project.links.github} label="GH" title="GitHub repository" />
          )}
          {project.links.production && (
            <LinkPill href={project.links.production} label="↗ prod" title={project.links.production} />
          )}
          {project.links.local && (
            <LinkPill href={project.links.local} label="⌂ local" title={project.links.local} />
          )}
        </div>
      )}

      {/* Stack */}
      {project.stack.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {project.stack.map((t) => <StackBadge key={t} tech={t} />)}
        </div>
      )}

      {/* Latest commit */}
      {latestCommit && (
        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      {/* Quick stats row */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        {ahead > 0 && (
          <StatPill value={`↑${ahead}`} label={`${ahead} commit${ahead !== 1 ? 's' : ''} ahead of origin`} color="#22c55e" />
        )}
        {behind > 0 && (
          <StatPill value={`↓${behind}`} label={`${behind} commit${behind !== 1 ? 's' : ''} behind origin`} color="#f59e0b" />
        )}
        {dirty > 0 && (
          <StatPill value={`~${dirty}`} label={`${dirty} uncommitted file${dirty !== 1 ? 's' : ''}`} color="#fb923c" />
        )}
        <button
          onClick={loadIssues}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#0f172a',
            border: '1px solid #1e3a5f',
            color: issuesError ? '#f59e0b'
              : issues !== null ? (issues.length > 0 ? '#f87171' : '#475569')
              : '#64748b',
            borderRadius: 4,
            padding: '2px 7px',
            fontSize: 11,
            cursor: 'pointer',
            fontVariantNumeric: 'tabular-nums',
          }}
          title={
            issuesError ? 'Could not load issues (gh not installed or no GitHub remote)'
              : issues === null ? 'Load open GitHub issues'
              : expanded ? 'Hide issues' : 'Show issues'
          }
        >
          📋 {issuesError ? '!' : issues === null ? '…' : issues.length}
        </button>
      </div>

      {/* Issues list */}
      {expanded && issuesError && (
        <div style={{ fontSize: 11, color: '#f59e0b' }}>
          ⚠ Could not load issues — check <code>gh auth status</code>
        </div>
      )}
      {expanded && !issuesError && issues && issues.length > 0 && (
        <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: '#cbd5e1', lineHeight: 1.8 }}>
          {issues.map((i) => (
            <li key={i.number}>
              <span style={{ color: '#64748b' }}>#{i.number}</span> {i.title}
            </li>
          ))}
        </ul>
      )}
      {expanded && !issuesError && issues && issues.length === 0 && (
        <div style={{ fontSize: 11, color: '#475569' }}>No open issues</div>
      )}
    </div>
  )
}

export function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [pinned, setPinned] = useState<Set<string>>(getPinned)

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProjects()
  }, [])

  const toggleChip = (tech: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev)
      if (next.has(tech)) { next.delete(tech) } else { next.add(tech) }
      return next
    })
  }

  const togglePin = (path: string) => {
    setPinned((prev) => {
      const next = new Set(prev)
      if (next.has(path)) { next.delete(path) } else { next.add(path) }
      savePinned(next)
      return next
    })
  }

  const techs = allTechs(projects)

  // Filter: text search AND active chip filters (chips are OR within selection)
  const textFiltered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.stack.some((s) => s.toLowerCase().includes(search.toLowerCase())),
  )
  const chipFiltered = activeChips.size === 0
    ? textFiltered
    : textFiltered.filter((p) => p.stack.some((s) => activeChips.has(s)))

  // Sort
  const sorted = [...chipFiltered].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name)
    if (sortKey === 'commit') {
      // Sort by ISO date descending (most recent first) — fall back to name for repos with no commits
      const dateA = a.git.lastCommitDate ?? ''
      const dateB = b.git.lastCommitDate ?? ''
      if (dateA === dateB) return a.name.localeCompare(b.name)
      return dateB.localeCompare(dateA)  // reverse: newer date = higher rank
    }
    return 0
  })

  // Pinned float to top
  const displayed = [
    ...sorted.filter((p) => pinned.has(p.path)),
    ...sorted.filter((p) => !pinned.has(p.path)),
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter projects or stack…"
            style={{
              flex: 1,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '7px 12px',
              color: '#f1f5f9',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {/* Sort dropdown */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#94a3b8',
              padding: '7px 10px',
              fontSize: 12,
              cursor: 'pointer',
              outline: 'none',
              flexShrink: 0,
            }}
          >
            <option value="name">A–Z</option>
            <option value="commit">Recent commit</option>
          </select>
          <button
            onClick={refresh}
            title="Re-scan all projects"
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#94a3b8',
              padding: '7px 12px',
              fontSize: 13,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ↺
          </button>
        </div>

        {/* Stack filter chips */}
        {techs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {techs.map((tech) => (
              <StackBadge
                key={tech}
                tech={tech}
                active={activeChips.has(tech)}
                onClick={() => toggleChip(tech)}
              />
            ))}
            {activeChips.size > 0 && (
              <button
                onClick={() => setActiveChips(new Set())}
                style={{
                  background: 'none',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  color: '#475569',
                  fontSize: 11,
                  padding: '2px 8px',
                  cursor: 'pointer',
                }}
              >
                ✕ clear
              </button>
            )}
          </div>
        )}
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 12,
            alignContent: 'start',
          }}
        >
          {displayed.map((p) => (
            <ProjectCard
              key={p.path}
              project={p}
              pinned={pinned.has(p.path)}
              onTogglePin={() => togglePin(p.path)}
            />
          ))}
          {displayed.length === 0 && (
            <div style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', paddingTop: 32 }}>
              No projects match the current filters
            </div>
          )}
        </div>
      )}
    </div>
  )
}
