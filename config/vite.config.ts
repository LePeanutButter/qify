import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const configDir = fileURLToPath(new URL('.', import.meta.url))
const workspaceRoot = resolve(configDir, '..')

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  root: workspaceRoot,
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(workspaceRoot, 'index.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lit')) {
            return 'vendor'
          }

          return undefined
        }
      }
    },
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(workspaceRoot, 'src'),
      '@/core': resolve(workspaceRoot, 'src/core'),
      '@/presentation': resolve(workspaceRoot, 'src/presentation'),
      '@/infrastructure': resolve(workspaceRoot, 'src/infrastructure'),
      '@/application': resolve(workspaceRoot, 'src/application'),
      '@/shared': resolve(workspaceRoot, 'src/core/shared')
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  preview: {
    port: 4173
  }
})
