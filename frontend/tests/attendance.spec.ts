import { expect, test } from '@playwright/test'
import { expectAccessible, login, logout, pickSeason } from './helpers'

// docs/specs/attendance.md. Uses the E2E Agenda test season (backend/database/seeders/EndToEndSeeder.php), so the
// night it opens does not block the tests that open nights elsewhere.
test('answers start when the night is open: players answer ALL IN or FOLD, keepers answer for others, and the results form lists confirmed players first', async ({ page }) => {
  test.slow() // three logins and a dozen saved taps: near the 30-second limit on slower machines
  // A results keeper schedules a night
  await login(page, 'dev-keeper')
  await page.goto('results')
  await pickSeason(page, 'E2E Agenda')
  await expect(page).toHaveURL(/\/results$/)
  await page.getByRole('button', { name: '+ Agendar' }).click()
  await page.getByLabel('Data').fill('2020-12-25') // no other night that day
  await page.getByRole('button', { name: 'Agendar evento' }).click()
  await expect(page).toHaveURL(/\/nights\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Liga - 25/12/2020', level: 1 })).toBeVisible()
  const nightUrl = page.url()

  // A scheduled night takes no answers yet
  await expect(page.getByText('As confirmações começam quando o evento for aberto.')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Responder por outro jogador/ })).toHaveCount(0)

  // …opens it, and answers ALL IN for another player
  await page.getByRole('button', { name: 'Abrir evento' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
  await expect(page.getByText('Aberto', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Responder por outro jogador/ }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill('Jacobson')
  await page.getByRole('dialog').getByRole('option', { name: 'Jacobson', exact: true }).click()
  await page.getByRole('button', { name: 'ALL IN', exact: true }).click()
  const coming = page.getByRole('region', { name: /^Vão jogar/ })
  await expect(coming.getByRole('listitem')).toHaveText(['Jacobson · por Responsável (dev)'])

  // A player answers for themself, then changes their mind
  await logout(page)
  await login(page, 'dev-player')
  await page.goto(nightUrl)
  await expect(page.getByRole('heading', { name: 'Confirme sua presença' })).toBeVisible()
  let answersSaved = 0 // the player's taps the server has answered
  page.on('requestfinished', (request) => {
    if (request.method() === 'PUT' && request.url().includes('/attendance/')) answersSaved++
  })
  await page.locator('label', { hasText: /^ALL IN$/ }).click()
  await expect(page.getByRole('region', { name: 'Vão jogar (2)' })).toBeVisible()
  await expectAccessible(page)
  await page.locator('label', { hasText: /^FOLD$/ }).click()
  await expect(page.getByRole('region', { name: 'Vão jogar (1)' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Fold (1)' })).toBeVisible()
  await page.locator('label', { hasText: /^ALL IN$/ }).click()
  await expect(page.getByRole('region', { name: 'Vão jogar (2)' })).toBeVisible()

  // Quick taps are saved in order: the last one wins, also after reloading from the server
  await page.locator('label', { hasText: /^FOLD$/ }).click()
  await page.locator('label', { hasText: /^ALL IN$/ }).click()
  await page.locator('label', { hasText: /^FOLD$/ }).click()
  await expect(page.getByRole('region', { name: 'Fold (1)' })).toBeVisible()
  // Wait until the server has answered all six taps (they are sent one after another), then reload. Waiting for
  // the answers to read ALL IN and FOLD is not enough: they already do after the first of the three quick taps.
  await expect.poll(() => answersSaved).toBe(6)
  const saved = async () => {
    const response = await page.request.get(`${nightUrl.replace('/app/', '/api/v1/')}/attendance`, { headers: { Accept: 'application/json', Referer: nightUrl } }) // Sanctum uses the session only for the site's own pages
    return ((await response.json()).data as { answer: string }[]).map((a) => a.answer).sort()
  }
  await expect.poll(saved).toEqual(['all_in', 'fold'])
  await page.reload()
  await expect(page.getByRole('region', { name: 'Fold (1)' })).toBeVisible()
  await page.locator('label', { hasText: /^ALL IN$/ }).click()
  await expect(page.getByRole('region', { name: 'Vão jogar (2)' })).toBeVisible()

  // The results form lists the confirmed players first
  await logout(page)
  await login(page, 'dev-keeper')
  await page.goto(nightUrl)
  await page.getByRole('link', { name: /Finalizar/ }).click()
  await page.getByRole('button', { name: /^1º lugar/ }).click()
  const groups = page.getByRole('dialog').getByRole('group')
  await expect(groups.first()).toHaveAccessibleName('Confirmados')
  await expect(groups.first().getByRole('option')).toHaveCount(2)
})
