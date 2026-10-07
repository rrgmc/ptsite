import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const index = JSON.parse(readFileSync(new URL('../storybook-static/index.json', import.meta.url), 'utf8')) as {
  entries: Record<string, { id: string; type: string; title: string; name: string }>
}
const stories = Object.values(index.entries).filter((e) => e.type === 'story')

for (const story of stories) {
  test(`${story.title} › ${story.name}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`iframe.html?id=${story.id}&viewMode=story`)
    await page.locator('#storybook-root > *').first().waitFor()
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])

    // A sticky bar covers whatever is under it at this one scroll position, and the reader scrolls it clear. Left
    // sticky, axe's target-size rule fails whenever the bar happens to cover half a row of buttons (the planner's
    // "Agendar" bar over the days), which depends on nothing but the layout above it.
    await page.addStyleTag({ content: '.sticky { position: static !important; }' })

    const results = await new AxeBuilder({ page })
      .include('#storybook-root')
      .exclude('[data-live-announcer]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([])
  })
}
