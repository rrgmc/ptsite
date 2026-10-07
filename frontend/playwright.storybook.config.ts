import { defineConfig } from '@playwright/test'
import { ports } from './ports.ts'

// Renders every Storybook story (build it first: npm run build-storybook) and checks it with axe.
const executablePath = process.env.PW_CHROMIUM_PATH
const port = ports.storybookTest

export default defineConfig({
  testDir: './tests-storybook',
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}/`,
    viewport: { width: 390, height: 844 },
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: `python3 -m http.server ${port} --bind 127.0.0.1 --directory storybook-static`,
    url: `http://127.0.0.1:${port}/index.json`,
    reuseExistingServer: false,
  },
})
