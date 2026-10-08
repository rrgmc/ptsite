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
  // The totals: the nights counted and their pot.
  const nights = page.getByRole('term').filter({ hasText: 'Eventos' }).locator('xpath=..')
  await expect(nights.getByRole('definition')).toHaveText('24')
  await expect(page.getByRole('term').filter({ hasText: 'Pote Total' }).locator('xpath=..').getByRole('definition')).toHaveText(/^R\$/)
  await expect(page.getByRole('img', { name: /^Gráfico de linhas: pontos acumulados dos 8 jogadores com mais pontos, por evento/ })).toBeVisible()

  // The tabs. One season has one Main Event, which makes no list, so it has no tab.
  const tabs = page.getByRole('tablist', { name: 'Listas e gráficos' }).getByRole('tab')
  await expect(tabs).toHaveText(['Posições', 'Jogadores', 'Eventos'])

  // "Posições" shows first: a line per player and a column per scoring position, the first ten, then everyone.
  const positions = page.getByRole('table', { name: 'Jogadores por vezes em cada posição' })
  await expect(positions.getByRole('columnheader', { name: '1º' })).toBeVisible()
  await expect(positions.getByRole('columnheader', { name: '6º' })).toBeVisible()
  await expect(positions.getByRole('row')).toHaveCount(11)
  // The leader of the table has the most 1st places, which is marked.
  await expect(positions.getByRole('row').nth(1).getByRole('cell').nth(2)).toContainText('(o maior da posição)')
  await page.getByRole('button', { name: /^Ver os 1[1-9] primeiros$/ }).click()
  await expect(positions.getByRole('row')).not.toHaveCount(11)
  await page.getByRole('button', { name: 'Ver os 10 primeiros' }).click()
  await expect(positions.getByRole('row')).toHaveCount(11)
  await expect(page.getByRole('img', { name: /^Gráfico de barras: vitórias por jogador/ })).toBeVisible()
  await expectAccessible(page)

  await tabs.filter({ hasText: 'Jogadores' }).click()
  await expect(positions).toBeHidden()
  const totals = page.getByRole('table', { name: 'Jogadores por pontuação total' })
  await expect(totals.getByRole('row')).toHaveCount(11) // the header and the first ten
  await expect(page.getByRole('table', { name: 'Jogadores por eventos em que pontuaram' })).toBeVisible()
  await expectAccessible(page)

  await tabs.filter({ hasText: 'Eventos' }).click()
  await expect(page.getByRole('img', { name: /^Gráfico de linha: pote por evento/ })).toBeVisible()
  await expect(page.getByRole('img', { name: /^Gráfico de pizza: eventos por local/ })).toBeVisible()
  // A night in "Maiores Potes" opens the night.
  const pots = page.getByRole('table', { name: 'Eventos por pote' })
  await expect(pots.getByRole('link').first()).toHaveAttribute('href', /nights\/\d+$/)
  await expectAccessible(page)

  await page.getByRole('navigation', { name: 'Período' }).getByRole('link', { name: 'Geral' }).click()
  await expect(page).toHaveURL(/\/statistics\/all$/)
  await expect(page.getByText('Todas as temporadas')).toBeVisible()
  await expect(seasonNotice(page)).toHaveCount(0)
  await expect(page.getByRole('img', { name: /pontos acumulados.*por temporada/ })).toBeVisible()
  await expect(tabs).toHaveText(['Posições', 'Jogadores', 'Eventos', 'Main Event'])

  // Over every season, the pots are added up by season and each of the biggest names its season.
  await tabs.filter({ hasText: 'Eventos' }).click()
  await expect(page.getByRole('img', { name: /^Gráfico de linha: pote por temporada/ })).toBeVisible()
  await expect(page.getByRole('table', { name: 'Eventos por pote' }).getByRole('row').nth(1)).toContainText('Liga')

  // The Main Events of every season: who won, who was in the first three and who played.
  await tabs.filter({ hasText: 'Main Event' }).click()
  for (const title of ['Títulos', 'Pódios', 'Participações']) {
    await expect(page.getByRole('heading', { name: title, level: 2 })).toBeVisible()
  }
  await expect(page.getByRole('table', { name: 'Jogadores por títulos do Main Event' }).getByRole('row').nth(1)).toContainText('1')
  await expectAccessible(page)
})
