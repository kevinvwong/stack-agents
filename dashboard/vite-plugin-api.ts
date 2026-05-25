import type { Plugin } from 'vite'
import { spawnSync } from 'child_process'
import { execFileSync } from 'child_process'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, basename } from 'path'

const GITHUB_ROOT = 'C:/Users/kwong318/GitHub'

interface ProjectData {
  name: string
  path: string
  git: { branch: string; recentCommits: string[] }
  stack: string[]
  sprints: string[]
  hasClaude: boolean
}

// In-memory cache — survives browser refreshes, cleared on server restart or /refresh
let projectCache: ProjectData[] | null = null

function runGit(args: string[], cwd: string): string {
  try {
    return execFileSync('git', args, { cwd, timeout: 1500, encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}

function discoverRepoPaths(): string[] {
  const entries = readdirSync(GITHUB_ROOT, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory() && existsSync(join(GITHUB_ROOT, e.name, '.git')))
    .map((e) => join(GITHUB_ROOT, e.name))
}

function getGitInfo(projectPath: string): { branch: string; recentCommits: string[] } {
  // Single git log call — %D gives ref names (includes HEAD -> branch)
  const out = runGit(
    ['log', '--oneline', '-5', '--format=%h %s', '--no-merges'],
    projectPath,
  )
  const branch = runGit(['symbolic-ref', '--short', 'HEAD'], projectPath) || 'unknown'
  return {
    branch,
    recentCommits: out.split('\n').filter(Boolean),
  }
}

function detectStack(projectPath: string): string[] {
  const stack: string[] = []
  const pkgPath = join(projectPath, 'package.json')
  if (!existsSync(pkgPath)) return stack
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (deps['next']) stack.push('Next.js')
    if (deps['react']) stack.push('React')
    if (deps['drizzle-orm'] || existsSync(join(projectPath, 'drizzle.config.ts'))) stack.push('Drizzle ORM')
    if (deps['@neondatabase/serverless'] || deps['@vercel/postgres']) stack.push('Neon')
    if (deps['@clerk/nextjs'] || deps['@clerk/clerk-sdk-node']) stack.push('Clerk')
    if (deps['@anthropic-ai/sdk']) stack.push('Claude API')
    if (deps['elevenlabs'] || deps['@elevenlabs/elevenlabs-js']) stack.push('ElevenLabs')
    if (deps['@deepgram/sdk']) stack.push('Deepgram')
    if (deps['@upstash/redis']) stack.push('Upstash Redis')
    if (deps['@sentry/nextjs'] || deps['@sentry/node']) stack.push('Sentry')
    if (deps['posthog-js'] || deps['posthog-node']) stack.push('PostHog')
    if (deps['next-intl']) stack.push('next-intl')
    if (deps['playwright'] || deps['@playwright/test']) stack.push('Playwright')
    if (deps['vitest']) stack.push('Vitest')
    if (deps['tailwindcss']) stack.push('Tailwind')
  } catch { /* skip */ }
  return stack
}

function detectSprints(projectPath: string): string[] {
  const sprintFile = join(projectPath, '.claude', 'SPRINT.md')
  if (!existsSync(sprintFile)) return []
  try {
    const content = readFileSync(sprintFile, 'utf-8')
    const name = content.match(/^name:\s*(.+)$/m)?.[1]?.trim()
    return [name ?? 'sprint']
  } catch {
    return ['sprint']
  }
}

// Parallel scan: run all git calls concurrently via Promise + setImmediate scheduling
async function scanAllProjects(paths: string[]): Promise<ProjectData[]> {
  // Use Promise.all with a concurrency limit so we don't spawn 20 processes at once
  const CONCURRENCY = 8
  const results: ProjectData[] = []
  let index = 0

  const worker = async () => {
    while (index < paths.length) {
      const i = index++
      const p = paths[i]
      // Each project's git calls are fast (< 200ms each) — run them in a microtask
      results[i] = await new Promise<ProjectData>((resolve) => {
        setImmediate(() => {
          resolve({
            name: basename(p),
            path: p,
            git: getGitInfo(p),
            stack: detectStack(p),
            sprints: detectSprints(p),
            hasClaude: existsSync(join(p, '.claude')),
          })
        })
      })
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return results
}

function getGitHubIssues(projectPath: string) {
  const result = spawnSync(
    'gh',
    ['issue', 'list', '--state', 'open', '--limit', '5', '--json', 'number,title,labels'],
    { cwd: projectPath, timeout: 6000, encoding: 'utf-8' },
  )
  if (result.error || result.status !== 0) return []
  try {
    return JSON.parse(result.stdout ?? '[]')
  } catch {
    return []
  }
}

export function apiPlugin(): Plugin {
  return {
    name: 'stack-agents-api',
    configureServer(server) {
      // Pre-warm cache in the background when the dev server starts
      setImmediate(async () => {
        if (projectCache) return
        const paths = discoverRepoPaths()
        projectCache = await scanAllProjects(paths)
      })

      server.middlewares.use('/__api/projects', async (_req, res) => {
        if (!projectCache) {
          const paths = discoverRepoPaths()
          projectCache = await scanAllProjects(paths)
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(projectCache))
      })

      server.middlewares.use('/__api/projects/refresh', async (_req, res) => {
        projectCache = null
        const paths = discoverRepoPaths()
        projectCache = await scanAllProjects(paths)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, count: projectCache.length }))
      })

      server.middlewares.use('/__api/issues', (req, res) => {
        const url = new URL(req.url!, 'http://localhost')
        const projectPath = url.searchParams.get('path') ?? ''
        const issues = getGitHubIssues(projectPath)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(issues))
      })
    },
  }
}
