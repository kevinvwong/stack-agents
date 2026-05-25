---
module: tiptap
category: ui
description: Tiptap rich text editor — block-based editor for knowledge base content, notes, and structured documents
install: npm
---

# Module: tiptap

Tiptap headless rich text editor for block-based content authoring. Used in secondbrain (note taking), GTLI (lesson content editing), and any app where users write structured documents beyond plain textarea.

## Why this module

- Headless: you own all the UI — no styling conflicts with Tailwind/shadcn
- ProseMirror underneath: mature, extensible, handles complex document models
- Block-based structure maps to JSON — easy to store in Postgres and render as HTML
- Extensions for markdown shortcuts, code blocks, mentions, drag-handle

## Packages

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder
```

## Scaffold

**components/editor/RichTextEditor.tsx:**
```tsx
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface Props {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing..." }),
    ],
    content,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  return (
    <div className="prose prose-sm max-w-none rounded-md border p-4">
      <EditorContent editor={editor} />
    </div>
  );
}
```

**db/schema.ts additions:**
```ts
// Store editor content as HTML or JSON
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),  // Tiptap HTML
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## No env vars required
