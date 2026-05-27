export interface CommandPage {
  id: string
  path: string
  group: string
  title: string
  description: string
  content: string
}

const commandModules = import.meta.glob('/src/content/commands/**/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

function pathRelativeToRoot(absPath: string): string {
  return absPath.replace(/^\/src\/content\/commands\//, '')
}

function groupFor(relPath: string): string {
  const parts = relPath.split('/')
  if (parts.length === 1) return 'commands'
  return parts[0]
}

function parseFrontmatter(raw: string): { name: string; description: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { name: '', description: '' }
  const block = match[1]
  const name = block.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? ''
  const description = block.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? ''
  return { name, description }
}

function titleFor(raw: string, fmName: string, relPath: string): string {
  if (fmName) return fmName
  const h1 = raw.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()
  return relPath.split('/').pop()!.replace(/\.md$/, '')
}

export async function loadCommands(): Promise<CommandPage[]> {
  const entries = await Promise.all(
    Object.entries(commandModules).map(async ([absPath, load]) => {
      const raw = await load()
      const relPath = pathRelativeToRoot(absPath)
      const id = relPath.replace(/\.md$/, '')
      const { name, description } = parseFrontmatter(raw)
      return {
        id,
        path: relPath,
        group: groupFor(relPath),
        title: titleFor(raw, name, relPath),
        description,
        content: raw,
      }
    }),
  )
  return entries.sort((a, b) => a.path.localeCompare(b.path))
}
