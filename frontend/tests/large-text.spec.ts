import { expect, test } from '@playwright/test'
import { login, pickSeason, seasonLink } from './helpers'

// Many phones use a larger text size (Android: Settings > Display > Font size). Text inputs, headings and rows of
// buttons then grow, and one element wider than the screen makes the whole page scroll sideways and zoom out.
// Scaling the root font size is how the browser applies that setting to our rem-based sizes.
test.use({ viewport: { width: 360, height: 780 } })

const screens = [
  '', 'results', 'calendar', 'simulator', 'statistics', 'players', 'players/1', 'players/1/all', 'seasons', 'seasons/select',
  'profile',
  'admin', 'admin/seasons/new', 'admin/players', 'admin/players/1', 'admin/players/new', 'admin/places', 'admin/places/new',
  'admin/holidays', 'admin/audit-log',
]

// A second header line costs a small screen a lot of height, so at a moderately larger text size the season name
// is cut short instead. At the larger sizes below, the name does take a line of its own.
test('the header stays on one line with text at 130%', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone layout only')
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = '130%' })
  })
  await login(page, 'dev-admin')
  const menu = await page.getByRole('button', { name: 'Menu' }).boundingBox()
  const season = await seasonLink(page).boundingBox()
  expect(season!.y, 'the season name is beside the menu button').toBeLessThan(menu!.y + menu!.height)
  expect(season!.x + season!.width, 'the season name ends inside the screen').toBeLessThanOrEqual(360)
})

for (const scale of [160, 200]) {
  test(`no screen is wider than a small phone with text at ${scale}%`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Phone layout only')
    // Every screen in turn takes longer than the usual limit.
    test.setTimeout(60_000)
    await page.addInitScript((percent) => {
      document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = `${percent}%` })
    }, scale)
    await login(page, 'dev-admin')
    for (const path of screens) {
      await page.goto(path || './')
      await page.waitForLoadState('networkidle')
      const width = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(width, `/app/${path} at ${scale}%`).toBeLessThanOrEqual(360)
    }

    // A long season name in the header, with the notice that it is not the current season, and the open menu.
    await page.goto('results')
    await pickSeason(page, 'E2E Planejamento')
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `a picked season at ${scale}%`).toBeLessThanOrEqual(360)
    await page.getByRole('button', { name: 'Menu' }).click()
    const menu = await page.getByRole('dialog', { name: 'Menu' }).boundingBox()
    expect(menu!.x + menu!.width, `the menu at ${scale}%`).toBeLessThanOrEqual(360)
  })
}
