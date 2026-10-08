import { expect, type Page, test } from '@playwright/test'
import { expectAccessible, login, pickSeason } from './helpers'

// docs/specs/main-event.md. The first test uses the E2E Main Event test season
// (backend/database/seeders/EndToEndSeeder.php); the second reads the demo league, which has a Main Event in each
// finished season.

async function pickPlayer(page: Page, position: string, nickname: string) {
  await page.getByRole('button', { name: new RegExp(`^${position} lugar`) }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill(nickname)
  await page.getByRole('dialog').getByRole('option', { name: nickname, exact: true }).click()
}

async function chooseKind(page: Page, kind: string) {
  await page.getByRole('button', { name: /Tipo/ }).click()
  await page.getByRole('option', { name: kind, exact: true }).click()
}

test('a results keeper schedules, opens and finishes the Main Event, then adds an extra night on its day', async ({ page }) => {
  test.slow()
  await login(page, 'dev-keeper')
  await page.goto('results')
  await pickSeason(page, 'E2E Main Event')
  await expect(page).toHaveURL(/\/results$/)
  const seasonResults = page.url()

  // Schedule: a night of the type Main Event
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByLabel('Data').fill('2017-12-09')
  await chooseKind(page, 'Main Event')
  await expect(page.getByText('O Main Event não tem pote nem pontos', { exact: false })).toBeVisible()
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Agendar evento' }).click()
  await expect(page).toHaveURL(/\/nights\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Main Event - 09/12/2017', level: 1 })).toBeVisible()

  // Open: it takes the answers like any night, and has no partial result
  await page.getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
  await expect(page.getByText('Aberto', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /presença/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resultado parcial' })).toHaveCount(0)

  // Finish: the players in order, with no pot. Each player chosen brings the next position.
  await page.getByRole('link', { name: /Finalizar/ }).click()
  await expect(page.getByRole('heading', { name: 'Finalizar Main Event' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Finalizar Main Event' })).toBeDisabled() // the 1st place is required
  await expect(page.getByLabel(/Pote/)).toHaveCount(0)
  await pickPlayer(page, '1º', 'Jacobson')
  await pickPlayer(page, '2º', 'Duhamel')
  await pickPlayer(page, '3º', 'Moneymaker')
  await expect(page.getByRole('button', { name: /^4º lugar/ })).toContainText('Escolher jogador')
  // Removing a player moves the ones below up.
  await page.getByRole('button', { name: 'Remover o 2º lugar' }).click()
  await expect(page.getByRole('button', { name: /^2º lugar/ })).toContainText('Moneymaker')
  await expect(page.getByRole('button', { name: /^4º lugar/ })).toHaveCount(0)
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Finalizar Main Event' }).click()

  await expect(page.getByText('Finalizado', { exact: true })).toBeVisible()
  const result = page.getByRole('list', { name: 'Classificação: Main Event - 09/12/2017' })
  await expect(result.getByRole('listitem')).toHaveText([/1º.*Jacobson/, /2º.*Moneymaker/])
  await expectAccessible(page)

  // "Main Event" shows it for the season, with the season's Main Event pot
  await page.goto('main-event')
  await expect(page.getByRole('heading', { name: 'Main Event', level: 1 })).toBeVisible()
  await expect(page.getByRole('list', { name: /^Classificação: Main Event/ }).getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('heading', { name: 'Pote ME da temporada' })).toBeVisible()
  await expectAccessible(page)

  // The season has its Main Event: the next night is a round or an extra night, here on the same day
  await page.goto(seasonResults)
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByLabel('Data').fill('2017-12-09')
  await page.getByRole('button', { name: /Tipo/ }).click()
  await expect(page.getByRole('option', { name: 'Main Event', exact: true })).toHaveCount(0)
  await page.getByRole('option', { name: 'Evento extra', exact: true }).click()
  await page.getByRole('button', { name: 'Agendar evento' }).click()
  await expect(page.getByRole('heading', { name: 'Liga - 09/12/2017', level: 1 })).toBeVisible()
  await expect(page.getByText('Extra', { exact: true })).toBeVisible()
})

test('a player sees the Main Event of a finished season and its champion in "Temporadas"', async ({ page }) => {
  await login(page, 'dev-player')

  await page.goto('seasons')
  await expect(page.getByText('Campeão do Main Event:').first()).toBeVisible()
  await expectAccessible(page)

  await page.goto('main-event')
  await pickSeason(page, 'Liga 2025')
  await expect(page).toHaveURL(/\/main-event$/)
  await expect(page.getByRole('list', { name: /^Classificação: Main Event/ }).getByRole('listitem')).toHaveCount(10)
  // A player records nothing.
  await expect(page.getByRole('button', { name: 'Registrar um Main Event já jogado' })).toHaveCount(0)
  await expectAccessible(page)
})

test('a results keeper records a Main Event that was already played', async ({ page }) => {
  await login(page, 'dev-keeper')
  await page.goto('main-event')
  await pickSeason(page, 'E2E Rodadas')
  await expect(page.getByText('O Main Event desta temporada ainda não foi marcado.')).toBeVisible()

  await page.getByRole('button', { name: 'Registrar um Main Event já jogado' }).click()
  const form = page.getByRole('form', { name: 'Registrar Main Event já jogado' })
  await form.getByLabel('Data').fill('2023-12-09')
  await pickPlayer(page, '1º', 'Duhamel')
  await expectAccessible(page)
  await form.getByRole('button', { name: 'Registrar Main Event' }).click()

  await expect(page.getByRole('list', { name: 'Classificação: Main Event - 09/12/2023' }).getByRole('listitem')).toHaveText([/1º.*Duhamel/])
  await expect(page.getByText('Finalizado', { exact: true })).toBeVisible()
})
