import { expect, test } from '@playwright/test'
import { expectAccessible, login, logout, pickSeason } from './helpers'

// "Editar evento": a night's place and description (docs/specs/seasons-and-nights.md, rule 17a). The first test
// uses the E2E Agenda test season, on a date no other test uses. The second uses night 1, a finished night from
// the demo league, and puts the text of its description back.

test('a results keeper edits the place and description of a scheduled night', async ({ page }) => {
  await login(page, 'dev-keeper')
  await page.goto('results')
  await pickSeason(page, 'E2E Agenda')
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByLabel('Data').fill('2020-10-16')
  await page.getByRole('button', { name: 'Agendar evento' }).click()
  await expect(page.getByRole('heading', { name: 'Liga - 16/10/2020', level: 1 })).toBeVisible()
  await expect(page.getByText('Local a definir')).toHaveCount(0)

  await page.getByRole('link', { name: 'Editar evento' }).click()
  await expect(page.getByRole('heading', { name: 'Editar evento', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: /Local/ }).click()
  await page.getByRole('option', { name: 'Local a definir' }).click()
  await page.getByLabel('Descrição').fill('Noite de pizza')
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Salvar' }).click()

  // Back on the night's page: the place is gone, the description shows, the date is the same.
  await expect(page).toHaveURL(/nights\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Liga - 16/10/2020', level: 1 })).toBeVisible()
  await expect(page.getByText('Local a definir')).toBeVisible()
  await expect(page.getByText('Noite de pizza')).toBeVisible()
  await expectAccessible(page)

  // "Remarcar" no longer asks for the place.
  await page.getByRole('button', { name: 'Remarcar' }).click()
  await expect(page.getByLabel('Nova data')).toBeVisible()
  await expect(page.getByRole('button', { name: /Local/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Cancelar evento' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar evento' }).click()
  await expect(page).toHaveURL(/results$/)
})

test('only an admin edits a finished night', async ({ page }) => {
  await login(page, 'dev-keeper')
  await page.goto('nights/1')
  await expect(page.getByText('Finalizado')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar resultado' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar evento' })).toHaveCount(0)
  await page.goto('nights/1/edit')
  await expect(page.getByText('Só administradores editam um evento aberto ou finalizado.')).toBeVisible()
  await expectAccessible(page)

  await logout(page)
  await login(page, 'dev-admin')
  await page.goto('nights/1')
  await page.getByRole('link', { name: 'Editar evento' }).click()
  // The description is stored as HTML ("<p>Noite 9</p>"): the form shows its text.
  await expect(page.getByLabel('Descrição')).toHaveValue('Noite 9')
  await page.getByLabel('Descrição').fill('Primeira noite da liga')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page).toHaveURL(/nights\/1$/)
  await expect(page.getByText('Primeira noite da liga')).toBeVisible()
  await expect(page.getByText('Finalizado')).toBeVisible()

  await page.getByRole('link', { name: 'Editar evento' }).click()
  await page.getByLabel('Descrição').fill('Noite 9')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page).toHaveURL(/nights\/1$/)
  await expect(page.getByText('Noite 9', { exact: true })).toBeVisible()
})
