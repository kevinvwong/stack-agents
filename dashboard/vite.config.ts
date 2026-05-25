import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { apiPlugin } from './vite-plugin-api'

export default defineConfig({
  plugins: [
    react(),
    apiPlugin(),
    // Transform .md imports to raw strings
    {
      name: 'md-raw',
      transform(code, id) {
        if (id.endsWith('.md') || id.includes('.md?raw')) {
          return { code: `export default ${JSON.stringify(code)}`, map: null }
        }
      },
      load(id) {
        if (id.endsWith('.md')) {
          const { readFileSync } = require('fs')
          try {
            return `export default ${JSON.stringify(readFileSync(id, 'utf-8'))}`
          } catch { return null }
        }
      },
    },
  ],
})
