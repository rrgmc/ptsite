import type { Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isCommonAssetRequest } from 'msw'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'
import { handlers } from '../src/mocks/handlers'
import '../src/index.css'

// The built Storybook is a folder of static files that can be served from anywhere, so the mock API's service
// worker is loaded relative to the page, not from the domain root. Otherwise the same as the addon's default setup.
async function startMockApi() {
  const worker = setupWorker()
  await worker.start({
    quiet: true,
    serviceWorker: { url: new URL('mockServiceWorker.js', document.baseURI).pathname },
    onUnhandledRequest(request, print) {
      if (isCommonAssetRequest(request) || /iframe\.html|sb-vite|@vite|@react-refresh|\/virtual:|\.stories\./.test(request.url)) return
      print.warning()
    },
  })
  return worker
}

const preview: Preview = {
  parameters: {
    layout: 'padded',
    msw: handlers,
    a11y: { test: 'error' },
    viewport: { defaultViewport: 'mobile1' },
  },
  loaders: [mswLoader(startMockApi)],
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Story />
      </QueryClientProvider>
    ),
  ],
}

export default preview
