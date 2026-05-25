---
preset: vite-react
base: vite-react
description: |
  Lightweight single-page application — no SSR, no server components, no API routes. Vite + React 19 + TypeScript strict + Tailwind CSS + shadcn/ui. The right choice for internal tools, admin dashboards, data visualization apps, and prototypes where you control the deployment environment and don't need SEO or server rendering. Includes Vitest for unit testing and Zod for form validation. Connects to an external API (your own Next.js backend or a third-party service) for data.
modules:
  - recharts
  - sentry
defaults_included:
  - vitest
  - zod
  - shadcn
---

# Preset: vite-react

**Lightweight SPA — no SSR.** A Vite + React 19 application for scenarios where Next.js App Router is overkill: internal tools, admin dashboards, rapid prototypes, and data visualization apps.

## What this preset is for

You're building something where:
- SEO doesn't matter (behind a login, internal tool, or admin-only)
- You don't need server-side rendering or server components
- You're connecting to an existing API (your Next.js backend, a REST API, or a third-party service)
- You want fast development iteration without Next.js's build system complexity
- The app will be deployed to Vercel as a static export, GitHub Pages, or served from any CDN

## What it is NOT for

If you need any of these, use `nextjs` or `nextjs-ai` instead:
- Public pages that need SEO or social sharing previews
- Server-side data fetching or caching
- API routes or webhook handling
- Auth with server-side session validation
- Streaming AI responses from the server

## Architecture it produces

```
src/
  main.tsx                ← React root, router setup
  App.tsx                 ← route definitions (React Router v7)
  pages/
    HomePage.tsx
    DashboardPage.tsx
  components/
    ui/                   ← shadcn/ui components
    charts/               ← Recharts wrappers
    layout/
      Sidebar.tsx
      Header.tsx
  lib/
    api.ts                ← typed fetch wrapper for external API
    auth.ts               ← token storage + refresh (if needed)
    utils.ts              ← shadcn utility functions
  hooks/
    useApi.ts             ← data fetching hook (SWR or TanStack Query)
  types/
    index.ts              ← shared TypeScript types
  test/
    setup.ts              ← Vitest setup

vite.config.ts
tailwind.config.ts
tsconfig.json             (strict)
index.html
```

## Key decisions encoded in this preset

**Vite over Next.js** — no SSR complexity, sub-second HMR, simple config. When you don't need server rendering, Next.js adds overhead with no benefit.

**React Router v7 over Next.js App Router** — client-side routing only. Simpler mental model for SPAs where all routes are public (after login) and there's no server-side routing requirement.

**TanStack Query for data fetching** — SWR alternative with better DevTools, optimistic updates, and query invalidation. Standard choice for apps with complex server state.

**No auth module included by default** — SPAs handle auth differently depending on whether you're using JWTs, cookies, or delegating to the API. The `lib/auth.ts` stub is a starting point; wire your specific auth provider's SDK.

**Sentry for error tracking** — still needed even in SPAs. Client-side errors, uncaught promise rejections, and network failures are invisible without it.

## Package.json

```json
{
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^7",
    "@tanstack/react-query": "^5",
    "zod": "^3",
    "recharts": "^2",
    "@sentry/react": "^8"
  },
  "devDependencies": {
    "typescript": "^5",
    "vite": "^6",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^4",
    "@tailwindcss/vite": "^4",
    "vitest": "^3",
    "@testing-library/react": "^16",
    "@testing-library/user-event": "^14",
    "eslint": "^9",
    "@typescript-eslint/eslint-plugin": "^8"
  },
  "scripts": {
    "dev": "vite --port 3100",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc --noEmit"
  }
}
```

## vite.config.ts

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

## lib/api.ts (typed fetch wrapper)

```ts
const BASE_URL = import.meta.env.VITE_API_URL;

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
```

## .env.example (complete)

```bash
# API
VITE_API_URL=http://localhost:3101/api

# Sentry
VITE_SENTRY_DSN=https://...@sentry.io/...

# App
VITE_APP_NAME=My App
```

## Deployment

Deploys as a static site. No serverless functions. Set the build output to `dist/` in Vercel or any CDN.

```bash
# vercel.json (if needed for SPA routing)
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
