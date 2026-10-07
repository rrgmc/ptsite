import { expect, test } from '@playwright/test'
import { expectAccessible, login, logout, pickSeason } from './helpers'

// docs/specs/seasons-and-nights.md, "Partial result". Uses the E2E Parcial test season
// (backend/database/seeders/EndToEndSeeder.php), so the night it opens does not block the other tests.
test('a player fills the partial result of an open night, and the keeper finishes from it', async ({ page }) => {
  test.slow() // three logins
  // A results keeper schedules and opens a night
  await login(page, 'dev-keeper')
  await page.goto('results')
  await pickSeason(page, 'E2E Parcial')
  await expect(page).toHaveURL(/\/results$/)
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByLabel('Data').fill('2021-03-12')
  await page.getByRole('button', { name: 'Agendar evento' }).click()
  await expect(page).toHaveURL(/\/nights\/\d+$/)
  const nightUrl = page.url()
  // A scheduled night has no partial result
  await expect(page.getByRole('heading', { name: 'Resultado parcial' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
  await expect(page.getByText('Ninguém preencheu o resultado parcial ainda.')).toBeVisible()

  // A player records the pot and who is out, leaving the rest empty
  await logout(page)
  await login(page, 'dev-player')
  await page.goto(nightUrl)
  await page.getByRole('link', { name: 'Preencher resultado parcial' }).click()
  await expect(page.getByRole('heading', { name: 'Resultado parcial', level: 1 })).toBeVisible()
  await page.getByLabel('Pote (R$)').fill('500')
  await page.getByRole('button', { name: /^5º lugar/ }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill('Onyx')
  await page.getByRole('dialog').getByRole('option', { name: 'Onyx', exact: true }).click()
  await page.getByRole('button', { name: /^6º lugar/ }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill('Flint')
  await page.getByRole('dialog').getByRole('option', { name: 'Flint', exact: true }).click()
  await expect(page.getByLabel('Pontos do 6º lugar')).toHaveText('25,00')
  await page.getByRole('button', { name: 'Salvar resultado parcial' }).click()
  await expect(page.getByText(/^Salvo às \d\d:\d\d\.$/)).toBeVisible()

  // A position can be emptied again, and the form stays open for the next save
  await page.getByRole('button', { name: /^5º lugar/ }).click()
  await page.getByRole('dialog').getByRole('option', { name: 'Deixar em branco' }).click()
  await expect(page.getByRole('button', { name: /^5º lugar/ })).toContainText('Escolher jogador')
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Salvar resultado parcial' }).click()
  await expect(page.getByText(/^Salvo às \d\d:\d\d\.$/)).toBeVisible()

  // The night's page shows it to everyone
  await page.getByRole('link', { name: 'Voltar ao evento' }).click()
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Resultado parcial' }) })
  // …with the points each position would earn from the pot
  await expect(card.getByRole('listitem').nth(4)).toHaveText('5º—40,00')
  await expect(card.getByRole('listitem').nth(5)).toContainText('Flint')
  await expect(card.getByRole('listitem').nth(5)).toContainText('25,00')
  await expect(card.getByRole('definition').first()).toHaveText('R$ 500,00')
  await expect(card.getByText(/Salvo por .+ às \d\d:\d\d/)).toBeVisible()
  await expectAccessible(page)

  // The keeper's results form starts from it
  await logout(page)
  await login(page, 'dev-keeper')
  await page.goto(nightUrl)
  await page.getByRole('link', { name: /Finalizar/ }).click()
  await expect(page.getByText(/Preenchido com o resultado parcial salvo por .+ às \d\d:\d\d/)).toBeVisible()
  await expect(page.getByLabel('Pote (R$)')).toHaveValue('500,00')
  await expect(page.getByRole('button', { name: /^6º lugar/ })).toContainText('Flint')
  await expect(page.getByRole('button', { name: 'Finalizar evento' })).toBeDisabled()
  await expectAccessible(page)

  // …and is finished as usual
  await page.getByLabel('Pote ME (R$)').fill('0')
  await page.getByLabel('Time chip (R$)').fill('0')
  for (let position = 1; position <= 5; position++) {
    await page.getByRole('button', { name: new RegExp(`^${position}º lugar`) }).click()
    await page.getByRole('dialog').getByRole('option').first().click()
  }
  await page.getByRole('button', { name: 'Finalizar evento' }).click()
  await expect(page.getByText('Finalizado', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resultado parcial' })).toHaveCount(0)
  await expect(page.getByRole('article').getByRole('listitem').nth(5)).toContainText('Flint')
})
