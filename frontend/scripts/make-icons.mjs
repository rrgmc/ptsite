// Makes the PNG icons from the site's icon, which is drawn on its main color (`npm run icons`). Chrome on
// Android offers to install the site only when the manifest has 192 and 512 pixel PNG icons. Run it again when
// the site's main color changes, and commit the result.
//
// - Without PTSITE_SITE_DIR it draws the demo site's icons into public/icons here.
// - With PTSITE_SITE_DIR it draws that site's icons into its own public/icons folder, which the build puts
//   over the ones here (site/README.md).
//
// Two shapes:
// - "rounded" is the logo as drawn, with its rounded corners on a transparent background.
// - "square" fills the whole image with the logo's background. Android cuts a maskable icon to its own shape
//   and iOS rounds the corners itself, so these must have no transparent corners. The spade stays inside the
//   central 80%, the part that every shape keeps.
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { faviconFor, loadSite, siteDir } from '../site-settings.ts'

const icons = [
  { file: 'icon-192.png', size: 192, shape: 'rounded' },
  { file: 'icon-512.png', size: 512, shape: 'rounded' },
  { file: 'icon-maskable-512.png', size: 512, shape: 'square' },
  { file: 'apple-touch-icon.png', size: 180, shape: 'square' },
]

const site = loadSite()
const svg = faviconFor(site)
const out = process.env.PTSITE_SITE_DIR ? join(siteDir, 'public', 'icons') : fileURLToPath(new URL('../public/icons', import.meta.url))

await mkdir(out, { recursive: true })

const browser = await chromium.launch()
for (const { file, size, shape } of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<style>html, body { margin: 0; background: ${shape === 'square' ? site.brandColor : 'transparent'} }
    svg { display: block; width: ${size}px; height: ${size}px }</style>${svg}`,
  )
  await page.screenshot({ path: join(out, file), omitBackground: true })
  await page.close()
  console.log(join(out, file))
}
await browser.close()
