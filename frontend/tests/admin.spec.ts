import { expect, test } from '@playwright/test'
import { expectAccessible, login, logout } from './helpers'

test('an admin sees the admin section, and a wrong percentage table is refused', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin')
  await expect(page.getByRole('heading', { name: 'Administração' })).toBeVisible()
  await expectAccessible(page)

  await page.getByRole('button', { name: '+ Nova temporada' }).click()
  await page.getByLabel('Nome').fill('Liga 2099')
  await page.getByLabel('Início').fill('2099-01-01')
  await page.getByLabel('1º').fill('40')
  await expect(page.getByText('Total: 102%')).toBeVisible()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('alert')).toContainText('As porcentagens devem somar 100%. Total atual: 102%.')
})

test('a season and a place are edited on pages of their own, which return to the list', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin')
  await page.getByRole('button', { name: /^Editar / }).last().click()
  await expect(page).toHaveURL(/admin\/seasons\/\d+$/)
  await expect(page.getByLabel('Nome')).not.toHaveValue('')
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('button', { name: '+ Nova temporada' })).toBeVisible()

  await page.goto('admin/places')
  await page.getByRole('button', { name: '+ Novo local' }).click()
  await page.getByLabel('Nome').fill('Bar do Teste')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.getByRole('button', { name: 'Editar Bar do Teste' }).click()
  await expect(page).toHaveURL(/admin\/places\/\d+$/)
  await page.getByLabel('Endereço').fill('Rua das Cartas, 7')
  await expectAccessible(page)
  await page.getByRole('button', { name: 'Salvar' }).click()
  const row = page.getByRole('listitem').filter({ hasText: 'Bar do Teste' })
  await expect(row).toContainText('Rua das Cartas, 7')
})

test('archiving a place asks first, and the archived place stays in the list to be restored', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin/places')
  await page.getByRole('button', { name: '+ Novo local' }).click()
  await page.getByLabel('Nome').fill('Bar a Arquivar')
  await page.getByRole('button', { name: 'Salvar' }).click()
  const row = page.getByRole('listitem').filter({ hasText: 'Bar a Arquivar' })
  const dialog = page.getByRole('alertdialog')

  // "Cancelar" in the dialog leaves the place as it was.
  await page.getByRole('button', { name: 'Arquivar Bar a Arquivar' }).click()
  await expect(dialog).toContainText('Arquivar Bar a Arquivar?')
  await expectAccessible(page)
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(row.getByText('arquivado')).toHaveCount(0)

  await page.getByRole('button', { name: 'Arquivar Bar a Arquivar' }).click()
  await dialog.getByRole('button', { name: 'Arquivar' }).click()
  await expect(row.getByText('arquivado')).toBeVisible()
  await expectAccessible(page)
  // An archived place is not offered when a night is scheduled.
  await page.goto('results')
  await page.getByRole('button', { name: '+ Agendar' }).click()
  // The list has no options until the places arrive; then the season's default place is picked.
  await expect(page.getByRole('button', { name: /Local/ })).not.toContainText('Selecione')
  await page.getByRole('button', { name: /Local/ }).click()
  await expect(page.getByRole('option').first()).toBeVisible()
  await expect(page.getByRole('option', { name: 'Bar a Arquivar' })).toHaveCount(0)
  await page.keyboard.press('Escape')

  // Restoring does not ask.
  await page.goto('admin/places')
  await page.getByRole('button', { name: 'Restaurar Bar a Arquivar' }).click()
  await expect(page.getByRole('button', { name: 'Arquivar Bar a Arquivar' })).toBeVisible()
  await expect(row.getByText('arquivado')).toHaveCount(0)
})

test('an admin can make a player inactive and see the change in the audit log', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin/players')
  // Active players carry no badge. The list re-sorts after the change (active first), so follow the player by nickname.
  const first = page.getByRole('listitem').filter({ hasNot: page.getByText(/^(inativo|arquivado)$/) }).first()
  const nickname = (await first.locator('span.font-semibold').first().textContent())!
  await first.getByRole('button', { name: `Editar ${nickname}` }).click()
  // Exact: while the player's page loads, the list is still there, with an "Inativar <nickname>" button per row.
  await page.getByRole('button', { name: 'Inativar', exact: true }).click()
  const row = page.getByRole('listitem').filter({ has: page.getByText(nickname, { exact: true }) })
  await expect(row.getByText('inativo')).toBeVisible()

  await page.getByRole('link', { name: 'Alterações' }).click()
  await expect(page.getByText('alterou o jogador').first()).toBeVisible()
  await expectAccessible(page)
})

test('on desktop an admin changes a player\'s status in the list itself', async ({ page, isMobile }) => {
  await login(page, 'dev-admin')
  await page.goto('admin/players')
  const first = page.getByRole('listitem').filter({ hasNot: page.getByText(/^(inativo|arquivado)$/) }).first()
  const nickname = (await first.locator('span.font-semibold').first().textContent())!
  const button = (action: string) => page.getByRole('button', { name: `${action} ${nickname}`, exact: true })
  if (isMobile) {
    // A phone row has only "Editar"; the status buttons are on the player's own page.
    await expect(button('Editar')).toBeVisible()
    await expect(button('Inativar')).toHaveCount(0)
    await expect(button('Arquivar')).toHaveCount(0)
    return
  }
  const row = page.getByRole('listitem').filter({ has: page.getByText(nickname, { exact: true }) })

  await button('Inativar').click()
  await expect(row.getByText('inativo')).toBeVisible()
  // Archiving asks first; the other status changes take effect at once.
  await button('Arquivar').click()
  await expect(page.getByRole('alertdialog')).toContainText(`Arquivar ${nickname}?`)
  await page.getByRole('alertdialog').getByRole('button', { name: 'Arquivar' }).click()
  await expect(row.getByText('arquivado')).toBeVisible()
  // An archived player has no active or inactive button, as on the player's own page.
  await expect(button('Ativar')).toHaveCount(0)
  await expectAccessible(page)

  await button('Restaurar').click()
  await expect(row.getByText('inativo')).toBeVisible()
  await button('Ativar').click()
  await expect(row.getByText(/^(inativo|arquivado)$/)).toHaveCount(0)
})

test('an admin gives a new player site access as Responsável, who can then schedule nights', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin/players')
  await page.getByRole('button', { name: '+ Novo jogador' }).click()
  await page.getByLabel('Apelido').fill('Testador')
  await page.getByRole('button', { name: 'Salvar' }).click()

  await page.getByRole('button', { name: 'Editar Testador' }).click()
  await expect(page.getByText('Sem acesso ao site.')).toBeVisible()
  await expect(page.getByLabel('Usuário')).toHaveValue('testador')
  await page.getByRole('button', { name: /Papel/ }).click()
  await page.getByRole('option', { name: 'Responsável' }).click()
  await page.getByLabel('Senha').fill('mesa-verde-7')
  await page.getByRole('button', { name: 'Criar acesso' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Acesso salvo.' })).toBeVisible()
  await expectAccessible(page)

  await logout(page)
  await page.getByLabel('Usuário').fill('testador')
  await page.getByLabel('Senha').fill('mesa-verde-7')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Classificação' })).toBeVisible()
  await page.goto('results')
  await expect(page.getByRole('button', { name: '+ Agendar' })).toBeVisible()
})
