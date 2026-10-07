import { expect, test } from '@playwright/test'
import { expectAccessible, login, logout, pickSeason, seasonNotice } from './helpers'

// docs/specs/attendance.md, rule 8. The banner is about the current season's open night, so this test uses the demo league's
// current season. It opens a night there only when none is open yet.
test('the banner on "Classificação" and "Resultados" takes the player\'s answer for the open night', async ({ page }) => {
  test.slow() // two logins, and scheduling and opening a night

  await login(page, 'dev-keeper')
  await page.goto('results')
  await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible()
  // The finished nights show only after the nights arrive; before that, an open night is not listed yet.
  await expect(page.getByRole('article').or(page.getByText('Nenhum evento finalizado nesta temporada.')).first()).toBeVisible()
  if ((await page.getByText('Aberto', { exact: true }).count()) === 0) {
    await page.getByRole('button', { name: '+ Agendar' }).click()
    await page.getByRole('button', { name: 'Agendar evento' }).click()
    await expect(page).toHaveURL(/\/nights\/\d+$/)
    await page.getByRole('button', { name: 'Abrir evento' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
    await expect(page.getByText('Aberto', { exact: true })).toBeVisible()
  }

  // A player who has not answered gets the two buttons on "Classificação"…
  await logout(page)
  await login(page, 'dev-player')
  const banner = page.getByRole('complementary', { name: 'Evento aberto' })
  await expect(banner.getByText('Confirme sua presença')).toBeVisible()
  await expect(banner.getByRole('button', { name: 'FOLD' })).toBeVisible()
  await expectAccessible(page)

  // …answers there, and sees the answer instead of the buttons
  await banner.getByRole('button', { name: 'ALL IN' }).click()
  await expect(banner.getByText('Você: ALL IN')).toBeVisible()
  await expect(banner.getByRole('button')).toHaveCount(0)
  await expectAccessible(page)

  // "Resultados" shows the same, also after loading the answer from the server again
  await page.goto('results')
  await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible()
  await expect(banner.getByText('Você: ALL IN')).toBeVisible()

  // The banner stays on the current season's night while another season is on screen
  await pickSeason(page, 'Liga 2019')
  await expect(seasonNotice(page)).toBeVisible()
  await expect(banner.getByText('Você: ALL IN')).toBeVisible()

  // "Alterar" leads to the night's page, where the answer can be changed
  await banner.getByRole('link', { name: 'Alterar' }).click()
  await expect(page).toHaveURL(/\/nights\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Confirme sua presença' })).toBeVisible()
})
