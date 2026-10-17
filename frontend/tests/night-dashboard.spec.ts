import { expect, type Page, test } from '@playwright/test'
import { expectAccessible, login, logout, pickSeason } from './helpers'

// On the summary tab, which is read here also while another tab is on show.
const totals = (page: Page) => page.getByRole('region', { name: 'Valores do evento', includeHidden: true })
const money = (page: Page) => page.getByRole('region', { name: 'Dinheiro', includeHidden: true })
const payout = (page: Page) => page.getByRole('region', { name: 'Premiação', includeHidden: true })
const marksOf = (page: Page, nickname: string) => page.getByRole('group', { name: `Pagamentos de ${nickname}` })
// The dashboard's tabs: "Resumo", "Jogadores (n)" and "Valores". Only the one on show can be tapped.
const openTab = (page: Page, name: string | RegExp) => page.getByRole('tab', { name }).click()

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
  // It opens on the summary; the players are in a tab of their own
  await expect(page.getByRole('tab', { name: 'Resumo' })).toHaveAttribute('aria-selected', 'true')
  await openTab(page, 'Jogadores (0)')

  // One tap confirms a player who did not answer and marks the buy-in as paid
  // …found by a search: the dashboard lists nobody until someone searches, and creates no player
  await expect(page.getByRole('group', { name: /^Adicionar / })).toHaveCount(0)
  await page.getByRole('searchbox', { name: 'Adicionar jogador' }).fill('jacob')
  await page.getByRole('group', { name: 'Adicionar Jacobson' }).getByRole('button', { name: 'Buy-in pago' }).click()
  await expect(marksOf(page, 'Jacobson').getByRole('button', { name: 'Buy-in' })).toHaveAttribute('aria-pressed', 'true')
  // The tap confirmed him: his row says when
  await expect(page.getByRole('listitem').filter({ hasText: 'Jacobson' })).toContainText(/Confirmou \d{2}\/\d{2} às \d{2}:\d{2}/)
  await expect(money(page)).toContainText('PoteR$ 50,00R$ 0,00')

  // A rebuy is owed until it is marked as paid, and adds its time chip, which is shown apart from the pot
  await marksOf(page, 'Jacobson').getByRole('button', { name: '+ Rebuy' }).click()
  await expect(totals(page)).toContainText('PoteR$ 100,00')
  await expect(totals(page)).toContainText('Time chipR$ 5,00')
  await expect(money(page)).toContainText('PoteR$ 50,00R$ 50,00')
  await expect(money(page)).toContainText('Time chipR$ 0,00R$ 5,00')
  await marksOf(page, 'Jacobson').getByRole('button', { name: 'Rebuy 1' }).click()
  await expect(money(page)).toContainText('Total com time chipR$ 105,00')
  await expect(money(page)).toContainText('Total que faltaR$ 0,00')
  await expect(page.getByRole('region', { name: 'Pagamentos', includeHidden: true })).toContainText('Rebuys pagos1 de 1')
  await expect(payout(page)).not.toContainText('Em dinheiro')
  // One tap more says the rebuy was paid, but not in cash, with the time chip it pays: the summary then says how
  // much of what was paid is in hand
  await marksOf(page, 'Jacobson').getByRole('button', { name: 'Rebuy 1' }).click()
  await expect(marksOf(page, 'Jacobson').getByRole('button', { name: 'Rebuy 1 (fora do dinheiro)' })).toHaveAttribute('aria-pressed', 'true')
  await expect(payout(page)).toContainText('Em dinheiroR$ 50,00')
  await expect(payout(page)).toContainText('Fora do dinheiroR$ 55,00')
  await expect(page.getByRole('listitem').filter({ hasText: 'Jacobson' })).toContainText('Tudo pago (⇄ R$ 55,00)')
  await expect(page.getByText('Pago fora do dinheiro (transferência, Pix)')).toBeVisible()
  await expect(money(page)).toContainText('Total com time chipR$ 105,00')
  await expect(money(page)).toContainText('Total que faltaR$ 0,00')

  // The owner of the house pays the smaller buy-in, and the pot for points counts the buy-in in full
  await page.getByRole('searchbox', { name: 'Adicionar jogador' }).fill('duha')
  await page.getByRole('group', { name: 'Adicionar Duhamel' }).getByRole('button', { name: 'ALL IN', exact: true }).click()
  await page.getByRole('button', { name: 'Mais ações de Duhamel' }).click()
  await page.getByRole('menuitem', { name: 'É o dono da casa' }).click()
  await expect(page.getByText('Dono da casa: Duhamel')).toBeVisible()
  await expect(totals(page)).toContainText('PoteR$ 150,00')
  await expect(money(page)).toContainText('Desconto do dono da casa-R$ 25,00Pote com descontoR$ 125,00')
  await expect(money(page)).toContainText('PoteR$ 100,00R$ 25,00')

  // Each amount is in a closed field until it is marked "Manual". The Main Event pot is the season's share of the money
  await openTab(page, 'Valores')
  await expect(page.getByLabel('Pote (R$)')).toBeDisabled()
  await expect(page.getByLabel('Pote (R$)')).toHaveValue('150,00')
  await expect(page.getByLabel('Pote ME (R$)')).toHaveValue('25,00')
  // The pot is set by hand, for a night that does not record every payment; the one worked out stays in sight
  // React Aria hides the checkbox itself: the mark's text is what a finger taps. The first "Manual" is the pot's.
  await page.getByText('Manual', { exact: true }).first().click()
  await expect(page.getByRole('checkbox', { name: 'Definir o pote manualmente' })).toBeChecked()
  await page.getByLabel('Pote (R$)').fill('300')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(totals(page)).toContainText('Pote(Manual)R$ 300,00')
  await expect(money(page)).toContainText('Pote totalCalculado R$ 150,00R$ 300,00')
  await expect(page.getByLabel('Pote ME (R$)')).toHaveValue('55,00')
  await expectAccessible(page)
  // Unmarking it changes nothing until it is saved: a tap by mistake costs nothing
  await page.getByText('Manual', { exact: true }).first().click()
  await expect(page.getByLabel('Pote (R$)')).toBeDisabled()
  await expect(page.getByLabel('Pote (R$)')).toHaveValue('300,00')
  await expect(totals(page)).toContainText('Pote(Manual)R$ 300,00')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(totals(page)).toContainText('PoteR$ 150,00')
  await expect(money(page)).toContainText('Desconto do dono da casa-R$ 25,00')
  await expect(money(page)).toContainText('PoteR$ 100,00R$ 25,00')
  await expect(page.getByLabel('Pote ME (R$)')).toHaveValue('25,00')
  // An adjustment of what was not in cash, for anything out of the ordinary, takes a negative amount
  // …in a field that shows only once its mark is ticked
  await expect(page.getByLabel('Ajuste fora do dinheiro (R$)')).toHaveCount(0)
  await page.getByText('Ajustar o valor fora do dinheiro', { exact: true }).click()
  await page.getByLabel('Ajuste fora do dinheiro (R$)').fill('-5')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(payout(page)).toContainText('Em dinheiroR$ 55,00')
  await expect(payout(page)).toContainText('Fora do dinheiroR$ 50,00')

  // A position is saved when its player is picked, with the points it earns from the pot so far
  await page.getByRole('button', { name: /^6º lugar/ }).click()
  await page.getByRole('dialog').getByRole('option', { name: 'Duhamel', exact: true }).click()
  await expect(page.getByRole('button', { name: /^6º lugar/ })).toContainText('Duhamel')
  // The points are a share of the pot for points, R$ 150,00
  await expect(page.getByLabel('Pontos do 6º lugar')).toHaveText('7,50')
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
  await openTab(keeper, /^Jogadores/)
  await expect(marksOf(keeper, 'Jacobson').getByRole('button', { name: 'Rebuy 1' })).toHaveAttribute('aria-pressed', 'true')
  await marksOf(keeper, 'Duhamel').getByRole('button', { name: 'Buy-in' }).click()
  await expect(money(keeper)).toContainText('PoteR$ 125,00')
  // …which the player's dashboard shows by itself a few seconds later
  await openTab(page, /^Jogadores/)
  await expect(marksOf(page, 'Duhamel').getByRole('button', { name: 'Buy-in' })).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })

  // The dashboard does not finish a night. On the night's page, "Finalizar" starts from the dashboard: the pot, the
  // season's share of it for the Main Event, the time chip
  await expect(keeper.getByRole('link', { name: /Finalizar/ })).toHaveCount(0)
  await keeper.getByRole('link', { name: 'Voltar ao site' }).click()
  await keeper.getByRole('link', { name: /Finalizar/ }).click()
  await expect(keeper.getByText('Preenchido com os valores e as posições do painel do evento.')).toBeVisible()
  await expect(keeper.getByLabel('Pote (R$)')).toHaveValue('150,00')
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
  // The finished night's page shows the result with its rebuys and late arrivals, and beside it what each player paid
  await expect(keeper.getByRole('article')).toContainText('Rebuys1')
  await expect(keeper.getByRole('article')).toContainText('Time chips (atrasos)0')
  await expect(marksOf(keeper, 'Jacobson')).toContainText('Rebuy 1: pago fora do dinheiro')
  await expect(marksOf(keeper, 'Jacobson').getByRole('button')).toHaveCount(0)
  // Only an admin changes a finished night's dashboard, so the keeper has no link to it
  await expect(keeper.getByRole('heading', { name: 'Painel do evento' })).toHaveCount(0)
  await expect(keeper.getByRole('link', { name: 'Abrir o painel' })).toHaveCount(0)
  // The attendance is a small box under the result
  await expect(keeper.getByRole('heading', { name: 'Presença' })).toBeVisible()
  await expectAccessible(keeper)
  await other.close()

  // A player sees a finished night's dashboard, and no longer changes it
  await page.reload()
  await expect(page.getByText('O evento foi finalizado. Só um administrador altera o painel.')).toBeVisible()
  // The summary shows what it was finished with; its amounts and positions have no tab any more
  await expect(page.getByRole('heading', { name: 'Resultado registrado' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Valores' })).toHaveCount(0)
  await expectAccessible(page)
  await openTab(page, /^Jogadores/)
  await expect(marksOf(page, 'Jacobson').getByRole('button', { name: 'Buy-in' })).toBeDisabled()
})

// "Desfazer abertura" (docs/specs/seasons-and-nights.md, rule 8a), in the same season, whose night above is finished.
test('an admin undoes the opening of a night opened by mistake, and what its dashboard recorded is deleted', async ({ page }) => {
  await login(page, 'dev-keeper')
  await page.goto('results')
  await pickSeason(page, 'E2E Parcial')
  await expect(page).toHaveURL(/\/results$/)
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByLabel('Data').fill('2021-03-26')
  await page.getByRole('button', { name: 'Agendar evento' }).click()
  await expect(page).toHaveURL(/\/nights\/\d+$/)
  const nightUrl = page.url()
  await page.getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('link', { name: 'Abrir o painel' }).click()
  await openTab(page, /^Jogadores/)
  await page.getByRole('searchbox', { name: 'Adicionar jogador' }).fill('jacob')
  await page.getByRole('group', { name: 'Adicionar Jacobson' }).getByRole('button', { name: 'Buy-in pago' }).click()
  await expect(money(page)).toContainText('PoteR$ 50,00R$ 0,00')
  // A results keeper cannot undo the opening
  await page.goto(nightUrl)
  await expect(page.getByRole('link', { name: /Finalizar/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Desfazer abertura' })).toHaveCount(0)

  // An admin can: it asks first, and says what is deleted
  await logout(page)
  await login(page, 'dev-admin')
  await page.goto(nightUrl)
  await page.getByRole('button', { name: 'Desfazer abertura' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('tudo o que foi lançado no painel é apagado')
  await expectAccessible(page)
  await page.getByRole('alertdialog').getByRole('button', { name: 'Desfazer abertura' }).click()
  await expect(page.getByText('Agendado', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Painel do evento' })).toHaveCount(0)
  // The answer the dashboard gave for the player stays
  await expect(page.getByRole('region', { name: /^Vão jogar/ }).getByRole('listitem')).toHaveCount(1)

  // Opened again, the dashboard starts with the player who answered and no payment
  await page.getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('link', { name: 'Abrir o painel' }).click()
  await openTab(page, /^Jogadores/)
  await expect(marksOf(page, 'Jacobson').getByRole('button', { name: 'Buy-in' })).toHaveAttribute('aria-pressed', 'false')
  // Undone again, so the season is left with no open night
  await page.goto(nightUrl)
  await page.getByRole('button', { name: 'Desfazer abertura' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Desfazer abertura' }).click()
  await expect(page.getByText('Agendado', { exact: true })).toBeVisible()
})
