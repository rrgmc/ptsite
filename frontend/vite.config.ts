import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { ports } from './ports.ts'

const backend = process.env.BACKEND_URL ?? `http://127.0.0.1:${ports.backend}`

// The version shown in the footer. A release is a git tag (see RELEASE.md), so the version comes from git:
// "v2.1.0" on a tag, "v2.1.0-3-gabc1234" three commits after it. APP_VERSION replaces it where the checkout
// has no tags, as in the release workflow.
function appVersion(): string {
  if (process.env.APP_VERSION) return process.env.APP_VERSION
  try {
    return execSync('git describe --tags --always --dirty', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || 'dev'
  } catch {
    return 'dev'
  }
}

// The built site is served by Laravel from backend/public/app on the same domain as the API,
// so the login cookie just works. In development, Vite forwards API calls to Laravel.
// The site is at the root of its domain: the app at /app/, the API at /api (see src/lib/paths.ts).
export default defineConfig({
  base: '/app/',
  define: { __APP_VERSION__: JSON.stringify(appVersion()) },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: ports.vite,
    proxy: {
      '/api': backend,
      '/sanctum': backend,
    },
  },
  build: {
    outDir: '../backend/public/app',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
