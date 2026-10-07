// Makes the PNG icons in public/icons from public/favicon.svg (`npm run icons`). Chrome on Android offers to
// install the site only when the manifest has 192 and 512 pixel PNG icons. Run it again when the logo changes,
// and commit the result.
//
// Two shapes:
// - "rounded" is the logo as drawn, with its rounded corners on a transparent background.
// - "square" fills the whole image with the logo's background. Android cuts a maskable icon to its own shape
//   and iOS rounds the corners itself, so these must have no transparent corners. The spade stays inside the
//   central 80%, the part that every shape keeps.
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const icons = [
  { file: 'icon-192.png', size: 192, shape: 'rounded' },
  { file: 'icon-512.png', size: 512, shape: 'rounded' },
  { file: 'icon-maskable-512.png', size: 512, shape: 'square' },
  { file: 'apple-touch-icon.png', size: 180, shape: 'square' },
]

const publicDir = new URL('../public/', import.meta.url)
const svg = await readFile(new URL('favicon.svg', publicDir), 'utf8')
const background = svg.match(/<rect[^>]*fill="(#[0-9a-f]+)"/i)?.[1]
if (!background) throw new Error('favicon.svg has no background rectangle with a fill colour.')

await mkdir(new URL('icons/', publicDir), { recursive: true })

const browser = await chromium.launch()
for (const { file, size, shape } of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<style>html, body { margin: 0; background: ${shape === 'square' ? background : 'transparent'} }
    svg { display: block; width: ${size}px; height: ${size}px }</style>${svg}`,
  )
  await page.screenshot({ path: fileURLToPath(new URL(`icons/${file}`, publicDir)), omitBackground: true })
  await page.close()
  console.log(`icons/${file}`)
}
await browser.close()
