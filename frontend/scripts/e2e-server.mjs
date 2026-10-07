// Starts Laravel for one end-to-end test server: a fresh MySQL database with the development seed and the test
// seasons (backend/database/seeders/EndToEndSeeder.php), then PHP's built-in server. MySQL must be running
// (`task db:up`). Written in Node rather than as a shell line so it runs the same on Linux, macOS and Windows.
// Run from backend/ (the Playwright configs set cwd); the extra environment comes from the config's `env`.
//
// opcache's JIT is off, as `php artisan serve` starts it: on PHP 8.3 in CI the JIT crashed the server now and then
// (a segmentation fault in zend_objects_store_del, from JIT-compiled code). JIT is also off by default on real
// hosts. With E2E_GDB=1 (CI) the server runs under gdb, so a crash of PHP itself prints a backtrace to the log.
//
// Usage: node e2e-server.mjs --database <name, such as e2e_phone> --port <port> --router <script> --log <file>
//   [--docroot <folder>]. Paths are relative to backend/; --router is relative to --docroot.
import { spawn, spawnSync } from 'node:child_process'
import { appendFileSync, mkdirSync, openSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const { values: args } = parseArgs({
  options: {
    database: { type: 'string' },
    port: { type: 'string' },
    router: { type: 'string' },
    log: { type: 'string' },
    docroot: { type: 'string', default: '.' },
  },
})

// The server's own database: the development one's name plus this suffix (backend/config/database.php).
const env = { ...process.env, DB_DATABASE_SUFFIX: `_${args.database}` }

// Create the database if the MySQL server lacks it, then the development seed (the demo league and the dev
// logins), then the seasons the tests change.
for (const artisan of [
  ['ptsite:prepare-database'],
  ['migrate:fresh', '--seed', '--force'],
  ['db:seed', '--class=EndToEndSeeder', '--force'],
]) {
  const seed = spawnSync('php', ['artisan', ...artisan, '-q'], { stdio: 'inherit', env })
  if (seed.status !== 0) {
    console.error(`e2e-server: ${artisan[0]} on ${args.database} failed`, seed.error ?? '')
    process.exit(seed.status ?? 1)
  }
}

const log = resolve(args.log)
mkdirSync(dirname(log), { recursive: true })
const out = openSync(log, 'a')
const phpArgs = ['-d', 'opcache.jit=disable', '-d', 'opcache.jit_buffer_size=0', '-S', `127.0.0.1:${args.port}`, args.router]
const [command, commandArgs] = process.env.E2E_GDB
  ? ['gdb', ['-q', '-batch', '-ex', 'handle SIGPIPE nostop noprint pass', '-ex', 'run', '-ex', 'bt', '--args', 'php', ...phpArgs]]
  : ['php', phpArgs]
const server = spawn(command, commandArgs, { cwd: resolve(args.docroot), env, stdio: ['ignore', out, out] })

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal))
server.on('exit', (code, signal) => {
  appendFileSync(log, `server exited with code ${code ?? signal}\n`)
  process.exit(code ?? 1)
})
