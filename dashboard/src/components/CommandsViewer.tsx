import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { loadCommands, type CommandPage } from '../data/commands'

export function CommandsViewer() {
  const [commands, setCommands] = useState<CommandPage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    loadCommands().then((pages) => {
      setCommands(pages)
      setSelectedId((current) => current ?? pages[0]?.id ?? null)
    })
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, CommandPage[]>()
    for (const c of commands) {
      const list = map.get(c.group) ?? []
      list.push(c)
      map.set(c.group, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [commands])

  const selected = commands.find((c) => c.id === selectedId) ?? null

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      <div
        style={{
          flex: '0 0 280px',
          overflow: 'auto',
          borderRight: '1px solid #1e293b',
          padding: '16px 0',
        }}
      >
        {grouped.map(([group, pages]) => (
          <div key={group} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: '#475569',
                padding: '0 20px 6px',
              }}
            >
              {group}
            </div>
            {pages.map((p) => {
              const active = p.id === selectedId
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: active ? '#1e293b' : 'none',
                    border: 'none',
                    borderLeft: active ? '2px solid #6366f1' : '2px solid transparent',
                    color: active ? '#f1f5f9' : '#94a3b8',
                    padding: '6px 20px',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {p.title}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }} className="agent-markdown">
        {selected ? (
          <>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 4, fontFamily: 'monospace' }}>
              {selected.path}
            </div>
            {selected.description && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                {selected.description}
              </div>
            )}
            <ReactMarkdown>{selected.content}</ReactMarkdown>
          </>
        ) : (
          <div style={{ color: '#64748b' }}>Loading…</div>
        )}
      </div>
    </div>
  )
}
