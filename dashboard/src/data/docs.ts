export interface DocPage {
  id: string
  path: string
  group: string
  title: string
  content: string
}

const docModules = import.meta.glob('/src/content/docs/**/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

function pathRelativeToRoot(absPath: string): string {
  return absPath.replace(/^\/src\/content\/docs\//, '')
}

function groupFor(relPath: string): string {
  const parts = relPath.split('/')
  if (parts.length === 1) return 'docs'
  return `docs/${parts.slice(0, -1).join('/')}`
}

function titleFor(raw: string, relPath: string): string {
  const h1 = raw.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()
  const stem = relPath.split('/').pop()!.replace(/\.md$/, '')
  return stem
}

export async function loadDocs(): Promise<DocPage[]> {
  const entries = await Promise.all(
    Object.entries(docModules).map(async ([absPath, load]) => {
      const raw = await load()
      const relPath = pathRelativeToRoot(absPath)
      const id = relPath.replace(/\.md$/, '')
      return {
        id,
        path: relPath,
        group: groupFor(relPath),
        title: titleFor(raw, relPath),
        content: raw,
      }
    }),
  )
  return entries.sort((a, b) => a.path.localeCompare(b.path))
}
