import { expect, test } from '@playwright/test'
import { expectAccessible, login, logout, pickSeason, seasonLink, seasonNotice } from './helpers'

// A season at its own address, opened from "Escolher temporada", the seasons with their first ten in "Temporadas"
// (docs/specs/seasons-and-nights.md), and the left menu.

test('the season list marks the current season, which is the selected one at first', async ({ page }) => {
  await login(page, 'dev-player')
  // The browser title names the screen.
  await expect(page).toHaveTitle('Classificação · Liga Demo')
  await seasonLink(page).click()
  await expect(page).toHaveURL(/\/seasons\/select$/)
  await expect(page.getByRole('heading', { name: 'Escolher temporada', level: 1 })).toBeVisible()
  await expect(page).toHaveTitle('Escolher temporada · Liga Demo')

  const selected = page.locator('tr[aria-current="true"]')
  await expect(selected).toHaveCount(1)
  await expect(selected).toContainText('✓ Selecionada')
  await expect(selected).toContainText('Atual')
  await expect(page.getByRole('row').filter({ hasText: 'Liga 2022' })).toContainText('Finalizada')
  await expectAccessible(page)
})

test('a picked season has its own address, which the menu keeps until the user goes back to the current one', async ({ page }) => {
  await login(page, 'dev-keeper')
  await pickSeason(page, 'Liga 2022')
  await expect(page).toHaveURL(/\/app\/seasons\/\d+$/)
  await expect(page.getByText(/^Liga 2022 · \d+ eventos$/)).toBeVisible()
  await expect(seasonNotice(page)).toContainText('Você está vendo Liga 2022, que não é a temporada atual.')

  const tab = (name: string) => page.getByRole('link', { name }).first()
  await tab('Resultados').click()
  await expect(page).toHaveURL(/\/seasons\/\d+\/results$/)
  await expect(tab('Resultados')).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText(/^Liga \d+ - \d\d\/\d\d\/2022$/).first()).toBeVisible()
  await expect(seasonNotice(page)).toBeVisible()
  // A finished season takes no new night.
  await expect(page.getByRole('button', { name: '+ Agendar' })).toHaveCount(0)

  await tab('Calendário').click()
  await expect(page).toHaveURL(/\/seasons\/\d+\/calendar$/)
  await expect(page.getByRole('region', { name: 'Abril de 2022' })).toBeVisible()
  await tab('Simulação').click()
  await expect(page).toHaveURL(/\/seasons\/\d+\/simulator$/)
  await expect(page.getByText(/· Liga 2022$/)).toBeVisible()

  await page.reload()
  await expect(seasonLink(page)).toContainText('Liga 2022')

  // Screens that do not show a season have no notice, and their menu leads back to the season the tab showed last.
  await tab('Jogadores').click()
  await expect(page).toHaveURL(/\/app\/players$/)
  await expect(page.getByRole('heading', { name: 'Jogadores', level: 1 })).toBeVisible()
  await expect(seasonNotice(page)).toHaveCount(0)
  await expect(seasonLink(page)).toContainText('Liga 2022')

  await tab('Resultados').click()
  await expect(page).toHaveURL(/\/seasons\/\d+\/results$/)
  await seasonNotice(page).getByRole('button', { name: 'Voltar para a atual' }).click()
  await expect(page).toHaveURL(/\/app\/results$/)
  await expect(seasonNotice(page)).toHaveCount(0)
  await expect(seasonLink(page)).not.toContainText('Liga 2022')
  await expect(page.getByRole('button', { name: '+ Agendar' })).toBeVisible()

  // The browser's "back" returns to the season's own address.
  await page.goBack()
  await expect(page).toHaveURL(/\/seasons\/\d+\/results$/)
  await expect(seasonNotice(page)).toBeVisible()
})

test('a player opened from a season shows that season, at the season\'s address', async ({ page }) => {
  await login(page, 'dev-player')
  await pickSeason(page, 'Liga 2022')
  await page.getByRole('table').getByRole('row').nth(1).getByRole('link').first().click()
  await expect(page).toHaveURL(/\/seasons\/\d+\/players\/\d+$/)
  await expect(seasonNotice(page)).toContainText('Liga 2022')

  await seasonNotice(page).getByRole('button', { name: 'Voltar para a atual' }).click()
  await expect(page).toHaveURL(/\/app\/players\/\d+$/)
  await expect(seasonNotice(page)).toHaveCount(0)
})

test('picking the current season again removes the notice', async ({ page }) => {
  await login(page, 'dev-player')
  await pickSeason(page, 'Liga 2022')
  await expect(seasonNotice(page)).toBeVisible()

  await seasonLink(page).click()
  await page.getByRole('row').filter({ hasText: 'Atual' }).getByRole('button').click()
  await expect(page).toHaveURL(/\/app\/?$/)
  await expect(page.getByRole('heading', { name: 'Classificação', level: 1 })).toBeVisible()
  await expect(seasonNotice(page)).toHaveCount(0)
})

