import { expect, test } from '@playwright/test'
import { expectAccessible, login, pickSeason } from './helpers'

// The season calendar (docs/specs/season-calendar.md), seen by a player.

test('a player sees a finished season on the calendar, with the winners, and opens a night', async ({ page }) => {
  await login(page, 'dev-player')
  await page.getByRole('link', { name: /Calendário/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Calendário', level: 1 })).toBeVisible()
  await pickSeason(page, 'Liga 2022')
  await expect(page).toHaveURL(/\/calendar$/)

  const april = page.getByRole('region', { name: 'Abril de 2022' })
  await expect(april).toContainText('Quinta-feira, 21/04 · Feriado: Tiradentes')
  await expect(april).toContainText('Sexta-feira, 22/04 · Sem evento · Emenda: Tiradentes')
  await expect(april.getByRole('listitem').filter({ hasText: '🏆' }).first()).toBeVisible()
  await expectAccessible(page)

  await april.getByRole('listitem').filter({ hasText: '🏆' }).first().getByRole('link').click()
  await expect(page).toHaveURL(/nights\/\d+$/)
})

test('the calendar marks today', async ({ page }) => {
  // The first test with a fixed clock: a day inside Liga 2022, which is a finished season.
  await page.clock.setFixedTime(new Date('2022-04-15T12:00:00-03:00'))
  await login(page, 'dev-player')
  await page.getByRole('link', { name: /Calendário/ }).first().click()
  await pickSeason(page, 'Liga 2022')

  // Today is in the season, so the page starts at April, with a link to the complete calendar.
  await expect(page.getByRole('region').first()).toHaveAccessibleName('Abril de 2022')
  await expect(page.getByRole('region', { name: 'Maio de 2022' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Março de 2022' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ir para hoje' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Ver o calendário completo' }).click()
  await expect(page).toHaveURL(/\/calendar\?view=all$/)
  await expect(page.getByRole('region', { name: 'Março de 2022' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver a partir deste mês' })).toBeVisible()

  const today = page.locator('[aria-current="date"]')
  await expect(today).toHaveCount(1)
  await expect(page.getByRole('region', { name: 'Abril de 2022' }).locator('[aria-current="date"]')).toContainText('15/04/2022')
  await expect(today).toContainText('(hoje)')
  await expect(page.getByRole('list', { name: 'Legenda' })).toContainText('Hoje')
  // The complete calendar starts before April. Nothing is coming in a finished season, so the button goes to
  // today's month.
  await expect(page.getByRole('heading', { name: 'Calendário', level: 1 })).toBeInViewport()
  await page.getByRole('button', { name: 'Ir para hoje' }).click()
  const april = page.getByRole('heading', { name: 'Abril de 2022' })
  await expect(april).toBeInViewport()
  await expect(april).toBeFocused()
  await expectAccessible(page)
})
