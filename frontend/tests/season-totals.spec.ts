import { expect, type Page, test } from '@playwright/test'
import { expectAccessible, login, pickSeason } from './helpers'

// docs/specs/season-totals.md: an admin types the final standings of a season known only by them.

async function addPlayer(page: Page, nickname: string) {
  await page.getByRole('button', { name: /^Adicionar jogador/ }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill(nickname)
  await page.getByRole('dialog').getByRole('option', { name: nickname, exact: true }).click()
}

test('an admin types the final standings of a season with no night in "Resultado final"', async ({ page }) => {
  test.slow()
  await login(page, 'dev-admin')
  await page.goto('admin')
  await page.getByRole('button', { name: '+ Nova temporada' }).click()
  await page.getByLabel('Nome').fill('Liga 1999')
  await page.getByLabel('Início').fill('1999-01-01')
  await page.getByLabel('Rodadas').fill('1')
  await page.getByRole('button', { name: 'Salvar' }).click()

  await page.getByRole('link', { name: 'Resultado final: Liga 1999' }).first().click()
  await expect(page).toHaveURL(/admin\/seasons\/\d+\/totals$/)
  await expect(page.getByText('Nenhum jogador ainda.')).toBeVisible()
  await addPlayer(page, 'Jacobson')
  await addPlayer(page, 'Duhamel')
  const jacobson = page.getByRole('group', { name: /Jacobson/ })
  const duhamel = page.getByRole('group', { name: /Duhamel/ })
  await jacobson.getByLabel('Pontos').fill('114,5')
  await jacobson.getByLabel('1º', { exact: true }).fill('1')
  await duhamel.getByLabel('Pontos').fill('69')
  await duhamel.getByLabel('2º', { exact: true }).fill('1')
  // Only two places of the round are known: the others are marked, and saved as they are.
  await expect(page.getByText('0 de 1').first()).toBeVisible()
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Resultado final salvo.')

  await page.goto('./')
  await pickSeason(page, 'Liga 1999')
  await expect(page.getByText('Só o resultado final: não há resultados por evento.')).toBeVisible()
  await expect(page.getByRole('table')).toContainText('Jacobson')
  await expect(page.getByRole('table')).toContainText('114,5')
})
