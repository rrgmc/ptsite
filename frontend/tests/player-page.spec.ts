import { expect, test } from '@playwright/test'
import { expectAccessible, login, logout, pickSeason, seasonNotice } from './helpers'

// A player's page and the detailed players list (docs/specs/players.md, rules 11 to 13; docs/specs/statistics.md, rules 8 to 12), on the demo
// imported data.

test('a nickname in the standings opens the player\'s page, with the statistics of a season and of every season', async ({ page }) => {
  await login(page, 'dev-player')
  await pickSeason(page, 'Liga 2022')
  const leader = page.getByRole('table').first().getByRole('row').nth(1).getByRole('link')
  const nickname = (await leader.textContent())!
  await leader.click()

  await expect(page).toHaveURL(/\/players\/\d+$/)
  await expect(page.getByRole('heading', { name: nickname, level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Estatísticas', level: 2 })).toBeVisible()
  // The leader of the season is first, and the page says which season it shows.
  await expect(page.getByRole('term').filter({ hasText: 'Posição' }).locator('xpath=following-sibling::dd')).toHaveText('1º')
  await expect(seasonNotice(page)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Por temporada' })).toHaveCount(0)
  await expect(page.getByRole('img', { name: new RegExp(`^Gráfico de linha: pontos acumulados de ${nickname}, por evento`) })).toBeVisible()
  await expect(page.getByRole('img', { name: /^Gráfico de barras: vezes em que/ })).toBeVisible()
  // A night in "Resultados" opens the night.
  const results = page.getByRole('table', { name: /^Eventos em que/ })
  await expect(results.getByRole('link').first()).toHaveAttribute('href', /nights\/\d+$/)
  await expectAccessible(page)

  await page.getByRole('navigation', { name: 'Período' }).getByRole('link', { name: 'Geral' }).click()
  await expect(page).toHaveURL(/\/players\/\d+\/all$/)
  await expect(page.getByText('Todas as temporadas')).toBeVisible()
  await expect(seasonNotice(page)).toHaveCount(0)
  const seasons = page.getByRole('table', { name: /^Classificação de/ })
  await expect(seasons.getByRole('link', { name: 'Liga 2022' })).toBeVisible()
  await expect(page.getByRole('img', { name: /por temporada/ })).toBeVisible()
  // Over every season, each night names its season.
  await expect(page.getByRole('table', { name: /^Eventos em que/ }).getByRole('row').nth(1)).toContainText('Liga')
  await expectAccessible(page)
})

test('an admin writes a player\'s memo, and a player reads it but cannot write their own', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin/players')
  const first = page.getByRole('listitem').filter({ hasNot: page.getByText(/^(inativo|arquivado)$/) }).first()
  const nickname = (await first.locator('span.font-semibold').first().textContent())!
  await first.getByRole('button', { name: `Editar ${nickname}` }).click()
  await expect(page).toHaveURL(/admin\/players\/\d+$/)
  const id = page.url().match(/(\d+)$/)![1]
  await page.getByLabel('Memo').fill('Fundador da mesa.\nJoga desde 2009.')
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page).toHaveURL(/admin\/players$/)

  // The admin's view of the page leads back to the form.
  await page.goto(`players/${id}`)
  await expect(page.getByText('Fundador da mesa.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar' })).toBeVisible()

  await logout(page)
  await login(page, 'dev-player')
  await page.goto(`players/${id}`)
  await expect(page.getByRole('heading', { name: nickname, level: 1 })).toBeVisible()
  await expect(page.getByText('Fundador da mesa.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar' })).toHaveCount(0)

  // The players list shows the memo in its detailed view, and only the players who have one.
  await page.goto('players')
  const rows = page.getByRole('main').getByRole('listitem')
  await expect(rows.first()).toBeVisible()
  const total = await rows.count()
  const views = page.getByRole('navigation', { name: 'Modo de exibição' })
  await views.getByRole('link', { name: 'Detalhado' }).click()
  await expect(page).toHaveURL(/\/players\?view=detailed$/)
  const card = rows.filter({ has: page.getByRole('heading', { name: nickname, level: 2 }) })
  await expect(card.getByText('Fundador da mesa.')).toBeVisible()
  // The imported players have no memo.
  expect(await rows.count()).toBeLessThan(total)
  await expectAccessible(page)
  await views.getByRole('link', { name: 'Lista' }).click()
  await expect(page).toHaveURL(/\/players$/)
  await expect(rows).toHaveCount(total)

  await page.goto('profile')
  await expect(page.getByLabel('Apelido')).toBeVisible()
  await expect(page.getByLabel('Memo')).toHaveCount(0)
})
