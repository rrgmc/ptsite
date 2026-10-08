// Runs the end-to-end tests of the two screen sizes at the same time, as two Playwright processes
// (`npm run test:e2e:parallel`). Each size already has its own server and database (playwright.config.ts), so
// they do not affect each other. Within one size the tests still run one at a time, because they share its data.
// CI uses it to finish sooner.
//
// Arguments go to both processes: node scripts/e2e-parallel.mjs tests/admin.spec.ts
// CI splits the test files over four jobs with one: --shard=1/4 to --shard=4/4.
import { spawn } from 'node:child_process'

const sizes = ['phone', 'desktop']

const codes = await Promise.all(sizes.map((size) => new Promise((resolve) => {
  // One command line, through the shell, so that Windows finds npx.cmd.
  const run = spawn(['npx', 'playwright', 'test', ...process.argv.slice(2)].join(' '), {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, E2E_ONLY: size },
  })
  run.on('exit', (code) => resolve(code ?? 1))
})))

sizes.forEach((size, i) => console.log(`${size}: ${codes[i] === 0 ? 'passed' : `failed (exit code ${codes[i]})`}`))
process.exit(codes.some((code) => code !== 0) ? 1 : 0)
