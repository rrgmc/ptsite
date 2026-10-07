import { expect, test } from '@playwright/test'
import { expectAccessible, login, pickSeason } from './helpers'

// "Remarcar" and "Cancelar" a scheduled night (docs/specs/seasons-and-nights.md). Uses the E2E Agenda test season,
// like the attendance test, on dates no other test uses.

test('a results keeper moves a scheduled night, then cancels it', async ({ page }) => {
  await login(page, 'dev-keeper')
  await page.goto('results')
  await pickSeason(page, 'E2E Agenda')
  await expect(page).toHaveURL(/\/results$/)
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByLabel('Data').fill('2020-11-13')
  await page.getByRole('button', { name: 'Agendar evento' }).click()
  await expect(page).toHaveURL(/nights\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Liga - 13/11/2020', level: 1 })).toBeVisible()

  // Remarcar: another date and time
  await page.getByRole('button', { name: 'Remarcar' }).click()
  await page.getByLabel('Nova data').fill('2020-11-20')
  await page.getByLabel('Novo horário').fill('20:00')
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Salvar nova data' }).click()
  await expect(page.getByRole('heading', { name: 'Liga - 20/11/2020', level: 1 })).toBeVisible()
  await expect(page.getByText('Sexta-feira, 20/11 · 20:00')).toBeVisible()

  // Cancelar: asks first, then the night leaves the season
  await page.getByRole('button', { name: 'Cancelar evento' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('a data fica livre')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar evento' }).click()
  await expect(page).toHaveURL(/results$/)
})
