import type { Plugin } from 'vite'
import { spawnSync } from 'child_process'
import { execFileSync } from 'child_process'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, basename } from 'path'

const GITHUB_ROOT = 'C:/Users/kwong318/GitHub'

interface ProjectLinks {
  github?: string
  production?: string
  local?: string
}

interface GitInfo {
  branch: string
  recentCommits: string[]    // format: "abc1234 commit message (2d ago)"
  ahead: number
  behind: number
  dirty: number
}

interface ProjectData {
  name: string
  path: string
  git: GitInfo
  stack: string[]
  sprints: string[]
  hasClaude: boolean
  links: ProjectLinks
  vercelProjectId?: string
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

function getGitInfo(projectPath: string): GitInfo {
  const statusOut = runGit(['status', '--porcelain=v2', '--branch'], projectPath)
  let branch = 'unknown'
  let ahead = 0
  let behind = 0
  let dirty = 0

  for (const line of statusOut.split('\n')) {
    if (line.startsWith('# branch.head ')) {
      branch = line.slice('# branch.head '.length).trim()
    } else if (line.startsWith('# branch.ab ')) {
      const m = line.match(/\+(\d+)\s+-(\d+)/)
      if (m) { ahead = parseInt(m[1], 10); behind = parseInt(m[2], 10) }
    } else if (line.startsWith('1 ') || line.startsWith('2 ') || line.startsWith('u ') || line.startsWith('? ')) {
      dirty++
    }
  }

  const logOut = runGit(
    ['log', '--oneline', '-5', '--format=%h %s (%cr)', '--no-merges'],
    projectPath,
  )

  return {
    branch,
    recentCommits: logOut.split('\n').filter(Boolean),
    ahead,
    behind,
    dirty,
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

function normalizeGitHubUrl(raw: string): string | undefined {
  if (!raw) return undefined
  const ssh = raw.match(/^git@github\.com[:/](.+?)(?:\.git)?$/)
  if (ssh) return `https://github.com/${ssh[1]}`
  const https = raw.match(/^(https:\/\/github\.com\/.+?)(?:\.git)?$/)
  if (https) return https[1]
  return undefined
}

function detectLinks(projectPath: string, stack: string[]): ProjectLinks {
  const links: ProjectLinks = {}

  const remoteUrl = runGit(['remote', 'get-url', 'origin'], projectPath)
  const github = normalizeGitHubUrl(remoteUrl)
  if (github) links.github = github

  const envFiles = ['.env.production', '.env.local', '.env']
  const urlKeys = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_BASE_URL', 'APP_URL']
  outer: for (const envFile of envFiles) {
    const envPath = join(projectPath, envFile)
    if (!existsSync(envPath)) continue
    try {
      const lines = readFileSync(envPath, 'utf-8').split('\n')
      for (const key of urlKeys) {
        const line = lines.find((l) => l.startsWith(`${key}=`))
        if (line) {
          const val = line.slice(key.length + 1).replace(/^['"]|['"]$/g, '').trim()
          if (val.startsWith('http')) { links.production = val; break outer }
        }
      }
    } catch { /* skip */ }
  }

  const pkgPath = join(projectPath, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const devScript: string = pkg?.scripts?.dev ?? ''
      const portMatch = devScript.match(/(?:--port|-p)\s+(\d+)/)
      if (portMatch) {
        links.local = `http://localhost:${portMatch[1]}`
      } else {
        const defaultPort = stack.includes('Next.js') ? 3000
          : devScript.includes('vite') ? 5173
          : devScript.includes('astro') ? 4321
          : 3000
        links.local = `http://localhost:${defaultPort}`
      }
    } catch { /* skip */ }
  }

  return links
}

function detectVercelProjectId(projectPath: string): string | undefined {
  const vercelJson = join(projectPath, '.vercel', 'project.json')
  if (!existsSync(vercelJson)) return undefined
  try {
    const data = JSON.parse(readFileSync(vercelJson, 'utf-8'))
    return data?.projectId ?? undefined
  } catch {
    return undefined
  }
}

async function getVercelDeploymentStatus(projectId: string, token: string): Promise<{ state: string; url?: string } | null> {
  try {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1&target=production`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) return null
    const data = await res.json() as { deployments?: { readyState: string; url?: string }[] }
    const d = data.deployments?.[0]
    if (!d) return null
    return { state: d.readyState, url: d.url ? `https://${d.url}` : undefined }
  } catch {
    return null
  }
}

async function scanAllProjects(paths: string[]): Promise<ProjectData[]> {
  const CONCURRENCY = 8
  const results: ProjectData[] = []
  let index = 0

  const worker = async () => {
    while (index < paths.length) {
      const i = index++
      const p = paths[i]
      results[i] = await new Promise<ProjectData>((resolve) => {
        setImmediate(() => {
          const stack = detectStack(p)
          resolve({
            name: basename(p),
            path: p,
            git: getGitInfo(p),
            stack,
            sprints: detectSprints(p),
            hasClaude: existsSync(join(p, '.claude')),
            links: detectLinks(p, stack),
            vercelProjectId: detectVercelProjectId(p),
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

      server.middlewares.use('/__api/vercel-status', async (req, res) => {
        const token = process.env.VERCEL_TOKEN
        if (!token) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'no_token' }))
          return
        }
        const url = new URL(req.url!, 'http://localhost')
        const projectId = url.searchParams.get('projectId') ?? ''
        const status = await getVercelDeploymentStatus(projectId, token)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(status ?? { error: 'not_found' }))
      })
    },
  }
}
