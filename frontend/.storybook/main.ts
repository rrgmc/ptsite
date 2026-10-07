import type { StorybookConfig } from '@storybook/react-vite'

// Storybook is where design and code meet: every component and screen state can be reviewed in a browser
// without the backend. The API is mocked with MSW (src/mocks). See docs/architecture/frontend.md.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  staticDirs: ['../storybook-public', '../public'],
  viteFinal: async (config) => ({ ...config, base: './' }),
}

export default config
