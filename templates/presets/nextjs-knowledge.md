---
preset: nextjs-knowledge
base: nextjs
description: |
  Knowledge management and second brain platform — the secondbrain pattern. Adds pgvector for semantic search over notes and documents, Tiptap rich text editor for block-based content authoring, Recharts for activity and knowledge graph visualizations, and Anthropic for AI-powered summarization, tagging, and retrieval-augmented generation (RAG) over the user's knowledge base. Organized around the PARA method (Projects, Areas, Resources, Archives).
modules:
  - neon
  - neon-auth
  - api-usage
  - pgvector
  - upstash
  - anthropic
  - tiptap
  - recharts
  - resend
  - sentry
defaults_included:
  - vitest
  - playwright
  - zod
  - shadcn
---

# Preset: nextjs-knowledge

**The secondbrain pattern.** A Next.js 15 knowledge management platform where users capture, organize, and retrieve their notes, documents, and research using AI-powered semantic search.

## What this preset is for

You're building a platform where:
- Users write and store notes, documents, and research in a structured way
- Content is organized by the PARA method: Projects, Areas, Resources, Archives
- AI surfaces related notes and answers questions over the user's knowledge base (RAG)
- Semantic search returns conceptually related items even when keywords don't match
- The editor is rich text with markdown shortcuts, code blocks, and block-based structure
- Users want to see trends and capture patterns: activity heatmaps, most-linked topics, growth over time

## Architecture it produces

```
app/
  (dashboard)/
    inbox/                ← quick capture, unsorted notes
    projects/[id]/        ← project notes + related resources (semantic)
    areas/[id]/           ← ongoing responsibility areas
    resources/[id]/       ← reference material, research
    archive/              ← completed projects, inactive notes
    search/               ← semantic search interface
    analytics/            ← Recharts: writing activity, tag trends
  api/
    auth/[...path]/       ← Neon Auth handlers
    notes/
      route.ts            ← CRUD (create embeds note on write)
    search/
      route.ts            ← pgvector cosine similarity search
    ai/
      summarize/          ← Anthropic summarization endpoint
      ask/                ← RAG: question over knowledge base

lib/
  db/
    index.ts              ← Neon + Drizzle
  search/
    embed.ts              ← text-embedding-3-small via OpenAI
    search.ts             ← pgvector cosine similarity query
  ai/
    client.ts             ← Anthropic 3-tier model config
    rag.ts                ← retrieve chunks, build context, call Claude
    budget.ts             ← Upstash per-user AI call tracking

db/
  schema.ts               ← notes, tags, note_tags, embeddings, para_items

components/
  editor/
    RichTextEditor.tsx    ← Tiptap editor with starter extensions
  charts/
    ActivityHeatmap.tsx   ← GitHub-style writing calendar
    TagCloud.tsx          ← Most-used tags by frequency
```

## Key decisions encoded in this preset

**pgvector over Pinecone/Weaviate** — knowledge bases are personal (single-user or small team) and rarely exceed millions of vectors. Keeping vectors in the same Postgres instance eliminates sync complexity, consistency lag, and an additional service to pay for.

**PARA structure encoded in schema** — `para_type ENUM('project', 'area', 'resource', 'archive')` on the `notes` table. PARA is the organizational system users already know from Tiago Forte's work; encoding it in the data model means the UI falls naturally out of GROUP BY queries.

**Tiptap over Notion-like block editor** — Tiptap gives you a headless ProseMirror editor with React bindings. Building a full Notion clone is months of work. Tiptap's starter kit covers 90% of user needs (headings, bold/italic, code blocks, lists) with a weekend of setup.

**RAG over full-document LLM context** — user knowledge bases grow to thousands of notes. Chunking + embedding + retrieval is required to stay within model context windows and to target the most relevant content for each question.

**Neon Auth over Clerk** — single-user or small-team tool. Neon Auth is simpler, has no per-seat pricing, and the user's data is already in Neon — no need to sync user records from a separate auth service.

## Schema overview

```ts
// db/schema.ts
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  paraType: text("para_type", { enum: ["project", "area", "resource", "archive"] }).notNull().default("inbox"),
  paraItemId: uuid("para_item_id"),  // FK to para_items
  title: text("title").notNull(),
  content: text("content").notNull().default(""),  // Tiptap HTML
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paraItems = pgTable("para_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type", { enum: ["project", "area", "resource", "archive"] }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  archivedAt: timestamp("archived_at"),
});

export const tags = pgTable("tags", { ... });
export const noteTags = pgTable("note_tags", { ... });
```

## .env.example (complete)

```bash
# Neon
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Neon Auth
NEON_AUTH_BASE_URL=https://...
NEON_AUTH_COOKIE_SECRET=<32-char random string>

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL_HEAVY=claude-opus-4-7
ANTHROPIC_MODEL_STANDARD=claude-sonnet-4-6
ANTHROPIC_MODEL_LIGHT=claude-haiku-4-5-20251001
ANTHROPIC_DAILY_USER_CAP=50
ANTHROPIC_DAILY_SPEND_KILL_SWITCH_USD=10
ANTHROPIC_MONTHLY_BUDGET_USD=100

# OpenAI (for text-embedding-3-small)
OPENAI_API_KEY=sk-...

# Upstash Redis
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
KV_URL=redis://...

# Resend (digest emails)
RESEND_API_KEY=re_...
EMAIL_FROM=SecondBrain <noreply@yourdomain.com>

# Sentry
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Post-install notes

- Enable pgvector extension: run `CREATE EXTENSION IF NOT EXISTS vector;` as the first migration.
- Create HNSW index on `embedding` column after initial data load (not before — index on empty table is wasted work).
- Embedding generation happens server-side on note save. Debounce the embed call — don't embed on every keystroke, only on `onBlur` or explicit save.
- Consider batching embeddings for import: call OpenAI `embeddings` with up to 2048 texts in one request.
