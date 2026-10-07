import { defineConfig, devices } from '@playwright/test'
import { ports } from './ports.ts'

// End-to-end tests run against Laravel serving the built SPA, with a fresh database holding the demo league
// (backend/database/seeders/DatabaseSeeder.php). Build the frontend first: npm run build.
const executablePath = process.env.PW_CHROMIUM_PATH // e.g. a preinstalled Chromium in CI or a container
// E2E_ONLY=phone (or desktop) keeps one screen size: its tests, its server and its own results folder. With it,
// scripts/e2e-parallel.mjs runs the two sizes side by side as two Playwright processes.
const only = process.env.E2E_ONLY
const servers = ([
  { name: 'phone', device: 'Pixel 7', port: ports.e2ePhone },
  { name: 'desktop', device: 'Desktop Chrome', port: ports.e2eDesktop },
] as const).filter(({ name }) => !only || name === only)
if (servers.length === 0) throw new Error(`E2E_ONLY must be "phone" or "desktop", got "${only}"`)

export default defineConfig({
  testDir: './tests',
  outputDir: only ? `test-results/${only}` : 'test-results',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  // Each screen size gets its own server and database, so tests that change data do not affect each other.
  projects: servers.map(({ name, device, port }) => ({
    name,
    use: { ...devices[device], baseURL: `http://127.0.0.1:${port}/app/`, launchOptions: executablePath ? { executablePath } : {} },
  })),
  webServer: servers.map(({ name, port }) => ({
    cwd: '../backend',
    // The server's own output goes to a log that CI prints and uploads when a run fails.
    command: [
      'node ../frontend/scripts/e2e-server.mjs',
      `--database e2e_${name} --port ${port} --log storage/logs/e2e-server-${name}.log`,
      '--docroot public --router ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php',
    ].join(' '),
    // No mail server is needed: the password link message is kept in memory and dropped.
    env: { LOGIN_THROTTLE: '1000', PASSWORD_RESET_THROTTLE: '1000', MAIL_MAILER: 'array' },
    url: `http://127.0.0.1:${port}/up`,
    reuseExistingServer: false,
    timeout: 120_000,
  })),
})
