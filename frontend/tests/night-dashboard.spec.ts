import { expect, type Page, test } from '@playwright/test'
import { expectAccessible, login, logout, pickSeason } from './helpers'

const totals = (page: Page) => page.getByRole('region', { name: 'Valores do evento' })
const marksOf = (page: Page, nickname: string) => page.getByRole('group', { name: `Pagamentos de ${nickname}` })

// docs/specs/night-dashboard.md. Uses the E2E Parcial test season (backend/database/seeders/EndToEndSeeder.php),
// so the night it opens does not block the other tests. That season has a buy-in of R$ 50,00, a rebuy of R$ 50,00
// that also pays the time chip of R$ 5,00, a house owner's buy-in of R$ 25,00 and 20% of the pot for the Main Event.
test('players record the payments of an open night on its dashboard, and the keeper finishes from it', async ({ page, browser }) => {
  test.slow() // several logins, and a wait for the dashboard to refresh
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
  // A scheduled night has no dashboard
  await expect(page.getByRole('heading', { name: 'Painel do evento' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
  await expect(page.getByRole('heading', { name: 'Painel do evento' })).toBeVisible()

  // A player opens the dashboard: a screen of its own, with no menu
  await logout(page)
  await login(page, 'dev-player')
  await page.goto(nightUrl)
  await page.getByRole('link', { name: 'Abrir o painel' }).click()
  await expect(page).toHaveURL(/\/nights\/\d+\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Painel do evento', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Jogadores (0)' })).toBeVisible()

  // One tap confirms a player who did not answer and marks the buy-in as paid
  await page.getByRole('button', { name: /^Não confirmados/ }).click()
  await page.getByRole('group', { name: 'Confirmar Jacobson' }).getByRole('button', { name: 'Buy-in pago' }).click()
  await expect(marksOf(page, 'Jacobson').getByRole('button', { name: 'Buy-in' })).toHaveAttribute('aria-pressed', 'true')
  await expect(totals(page)).toContainText('PoteR$ 50,00Pago R$ 50,00')

  // A rebuy is owed until it is marked as paid, and adds its time chip, which is shown apart from the pot
  await marksOf(page, 'Jacobson').getByRole('button', { name: '+ Rebuy' }).click()
  await expect(totals(page)).toContainText('PoteR$ 100,00Pago R$ 50,00Falta R$ 50,00')
  await expect(totals(page)).toContainText('Time chipR$ 5,00Pago R$ 0,00Falta R$ 5,00')
  await marksOf(page, 'Jacobson').getByRole('button', { name: 'Rebuy 1' }).click()
  await expect(totals(page)).toContainText('TotalR$ 105,00Pago R$ 105,00Falta R$ 0,00')

  // The owner of the house pays the smaller buy-in
  await page.getByRole('group', { name: 'Confirmar Duhamel' }).getByRole('button', { name: 'Confirmar', exact: true }).click()
  await page.getByRole('button', { name: 'Mais ações de Duhamel' }).click()
  await page.getByRole('menuitem', { name: 'É o dono da casa' }).click()
  await expect(page.getByText('Dono da casa: Duhamel')).toBeVisible()
  await expect(totals(page)).toContainText('PoteR$ 125,00Pago R$ 100,00Falta R$ 25,00')

  // A position is saved when its player is picked, with the points it earns from the pot so far
  await page.getByRole('button', { name: /^6º lugar/ }).click()
  await page.getByRole('dialog').getByRole('option', { name: 'Duhamel', exact: true }).click()
  await expect(page.getByRole('button', { name: /^6º lugar/ })).toContainText('Duhamel')
  await expect(page.getByLabel('Pontos do 6º lugar')).toHaveText('6,25')
  await expectAccessible(page)

  // The night's page shows the answers the dashboard gave, set by the player who tapped
  await page.getByRole('link', { name: 'Voltar ao site' }).click()
  await expect(page).toHaveURL(nightUrl)
  await expect(page.getByRole('heading', { name: 'Vão jogar (2)' })).toBeVisible()
  // The partial result's form is the dashboard now
  await page.goto(`${nightUrl}/partial-result`)
  await expect(page).toHaveURL(/\/dashboard$/)

  // The keeper, on another phone, sees the same dashboard and marks a payment
  const other = await browser.newContext()
  const keeper = await other.newPage()
  await login(keeper, 'dev-keeper')
  await keeper.goto(`${nightUrl}/dashboard`)
  await expect(marksOf(keeper, 'Jacobson').getByRole('button', { name: 'Rebuy 1' })).toHaveAttribute('aria-pressed', 'true')
  await marksOf(keeper, 'Duhamel').getByRole('button', { name: 'Buy-in' }).click()
  await expect(totals(keeper)).toContainText('PoteR$ 125,00Pago R$ 125,00')
  // …which the player's dashboard shows by itself a few seconds later
  await expect(marksOf(page, 'Duhamel').getByRole('button', { name: 'Buy-in' })).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })

  // "Finalizar" starts from the dashboard: the pot, the season's share of it for the Main Event, the time chip
  await keeper.getByRole('link', { name: 'Finalizar evento' }).click()
  await expect(keeper.getByText('Preenchido com os valores e as posições do painel do evento.')).toBeVisible()
  await expect(keeper.getByLabel('Pote (R$)')).toHaveValue('125,00')
  await expect(keeper.getByLabel('Pote ME (R$)')).toHaveValue('25,00')
  await expect(keeper.getByLabel('Time chip (R$)')).toHaveValue('5,00')
  await expect(keeper.getByRole('button', { name: /^6º lugar/ })).toContainText('Duhamel')
  for (let position = 1; position <= 5; position++) {
    await keeper.getByRole('button', { name: new RegExp(`^${position}º lugar`) }).click()
    await keeper.getByRole('dialog').getByRole('option').first().click()
  }
  await keeper.getByRole('button', { name: 'Finalizar evento' }).click()
  await expect(keeper.getByText('Finalizado', { exact: true })).toBeVisible()
  await expect(keeper.getByRole('article').getByRole('listitem').nth(5)).toContainText('Duhamel')
  // The finished night keeps its dashboard
  await expect(keeper.getByRole('link', { name: 'Abrir o painel' })).toBeVisible()
  await other.close()

  // A player sees a finished night's dashboard, and no longer changes it
  await page.reload()
  await expect(page.getByText('O evento foi finalizado. Só um administrador altera o painel.')).toBeVisible()
  await expect(marksOf(page, 'Jacobson').getByRole('button', { name: 'Buy-in' })).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Resultado registrado' })).toBeVisible()
  await expectAccessible(page)
})
