import { expect, test } from '@playwright/test'
import { expectAccessible, login, pickSeason, seasonNotice } from './helpers'

// The statistics (docs/specs/statistics.md), seen by a player, on the demo league.

test('a player sees the statistics of a season and of every season', async ({ page }) => {
  await login(page, 'dev-player')
  // On a phone "Estatísticas" is in the menu, not on the bottom bar.
  const link = page.getByRole('link', { name: /Estatísticas/ }).filter({ visible: true })
  if ((await link.count()) === 0) await page.getByRole('button', { name: 'Menu' }).click()
  await link.first().click()
  await expect(page.getByRole('heading', { name: 'Estatísticas', level: 1 })).toBeVisible()

  await pickSeason(page, 'Liga 2022')
  await expect(page).toHaveURL(/\/statistics$/)
  await expect(page.getByText(/^24 eventos · Pote total R\$/)).toBeVisible()
  const totals = page.getByRole('table', { name: 'Jogadores por pontuação total' })
  await expect(totals.getByRole('row')).toHaveCount(11) // the header and the first ten
  await expect(page.getByRole('heading', { name: 'Posição: 1º' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Posição: 6º' })).toBeVisible()
  await expect(page.getByRole('img', { name: /^Gráfico de linhas: pontos acumulados dos 8 jogadores com mais pontos, por evento/ })).toBeVisible()
  await expect(page.getByRole('img', { name: /^Gráfico de barras: vitórias por jogador/ })).toBeVisible()
  await expectAccessible(page)

  // A night in "Maiores Potes" opens the night.
  const pots = page.getByRole('table', { name: 'Eventos por pote' })
  await expect(pots.getByRole('link').first()).toHaveAttribute('href', /nights\/\d+$/)

  await page.getByRole('navigation', { name: 'Período' }).getByRole('link', { name: 'Geral' }).click()
  await expect(page).toHaveURL(/\/statistics\/all$/)
  await expect(page.getByText('Todas as temporadas')).toBeVisible()
  await expect(seasonNotice(page)).toHaveCount(0)
  await expect(page.getByRole('img', { name: /por temporada/ })).toBeVisible()
  // Over every season, each pot names its season.
  await expect(page.getByRole('table', { name: 'Eventos por pote' }).getByRole('row').nth(1)).toContainText('Liga')
  await expectAccessible(page)
})
