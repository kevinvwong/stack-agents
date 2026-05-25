import type { Plugin } from 'vite'
import { execSync } from 'child_process'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, basename } from 'path'

const GITHUB_ROOT = 'C:/Users/kwong318/GitHub'

function discoverProjects() {
  const entries = readdirSync(GITHUB_ROOT, { withFileTypes: true })
  const projects = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dir = join(GITHUB_ROOT, entry.name)
    if (!existsSync(join(dir, '.git'))) continue

    projects.push(dir)
  }

  return projects
}

function getGitInfo(projectPath: string) {
  try {
    const log = execSync('git log --oneline -5', { cwd: projectPath, timeout: 3000 }).toString().trim()
    const branch = execSync('git branch --show-current', { cwd: projectPath, timeout: 3000 }).toString().trim()
    return { branch, recentCommits: log.split('\n').filter(Boolean) }
  } catch {
    return { branch: 'unknown', recentCommits: [] }
  }
}

function getGitHubIssues(projectPath: string) {
  try {
    const raw = execSync('gh issue list --state open --limit 5 --json number,title,labels', {
      cwd: projectPath,
      timeout: 5000,
    }).toString().trim()
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function detectStack(projectPath: string) {
  const stack: string[] = []

  const pkgPath = join(projectPath, 'package.json')
  if (existsSync(pkgPath)) {
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
  }

  return stack
}

function detectSprints(projectPath: string) {
  const sprints: string[] = []

  // Sprint orchestrators are installed as SPRINT.md or .claude/SPRINT.md
  const sprintFile = join(projectPath, '.claude', 'SPRINT.md')
  if (existsSync(sprintFile)) {
    try {
      const content = readFileSync(sprintFile, 'utf-8')
      const name = content.match(/^name:\s*(.+)$/m)?.[1]?.trim()
      sprints.push(name ?? 'sprint')
    } catch { sprints.push('sprint') }
  }

  return sprints
}

function hasClaudeConfig(projectPath: string) {
  return existsSync(join(projectPath, '.claude'))
}

export function apiPlugin(): Plugin {
  return {
    name: 'stack-agents-api',
    configureServer(server) {
      server.middlewares.use('/__api/projects', (_req, res) => {
        const paths = discoverProjects()
        const projects = paths.map((p) => {
          const name = basename(p)
          const git = getGitInfo(p)
          const stack = detectStack(p)
          const sprints = detectSprints(p)
          const hasClaude = hasClaudeConfig(p)
          return { name, path: p, git, stack, sprints, hasClaude }
        })
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(projects))
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