test('"Temporadas" shows the first ten of every season, and makes one the selected season', async ({ page }) => {
  await login(page, 'dev-player')
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Temporadas' }).click()
  await expect(page).toHaveURL(/\/seasons$/)
  await expect(page.getByRole('heading', { name: 'Temporadas', level: 1 })).toBeVisible()
  await expect(page).toHaveTitle('Temporadas · Liga Demo')

  // A finished season of the demo league: more than ten players scored, ten are shown, the champion first.
  const card = (name: string) => page.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) })
  const season = card('Liga 2022')
  await expect(season).toContainText('Finalizada')
  const rows = season.getByRole('list', { name: 'Os dez primeiros de Liga 2022' }).getByRole('listitem')
  await expect(rows).toHaveCount(10)
  await expect(rows.first()).toContainText(/^1/)
  await expect(rows.first().getByRole('link')).toHaveAttribute('href', /\/players\/\d+$/)

  // The current season is the selected one, so it has no button.
  const current = page.locator('section').filter({ hasText: 'Atual' })
  await expect(current).toContainText('✓ Selecionada')
  await expect(current.getByRole('button')).toHaveCount(0)
  await expectAccessible(page)

  await season.getByRole('button', { name: 'Ver esta temporada: Liga 2022' }).click()
  await expect(page).toHaveURL(/\/app\/seasons\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Classificação', level: 1 })).toBeVisible()
  await expect(seasonLink(page)).toContainText('Liga 2022')
  await expect(seasonNotice(page)).toBeVisible()

  // The standings of that season start with the same player.
  const champion = await page.getByRole('table').getByRole('row').nth(1).getByRole('link').first().textContent()
  await page.goto('seasons')
  await expect(season.getByRole('listitem').first()).toContainText(champion!)
  await expect(season).toContainText('✓ Selecionada')
})

test('a link to one season shows that season and stays at its address', async ({ page }) => {
  await login(page, 'dev-player')
  await pickSeason(page, 'Liga 2022')
  const id = page.url().match(/seasons\/(\d+)$/)![1]
  await seasonNotice(page).getByRole('button', { name: 'Voltar para a atual' }).click()
  await expect(seasonNotice(page)).toHaveCount(0)

  await page.goto(`seasons/${id}/results`)
  await expect(page).toHaveURL(new RegExp(`/app/seasons/${id}/results$`))
  await expect(seasonLink(page)).toContainText('Liga 2022')
  await expect(page.getByText(/^Liga \d+ - \d\d\/\d\d\/2022$/).first()).toBeVisible()
  await expect(seasonNotice(page)).toBeVisible()
})

test('the address with no season in it is always the current season', async ({ page }) => {
  await login(page, 'dev-player')
  await pickSeason(page, 'Liga 2022')
  await expect(seasonNotice(page)).toBeVisible()

  // Typed by hand in the same tab, which showed another season last.
  await page.goto('results')
  await expect(page.getByRole('heading', { name: 'Resultados', level: 1 })).toBeVisible()
  await expect(seasonLink(page)).not.toContainText('Liga 2022')
  await expect(seasonNotice(page)).toHaveCount(0)
})

test('the current season at its own address has no notice', async ({ page }) => {
  await login(page, 'dev-player')
  const { id, name } = await page.evaluate(async () => {
    const response = await fetch('/api/v1/seasons/current', { headers: { Accept: 'application/json' } })
    return ((await response.json()) as { data: { id: number; name: string } }).data
  })

  await page.goto(`seasons/${id}/results`)
  await expect(page).toHaveURL(new RegExp(`/app/seasons/${id}/results$`))
  await expect(page.getByRole('heading', { name: 'Resultados', level: 1 })).toBeVisible()
  await expect(seasonLink(page)).toContainText(name)
  await expect(seasonNotice(page)).toHaveCount(0)
})

test('the address of a season that does not exist leads to the current one', async ({ page }) => {
  await login(page, 'dev-player')
  await page.goto('seasons/999999/results')
  await expect(page).toHaveURL(/\/app\/results$/)
  await expect(page.getByRole('heading', { name: 'Resultados', level: 1 })).toBeVisible()
  await expect(seasonLink(page)).toContainText('Liga')
  await expect(seasonNotice(page)).toHaveCount(0)
})

test('logging out goes back to the current season', async ({ page }) => {
  await login(page, 'dev-player')
  await pickSeason(page, 'Liga 2022')
  // A screen with no season of its own remembers the season the tab showed last.
  await page.goto('players')
  await expect(seasonLink(page)).toContainText('Liga 2022')
  await logout(page)
  await login(page, 'dev-player')
  await expect(page).toHaveURL(/\/app\/?$/)
  await expect(seasonLink(page)).not.toContainText('Liga 2022')
  await expect(seasonNotice(page)).toHaveCount(0)
  await page.goto('players')
  await expect(seasonLink(page)).not.toContainText('Liga 2022')
})

test('the menu lists every place of the site, and "Administração" only for admins', async ({ page }) => {
  await login(page, 'dev-player')
  await page.getByRole('button', { name: 'Menu' }).click()
  const menu = page.getByRole('dialog', { name: 'Menu' })
  for (const name of ['Classificação', 'Resultados', 'Calendário', 'Simulação', 'Jogadores', 'Temporadas']) {
    await expect(menu.getByRole('link', { name })).toBeVisible()
  }
  await expect(menu.getByRole('link', { name: 'Administração' })).toHaveCount(0)
  await expectAccessible(page)

  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)

  await page.getByRole('button', { name: 'Menu' }).click()
  await menu.getByRole('link', { name: 'Temporadas' }).click()
  await expect(page.getByRole('heading', { name: 'Temporadas', level: 1 })).toBeVisible()
  await expect(menu).toHaveCount(0)

  await logout(page)
  await login(page, 'dev-admin')
  await page.getByRole('button', { name: 'Menu' }).click()
  await menu.getByRole('link', { name: 'Administração' }).click()
  await expect(page.getByRole('heading', { name: 'Administração', level: 1 })).toBeVisible()
})
