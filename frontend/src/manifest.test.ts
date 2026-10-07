import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { faviconFor, loadSite, manifestFor } from '../site-settings'

// Chrome on Android offers to install the site only when the manifest lists PNG icons of 192 and 512 pixels.
// The manifest is made from the site's settings (site-settings.ts). The icons are the files in public/, which
// `npm run icons` makes. Vitest runs in the frontend folder.
const inPublic = (file: string) => resolve('public', file)

const site = loadSite()
const manifest = manifestFor(site)
const pngIcons = manifest.icons.filter((icon) => icon.type === 'image/png')

/** The width and height of a PNG file, from its header. */
function pngSize(file: string): string {
  const bytes = readFileSync(file)
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`
}

describe('web app manifest', () => {
  it('opens the site without the browser bar', () => {
    expect(manifest.display).toBe('standalone')
  })

  it('names the site and takes its main color', () => {
    expect(manifest.name).toBe(site.name)
    expect(manifest.short_name).toBe(site.shortName)
    expect(manifest.lang).toBe(site.locale)
    expect(manifest.theme_color).toBe(site.brandColor)
  })

  it('keeps the identity of an installed app whatever the site is called', () => {
    expect(manifestFor({ ...site, name: 'Outro Nome' })).toMatchObject({ id: './', start_url: './', scope: './' })
  })

  it('has the icons that Chrome needs to offer the install', () => {
    const plain = pngIcons.filter((icon) => icon.purpose === 'any').map((icon) => icon.sizes)
    expect(plain).toEqual(expect.arrayContaining(['192x192', '512x512']))
  })

  it('has a maskable icon, which Android cuts to its own shape', () => {
    expect(pngIcons.some((icon) => icon.purpose === 'maskable' && icon.sizes === '512x512')).toBe(true)
  })

  it.each(pngIcons)('$src exists and has the size it declares', ({ src, sizes }) => {
    expect(pngSize(inPublic(src))).toBe(sizes)
  })
})

describe('site icon', () => {
  it('is drawn on the main color', () => {
    expect(faviconFor({ ...site, brandColor: '#1e3a8a' })).toContain('fill="#1e3a8a"')
  })
})
