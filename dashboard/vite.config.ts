import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { apiPlugin } from './vite-plugin-api'

export default defineConfig({
  plugins: [
    react(),
    apiPlugin(),
    // Transform .md imports to raw strings (used by import.meta.glob in agents.ts)
    {
      name: 'md-raw',
      load(id) {
        if (id.endsWith('.md')) {
          try {
            return `export default ${JSON.stringify(readFileSync(id, 'utf-8'))}`
          } catch { return null }
        }
      },
    },
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@xyflow')) return 'reactflow'
        },
      },
    },
  },
})
