import { expect, test } from '@playwright/test'
import { expectAccessible, login, pickSeason, seasonLink, seasonNotice } from './helpers'

test('the site root opens the app', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/app\/login$/)
  await expect(page.getByRole('heading', { name: 'Liga Demo' })).toBeVisible()
})

test('login page is accessible', async ({ page }) => {
  await page.goto('login')
  await expect(page.getByRole('heading', { name: 'Liga Demo' })).toBeVisible()
  await expectAccessible(page)
})

test('the footer shows the site version, before and after login', async ({ page }) => {
  await page.goto('login')
  await expect(page.getByRole('contentinfo')).toHaveText(/^Liga Demo \S+$/)
  await login(page, 'dev-player')
  await expect(page.getByRole('contentinfo')).toHaveText(/^Liga Demo \S+$/)
})

test('wrong password shows a message in Portuguese', async ({ page }) => {
  await page.goto('login')
  await page.getByLabel('Usuário').fill('dev-player')
  await page.getByLabel('Senha').fill('errada')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toHaveText('Usuário ou senha incorretos.')
})

test('a player sees the current season, and the standings of a finished one', async ({ page }) => {
  await login(page, 'dev-player')
  await expect(seasonLink(page)).toContainText('Liga')
  await expect(seasonNotice(page)).toHaveCount(0)
  await expect(page.getByText(/^Liga .+ · \d+ eventos?$/)).toBeVisible()
  await pickSeason(page, 'Liga 2022')
  await expect(page.getByRole('table')).toBeVisible()
  expect(await page.getByRole('table').getByRole('row').count()).toBeGreaterThan(5)
  await expectAccessible(page)
})

test('a player can browse an earlier season and its results', async ({ page }) => {
  await login(page, 'dev-player')
  await pickSeason(page, 'Liga 2019')
  await expect(page.getByText(/Liga 2019 · \d+ eventos/)).toBeVisible()

  await page.getByRole('link', { name: 'Ver todos' }).click()
  await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible()
  // The nights are numbered in the season's order and listed newest first.
  const titles = page.getByText(/^Liga \d+ - \d\d\/\d\d\/2019$/)
  await expect(titles.first()).toBeVisible()
  await expect(titles.first()).toHaveText(new RegExp(`^Liga ${await titles.count()} - `))
  await expect(titles.last()).toHaveText(/^Liga 1 - /)
  await expect(page.getByRole('img', { name: /^Gráfico de linhas: pontos acumulados dos 8 jogadores com mais pontos, por evento/ })).toBeVisible()
  // The season's three amounts, added up, beside the chart.
  const totals = page.locator('section', { has: page.getByRole('heading', { name: 'Totais da temporada' }) })
  for (const label of ['Pote Total', 'Pote ME', 'Time chip']) await expect(totals.getByText(label)).toBeVisible()
  await expect(totals.getByText(/^R\$\s/)).toHaveCount(3)
  await expectAccessible(page)
})

test('a player cannot see admin actions', async ({ page }) => {
  await login(page, 'dev-player')
  await expect(page.getByRole('link', { name: /Admin/ })).toHaveCount(0)
  await page.goto('results')
  await expect(page.getByRole('button', { name: '+ Agendar' })).toHaveCount(0)
})

test('the simulator shows who would move up, without saving', async ({ page }) => {
  await login(page, 'dev-player')
  await page.goto('simulator')
  await page.getByLabel('Pote imaginado (R$)').fill('840')
  for (let position = 1; position <= 6; position++) {
    await page.getByRole('button', { name: new RegExp(`^${position}º lugar`) }).click()
    await page.getByRole('dialog').getByRole('option').first().click()
  }
  await page.getByRole('button', { name: 'Simular' }).click()
  await expect(page.getByRole('heading', { name: 'Classificação simulada' })).toBeVisible()
  await expect(page.getByText('+319,20')).toBeVisible()
  await expectAccessible(page)
})

test('the players list shows thumbnails, and a thumbnail opens the larger photo', async ({ page }) => {
  await login(page, 'dev-player')
  await page.goto('players')
  const quartz = page.getByRole('listitem').filter({ has: page.getByText('Quartz', { exact: true }) })
  // The images load when they come near the screen.
  await quartz.scrollIntoViewIfNeeded()
  // The sizes the server makes: thumbnails of 180 x 240 pixels, photos of 600 x 800.
  await expect(quartz.locator('img')).toHaveJSProperty('naturalWidth', 180)
  await expectAccessible(page)

  await quartz.getByRole('button', { name: 'Ver foto de Quartz' }).click()
  await expect(page.getByRole('dialog').getByRole('img', { name: 'Foto de Quartz' })).toHaveJSProperty('naturalWidth', 600)
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Fechar' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // A player with no image shows the first letter of the nickname, and nothing to open.
  const mica = page.getByRole('listitem').filter({ has: page.getByText('Mica', { exact: true }) })
  await expect(mica).toContainText(/^M/)
  await expect(mica.locator('img')).toHaveCount(0)
  await expect(mica.getByRole('button')).toHaveCount(0)
})
