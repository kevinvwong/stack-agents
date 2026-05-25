---
module: pgvector
category: database
description: pgvector extension on Neon — vector embeddings for semantic search, RAG, and knowledge retrieval. Requires Neon base module.
install: SQL migration + npm
---

# Module: pgvector

pgvector is a Postgres extension available on Neon that adds vector column types and similarity operators. Used in secondbrain (semantic search over notes), GTLI (related content retrieval), and any app needing "find similar items" without a dedicated vector database.

## Why this module

- Keeps vectors in the same database as your other data — no sync, no consistency lag
- Neon supports pgvector natively — no separate deployment
- `<=>` cosine distance operator works with Drizzle via raw SQL
- Sufficient for millions of vectors — only consider a dedicated vector DB above ~50M rows

## Depends on

- `neon` base module
- OpenAI or Anthropic embeddings (external — call their API for embedding generation)

## Scaffold

**Enable in Neon (run once via migration):**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**db/schema.ts additions:**
```ts
import { pgTable, uuid, text, vector, index } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
}, (t) => ({
  embeddingIdx: index("embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
}));
```

**lib/search/embed.ts:**
```ts
export async function getEmbedding(text: string): Promise<number[]> {
  // Use OpenAI text-embedding-3-small (1536-dim) or Anthropic voyage-3
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  const data = await response.json();
  return data.data[0].embedding;
}
```

**lib/search/search.ts:**
```ts
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getEmbedding } from "./embed";
import { documents } from "@/db/schema";

export async function semanticSearch(query: string, limit = 10) {
  const embedding = await getEmbedding(query);
  const vectorStr = `[${embedding.join(",")}]`;
  return db
    .select()
    .from(documents)
    .orderBy(sql`embedding <=> ${vectorStr}::vector`)
    .limit(limit);
}
```

## .env.example additions

```bash
# Vector search (if using OpenAI embeddings)
OPENAI_API_KEY=sk-...
```
