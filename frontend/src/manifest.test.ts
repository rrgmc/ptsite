import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Chrome on Android offers to install the site only when the manifest lists PNG icons of 192 and 512 pixels.
// These tests read the files in public/, which `npm run icons` makes. Vitest runs in the frontend folder.
const inPublic = (file: string) => resolve('public', file)

type Icon = { src: string; sizes: string; type: string; purpose: string }

const manifest = JSON.parse(readFileSync(inPublic('manifest.webmanifest'), 'utf8')) as {
  display: string
  icons: Icon[]
}
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
