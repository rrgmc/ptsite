import { expect, test } from '@playwright/test'
import { expectAccessible, login, pickSeason } from './helpers'

// The first two tests use the E2E Resultados test season (backend/database/seeders/EndToEndSeeder.php): the demo
// current season may already have an open night.

test('a results keeper schedules, opens and finishes a night on a phone, with a quick-added player', async ({ page }) => {
  await login(page, 'dev-keeper')
  await page.goto('results')
  await pickSeason(page, 'E2E Resultados')
  await expect(page).toHaveURL(/\/results$/)

  // Schedule
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByLabel('Data').fill('2023-03-10')
  await page.getByRole('button', { name: 'Agendar evento' }).click()
  await expect(page).toHaveURL(/\/nights\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Liga - 10/03/2023', level: 1 })).toBeVisible()

  // Open
  await page.getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
  await expect(page.getByText('Aberto', { exact: true })).toBeVisible()

  // Finish
  await page.getByRole('link', { name: /Finalizar/ }).click()
  await expect(page.getByRole('heading', { name: 'Finalizar evento' })).toBeVisible()
  await page.getByLabel('Pote (R$)').fill('845')
  await page.getByLabel('Pote ME (R$)').fill('170')
  await expect(page.getByRole('button', { name: 'Finalizar evento' })).toBeDisabled() // the time chip is required too
  await page.getByLabel('Time chip (R$)').fill('25,50')
  for (let position = 1; position <= 5; position++) {
    await page.getByRole('button', { name: new RegExp(`^${position}º lugar`) }).click()
    await page.getByRole('dialog').getByRole('option').first().click()
  }
  // 6th place: a first-timer, added by nickname
  await page.getByRole('button', { name: /^6º lugar/ }).click()
  // A partial search lists matching players first; "add a new player" comes last, so tapping the first row
  // never creates a player by accident.
  await page.getByRole('dialog').getByRole('searchbox').fill('a')
  await expect(page.getByRole('dialog').getByRole('option').first()).not.toContainText('Adicionar')
  await expect(page.getByRole('dialog').getByRole('option').last()).toContainText('Adicionar “a”')
  await page.getByRole('dialog').getByRole('searchbox').fill('Estreante E2E')
  await page.getByRole('option', { name: /Adicionar “Estreante E2E”/ }).click()
  await expect(page.getByRole('button', { name: /^6º lugar/ })).toContainText('Estreante E2E')


  await expect(page.getByLabel('Pontos do 1º lugar')).toHaveText('321,10')
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Finalizar evento' }).click()

  await expect(page.getByText('Finalizado', { exact: true })).toBeVisible()
  await expect(page.getByText('Estreante E2E')).toBeVisible()
  await expect(page.getByText('321,10')).toBeVisible()
  // The three amounts are listed below the positions
  const amounts = page.getByRole('article').getByRole('definition')
  await expect(amounts).toHaveText(['R$ 845,00', 'R$ 170,00', 'R$ 25,50'])
})

test('opening a second night is refused with the rule message', async ({ page }) => {
  await login(page, 'dev-keeper')
  await page.goto('results')
  await pickSeason(page, 'E2E Resultados')
  await expect(page).toHaveURL(/\/results$/)
  const seasonResults = page.url()
  for (const day of ['2023-03-17', '2023-03-24']) {
    await page.getByRole('button', { name: '+ Agendar' }).click()
    await page.getByLabel('Data').fill(day)
    await page.getByRole('button', { name: 'Agendar evento' }).click()
    await page.getByRole('button', { name: 'Abrir evento' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
    await page.goto(seasonResults)
  }
  // The first opening succeeded; the second shows the rule.
  await page.getByRole('link', { name: /24\/03/ }).click()
  await page.getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
  await expect(page.getByText('Já existe um evento aberto nesta temporada', { exact: false }).first()).toBeVisible()
})

test('scheduling suggests the next three regular Fridays, and any of them can be picked', async ({ page }) => {
  await login(page, 'dev-keeper')
  await page.goto('results')
  await page.getByRole('button', { name: '+ Agendar' }).click()

  const suggestions = page.getByRole('radiogroup', { name: 'Sugestões' })
  await expect(suggestions.getByRole('radio')).toHaveCount(3)
  // The first one is chosen at first and fills the fields: the current season plays on Fridays at 21:30
  await expect(suggestions.getByRole('radio', { checked: true })).toHaveCount(1)
  await expect(page.getByLabel('Hora')).toHaveValue('21:30')

  await suggestions.locator('label').nth(2).click()
  const date = await page.getByLabel('Data').inputValue()
  expect(new Date(`${date}T12:00:00`).getDay()).toBe(5) // Friday
  await expectAccessible(page)

  await page.getByRole('button', { name: 'Agendar evento' }).click()
  const [y, m, d] = date.split('-')
  await expect(page).toHaveURL(/\/nights\/\d+$/)
  await expect(page.getByRole('heading', { name: `Liga - ${d}/${m}/${y}`, level: 1 })).toBeVisible()
  await expect(page.getByText(/Sexta-feira, .* · 21:30/)).toBeVisible()
})

test('a picked player can be changed', async ({ page }) => {
  await login(page, 'dev-keeper')
  await page.goto('simulator')
  const first = page.getByRole('button', { name: /^1º lugar/ })
  await first.click()
  await page.getByRole('dialog').getByRole('searchbox').fill('Jacobson')
  await page.getByRole('dialog').getByRole('option', { name: 'Jacobson', exact: true }).click()
  await expect(first).toContainText('Jacobson')

  await first.click()
  await expect(page.getByRole('dialog').getByRole('option', { name: /Jacobson.*escolhido/ })).toBeVisible()
  await page.getByRole('dialog').getByRole('searchbox').fill('Duhamel')
  await page.getByRole('dialog').getByRole('option', { name: 'Duhamel', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(first).toContainText('Duhamel')
})
