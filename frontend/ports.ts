import { existsSync, readFileSync } from 'node:fs'

// The local ports. An offset moves them all, so two checkouts of the repository (git worktrees) can run their
// servers and tests at the same time: with offset 100, Laravel is on :8100, Vite on :5273, and so on.
// The offset is the PORT_OFFSET line of local/ports.env, which `task worktree:init` writes in a new worktree, or
// else the PORT_OFFSET environment variable. Taskfile.yml and scripts/screenshots.sh read it the same way.
function readOffset(): number {
  const file = new URL('../local/ports.env', import.meta.url)
  const fromFile = existsSync(file) ? /^PORT_OFFSET=(.*)$/m.exec(readFileSync(file, 'utf8'))?.[1] : undefined
  const value = (fromFile ?? process.env.PORT_OFFSET ?? '0').trim()
  if (!/^\d+$/.test(value)) throw new Error(`PORT_OFFSET must be a whole number, got "${value}"`)
  return Number(value)
}

const offset = readOffset()

export const ports = {
  backend: 8000 + offset, // php artisan serve
  vite: 5173 + offset,
  storybookTest: 6007 + offset, // the built Storybook, for npm run test:storybook
  e2ePhone: 8123 + offset,
  e2eDesktop: 8124 + offset,
}
