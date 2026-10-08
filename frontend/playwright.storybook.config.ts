import { defineConfig } from '@playwright/test'
import { ports } from './ports.ts'

// Renders every Storybook story (build it first: npm run build-storybook) and checks it with axe.
const executablePath = process.env.PW_CHROMIUM_PATH
const port = ports.storybookTest

export default defineConfig({
  testDir: './tests-storybook',
  // Every story is a test of the one file, on a page of its own, so they run side by side. CI's runner has two
  // cores, and Playwright would use only one of them.
  fullyParallel: true,
  workers: process.env.CI ? '100%' : undefined,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}/`,
    viewport: { width: 390, height: 844 },
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    // PHP serves the files: the project needs it anyway, and Windows has no python3.
    command: `php -S 127.0.0.1:${port} -t storybook-static`,
    url: `http://127.0.0.1:${port}/index.json`,
    reuseExistingServer: false,
  },
})
