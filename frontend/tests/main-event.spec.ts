import { expect, type Page, test } from '@playwright/test'
import { expectAccessible, login, logout, pickSeason } from './helpers'

// docs/specs/main-event.md. The first test uses the E2E Main Event test season
// (backend/database/seeders/EndToEndSeeder.php); the second reads the demo league, which has a Main Event in each
// finished season.

async function pickPlayer(page: Page, position: string, nickname: string) {
  await page.getByRole('button', { name: new RegExp(`^${position} lugar`) }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill(nickname)
  await page.getByRole('dialog').getByRole('option', { name: nickname, exact: true }).click()
}

test('an admin adds the Main Event of a season in "Administração", and its night is run like any other', async ({ page }) => {
  test.slow()
  await login(page, 'dev-admin')
  await page.goto('results')
  await pickSeason(page, 'E2E Main Event')
  await expect(page).toHaveURL(/\/results$/)
  const seasonResults = page.url()

  // "Resultados" schedules a round or an extra night, never the Main Event
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByRole('button', { name: /Tipo/ }).click()
  await expect(page.getByRole('option')).toHaveText(['Rodada da temporada', 'Evento extra'])
  await page.keyboard.press('Escape')

  // "Administração": the season's Main Event. Its date and time start empty.
  await page.goto('admin')
  await page.getByRole('link', { name: 'Main Event: E2E Main Event' }).click()
  const form = page.getByRole('form', { name: 'Adicionar Main Event' })
  await expect(form.getByLabel('Hora')).toHaveValue('')
  await expect(form.getByRole('button', { name: 'Agendar Main Event' })).toBeDisabled()
  await form.getByLabel('Data').fill('2017-12-09')
  await form.getByLabel('Hora').fill('13:00')
  await expectAccessible(page)
  await form.getByRole('button', { name: 'Agendar Main Event' }).click()
  await expect(page.getByText('Abra o evento para lançar a classificação.')).toBeVisible()
  await expectAccessible(page)
  await page.getByRole('link', { name: 'Ver o evento' }).click()
  await expect(page.getByRole('heading', { name: 'Main Event - 09/12/2017', level: 1 })).toBeVisible()
  await expect(page.getByText(/Sábado, 09\/12 · 13:00/)).toBeVisible()

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
  // The season's own address: "main-event" alone is the current season's.
  await page.goto(seasonResults.replace(/results$/, 'main-event'))
  await expect(page.getByRole('heading', { name: 'Main Event', level: 1 })).toBeVisible()
  await expect(page.getByRole('list', { name: /^Classificação: Main Event/ }).getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('heading', { name: 'Pote ME da temporada' })).toBeVisible()
  await expectAccessible(page)

  // An extra night on the same day, scheduled in "Resultados"
  await page.goto(seasonResults)
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByLabel('Data').fill('2017-12-09')
  await page.getByRole('button', { name: /Tipo/ }).click()
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

  // "Classificação" of a season with a finished Main Event: its first three, above the table
  await page.goto('')
  await pickSeason(page, 'Liga 2025')
  // The season's own address: the addresses with no season in them are the current season's.
  await expect(page).toHaveURL(/\/seasons\/\d+$/)
  const seasonStandings = page.url()
  const podium = page.getByRole('list', { name: /^Classificação: Main Event/ })
  await expect(podium.getByRole('listitem')).toHaveText([/1º/, /2º/, /3º/])
  await expectAccessible(page)

  // "Resultados" of a finished season has no "Próximos eventos"
  await page.goto(`${seasonStandings}/results`)
  await expect(page.getByRole('heading', { name: 'Resultados', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Próximos eventos' })).toHaveCount(0)

  await page.goto(seasonStandings)
  await page.getByRole('link', { name: 'Ver Main Event' }).click()
  await expect(page).toHaveURL(/\/main-event$/)
  await expect(page.getByRole('list', { name: /^Classificação: Main Event/ }).getByRole('listitem')).toHaveCount(10)
  // Only an admin has the way to edit it.
  await expect(page.getByRole('link', { name: 'Editar Main Event' })).toHaveCount(0)
  await expectAccessible(page)
})

test('an admin records a Main Event that was already played, and a results keeper cannot add one', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin')
  await page.getByRole('link', { name: 'Main Event: E2E Rodadas' }).click()

  const form = page.getByRole('form', { name: 'Adicionar Main Event' })
  await form.getByLabel('Data').fill('2023-12-09')
  await form.getByLabel('Hora').fill('13:00')
  // With a player, the Main Event is recorded as finished.
  await pickPlayer(page, '1º', 'Duhamel')
  await expectAccessible(page)
  await form.getByRole('button', { name: 'Registrar Main Event' }).click()

  await expect(page.getByRole('list', { name: 'Classificação: Main Event - 09/12/2023' }).getByRole('listitem')).toHaveText([/1º.*Duhamel/])
  await expect(page.getByText('Finalizado', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar classificação' })).toBeVisible()

  // "Main Event" shows it, with the way back here for an admin only
  await page.goto('main-event')
  await pickSeason(page, 'E2E Rodadas')
  await expect(page.getByRole('link', { name: 'Editar Main Event' })).toBeVisible()
  await logout(page)
  await login(page, 'dev-keeper')
  await page.goto('main-event')
  await pickSeason(page, 'E2E Rodadas')
  await expect(page.getByRole('list', { name: /^Classificação: Main Event/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar Main Event' })).toHaveCount(0)
})
