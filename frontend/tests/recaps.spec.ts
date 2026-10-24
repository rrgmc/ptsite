import { expect, test } from '@playwright/test'
import { expectAccessible, login } from './helpers'

// docs/specs/season-recaps.md, rule 4: a recap on "Crônicas", its title on "Classificação" and the newest one in
// full on "Resultados". The demo site has recaps on.

test('a recap shows on "Crônicas", with its title on "Classificação" and in full on "Resultados"', async ({ page, request }) => {
  // The writer's side, through the API with a token: a recap about the current season's latest night.
  const json = { Accept: 'application/json' }
  const token = (await (await request.post('../api/v1/tokens', { headers: json, data: { username: 'dev-admin', password: 'password', device_name: 'e2e' } })).json()).token
  const auth = { ...json, Authorization: `Bearer ${token}` }
  const season = (await (await request.get('../api/v1/seasons/current', { headers: auth })).json()).data
  const digest = (await (await request.get(`../api/v1/seasons/${season.id}/digest`, { headers: auth })).json()).data
  const winner = digest.latest_night.results[0].player.nickname
  const created = await request.post(`../api/v1/seasons/${season.id}/recaps`, {
    headers: auth,
    data: { night_id: digest.latest_night.id, body: `🎯 Noite de festa\n\nO ${winner} venceu e saiu sorrindo.` },
  })
  expect(created.status()).toBe(201)
  const recap = (await created.json()).data

  try {
    await login(page, 'dev-player')
    await page.goto('./')
    const box = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Crônicas' }) })
    await box.getByRole('link', { name: '🎯 Noite de festa' }).click()
    await expect(page).toHaveURL(new RegExp(`/recaps#recap-${recap.id}$`))

    const article = page.locator(`#recap-${recap.id}`)
    await expect(article.getByRole('heading', { name: '🎯 Noite de festa' })).toBeVisible()
    await expect(article.locator('strong', { hasText: winner })).toBeVisible()
    // The night's positions are beside the text.
    await expect(article.getByRole('listitem').first()).toContainText(winner)
    await expect(page.getByRole('navigation', { name: 'Ir para a crônica' }).getByRole('link').first()).toBeVisible()
    await expectAccessible(page)

    await page.getByRole('link', { name: 'Resultados' }).first().click()
    const latest = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Última crônica' }) })
    await expect(latest).toContainText('saiu sorrindo')
    await latest.getByRole('link', { name: 'Ver todas as crônicas' }).click()
    await expect(page).toHaveURL(/\/recaps$/)
  } finally {
    await request.delete(`../api/v1/recaps/${recap.id}`, { headers: auth })
  }
})
