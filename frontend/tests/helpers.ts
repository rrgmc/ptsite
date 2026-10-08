import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export async function login(page: Page, username: string) {
  await page.goto('login')
  await page.getByLabel('Usuário').fill(username)
  await page.getByLabel('Senha').fill('password')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Classificação' })).toBeVisible()
}

/** Logs out and waits for the login form, so the next login starts from a logged-out page. */
export async function logout(page: Page) {
  const exit = page.getByRole('button', { name: 'Sair' })
  // On a phone "Sair" is in the menu.
  if (!(await exit.isVisible())) await page.getByRole('button', { name: 'Menu' }).click()
  await exit.click()
  await expect(page.getByLabel('Usuário')).toBeVisible()
}

/** The season name in the header, which leads to "Escolher temporada". */
export function seasonLink(page: Page) {
  return page.getByRole('link', { name: /^Temporada:/ })
}

/** The notice shown while a season other than the current one is selected. */
export function seasonNotice(page: Page) {
  return page.getByRole('complementary', { name: 'Temporada selecionada' })
}

/** Picks a season in "Escolher temporada", opened from the header. The site returns to the season screen it was on. */
export async function pickSeason(page: Page, name: string) {
  await seasonLink(page).click()
  await page.getByRole('row').filter({ has: page.getByText(name, { exact: true }) }).getByRole('button').click()
  await expect(seasonLink(page)).toContainText(name)
}

/** Fails on any WCAG 2.2 A/AA violation that axe can detect (docs/decisions/0005-ui-design-system.md). */
export async function expectAccessible(page: Page) {
  // React Aria's hidden live-announcer region can briefly hold an element whose label was already removed;
  // it is a library internal, not part of our markup.
  // A sticky bar covers whatever is under it at this one scroll position, and the reader scrolls it clear. Left
  // sticky, axe's target-size rule fails whenever the header happens to cover half a field, which depends on
  // nothing but the height of the page (see tests-storybook/stories.spec.ts). The page gets its bars back after.
  const unstick = await page.addStyleTag({ content: '.sticky { position: static !important; }' })
  const results = await new AxeBuilder({ page })
    .exclude('[data-live-announcer]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  await unstick.evaluate((style) => style.remove())
  expect(results.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([])
}
