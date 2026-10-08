import { expect, type Page, test } from '@playwright/test'
import { expectAccessible, login } from './helpers'

// The season planner and the holiday table (docs/specs/season-planner.md), with the 2027 examples. Uses the
// E2E Planejamento test season (backend/database/seeders/EndToEndSeeder.php: 26 nights, Fridays at 21:00, every
// other week), so the nights it schedules do not touch the seasons other tests use.

async function openPlanner(page: Page, from: string, to: string) {
  await page.goto('admin')
  await page.getByRole('rowgroup').filter({ hasText: 'E2E Planejamento' }).getByRole('link', { name: 'Planejar datas' }).click()
  await expect(page.getByRole('heading', { name: 'Planejar datas · E2E Planejamento' })).toBeVisible()
  await page.getByLabel('De', { exact: true }).fill(from)
  await page.getByLabel('Até', { exact: true }).fill(to)
}

/** A day on the planner's calendar, by its date: "26/03/2027". */
const day = (page: Page, date: string) => page.getByRole('button', { name: new RegExp(`^[^,]+, ${date.replaceAll('/', '\\/')}`) })

test('an admin plans 2027 on the calendar: holidays, the emenda and Carnival are left out, any day can be added', async ({ page }) => {
  await login(page, 'dev-admin')
  await openPlanner(page, '2027-01-04', '2027-06-30')

  await expect(day(page, '05/02/2027')).toHaveAccessibleName('Sexta-feira, 05/02/2027: Carnaval')
  await expect(day(page, '26/03/2027')).toHaveAccessibleName('Sexta-feira, 26/03/2027: Feriado: Sexta-feira Santa')
  await expect(day(page, '28/05/2027')).toHaveAccessibleName('Sexta-feira, 28/05/2027: Emenda: Corpus Christi')
  await expect(day(page, '26/03/2027')).toHaveAttribute('aria-pressed', 'false')
  await expect(day(page, '02/04/2027')).toHaveAttribute('aria-pressed', 'true')
  // Every holiday is listed under its month, also the ones that do not fall on a Friday.
  await expect(page.getByRole('region', { name: 'Abril de 2027' })).toContainText('Quarta-feira, 21/04 · Feriado: Tiradentes')
  await expect(page.getByRole('region', { name: 'Março de 2027' })).toContainText('Sexta-feira, 26/03 · Feriado: Sexta-feira Santa · fica de fora')
  // The season already has its 26 rounds: a warning, but scheduling is allowed.
  await expect(page.getByText('Rodadas: 37 de 26')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('passa de 26')
  await expectAccessible(page)

  // Sexta-feira Santa is played after all, and an extra Thursday is added.
  await day(page, '26/03/2027').click()
  await day(page, '10/06/2027').click()
  await expect(day(page, '10/06/2027')).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Agendar 13 eventos' }).click()
  await expect(page.getByRole('status').filter({ hasText: '13 eventos agendados.' })).toBeVisible()

  // Planning again shows them as already scheduled, linked to the night.
  await openPlanner(page, '2027-03-22', '2027-04-05')
  await expect(page.getByRole('link', { name: 'Sexta-feira, 26/03/2027: Já agendado' })).toBeVisible()
})

test('cancelling Corpus Christi for 2027 puts 28/05 back in the plan', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin/holidays?year=2027')
  await expect(page.getByRole('heading', { name: 'Feriados de 2027' })).toBeVisible()
  const corpus = page.getByRole('listitem').filter({ hasText: 'Corpus Christi' }).filter({ hasText: '27/05/2027' })
  await expect(corpus).toBeVisible()
  await expect(corpus).not.toContainText('Não haverá em 2027')
  await corpus.getByRole('button', { name: 'Não haverá' }).click()
  await expect(corpus).toContainText('Não haverá em 2027')
  await expectAccessible(page)

  await openPlanner(page, '2027-05-24', '2027-06-01')
  await expect(day(page, '28/05/2027')).toHaveAccessibleName('Sexta-feira, 28/05/2027: Evento habitual, marcado')
  await expect(page.getByText('Emenda: Corpus Christi')).toHaveCount(0)

  // Undo, so the holiday table is as it was.
  await page.goto('admin/holidays?year=2027')
  await corpus.getByRole('button', { name: 'Desfazer' }).click()
  await expect(corpus.getByRole('button', { name: 'Não haverá' })).toBeVisible()
})

test('archiving a holiday asks first, and the archived holiday stays in the table to be restored', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin/holidays?year=2027')
  // 15/08/2027 is a Sunday, so this holiday changes no plan in the other tests.
  await page.getByRole('button', { name: '+ Novo feriado' }).click()
  await page.getByLabel('Nome').last().fill('Feriado a Arquivar')
  await page.getByLabel('Dia e mês').fill('15/08')
  await page.getByRole('button', { name: 'Salvar' }).click()
  const row = page.getByRole('listitem').filter({ hasText: 'Feriado a Arquivar' }).filter({ hasText: 'Municipal' }).last()
  const dialog = page.getByRole('alertdialog')

  await page.getByRole('button', { name: 'Arquivar Feriado a Arquivar' }).click()
  await expect(dialog).toContainText('Arquivar Feriado a Arquivar?')
  await dialog.getByRole('button', { name: 'Arquivar' }).click()
  await expect(row.getByText('arquivado')).toBeVisible()
  await expectAccessible(page)

  // Restoring does not ask.
  await page.getByRole('button', { name: 'Restaurar Feriado a Arquivar' }).click()
  await expect(page.getByRole('button', { name: 'Arquivar Feriado a Arquivar' })).toBeVisible()

  // Archived again, so the holiday table is as it was for the other tests.
  await page.getByRole('button', { name: 'Arquivar Feriado a Arquivar' }).click()
  await dialog.getByRole('button', { name: 'Arquivar' }).click()
  await expect(page.getByRole('button', { name: 'Restaurar Feriado a Arquivar' })).toBeVisible()
})

test('with rounds left, the plan stops at the night that completes them', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin')
  await page.getByRole('rowgroup').filter({ hasText: 'E2E Rodadas' }).getByRole('link', { name: 'Planejar datas' }).click()

  await expect(page.getByText('Até a última rodada (26ª)')).toBeVisible()
  await expect(page.getByText('Rodadas: 26 de 26')).toBeVisible()
  // "Até" shows the last planned night, which is ticked.
  const until = await page.getByLabel('Até', { exact: true }).inputValue()
  const [year, month, dayOfMonth] = until.split('-')
  await expect(day(page, `${dayOfMonth}/${month}/${year}`)).toHaveAttribute('aria-pressed', 'true')
})
