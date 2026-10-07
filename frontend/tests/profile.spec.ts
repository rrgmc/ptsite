import { expect, test } from '@playwright/test'
import { expectAccessible, login, logout } from './helpers'

// A drawn picture of 206 x 274 pixels. The server makes the photo (600 x 800) and the small photo (180 x 240) from it.
const picture = 'tests/fixtures/photo.png'

test('a player edits their own details and photos in "Meu perfil"', async ({ page }) => {
  await login(page, 'dev-player')
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('link', { name: 'Meu perfil' }).click()
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
  const nickname = await page.getByLabel('Apelido').inputValue()

  // A nickname in use is refused; typing another one and saving again works.
  await page.getByLabel('Apelido').fill('Mica')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Já existe um jogador com este apelido.')).toBeVisible()
  await page.getByLabel('Apelido').fill(nickname)

  await page.getByLabel('Nome completo').fill('Jogador de Teste')
  await page.getByLabel('Data de nascimento').fill('1990-05-17')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Dados salvos.' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Nome completo')).toHaveValue('Jogador de Teste')
  await expect(page.getByLabel('Data de nascimento')).toHaveValue('1990-05-17')

  // A file that is not a picture is refused before anything is sent.
  const file = page.locator('input[type=file]')
  await file.setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('not a picture') })
  await expect(page.getByRole('alert')).toContainText('Não foi possível ler este arquivo')

  await file.setInputFiles(picture)
  await expect(page.getByRole('img', { name: `Foto de ${nickname}`, exact: true })).toHaveJSProperty('naturalWidth', 600)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expectAccessible(page)

  // The players list now shows the small photo made from it, and it opens the photo.
  await page.goto('players')
  const row = page.getByRole('listitem').filter({ has: page.getByText(nickname, { exact: true }) })
  await row.scrollIntoViewIfNeeded()
  await expect(row.getByRole('button', { name: `Ver foto de ${nickname}` }).locator('img')).toHaveJSProperty('naturalWidth', 180)
  await row.getByRole('button', { name: `Ver foto de ${nickname}` }).click()
  await expect(page.getByRole('dialog').getByRole('img')).toHaveJSProperty('naturalWidth', 600)

  // Removing the photo removes the small photo with it.
  await page.goto('profile')
  await page.getByRole('button', { name: 'Remover foto' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByRole('button', { name: 'Enviar foto' })).toBeVisible()
  await expect(page.getByRole('img', { name: `Foto de ${nickname}`, exact: true })).toHaveCount(0)
  await page.goto('players')
  await expect(row).toBeVisible()
  await expect(row.locator('img')).toHaveCount(0)
})

test('an admin sends and removes a player\'s photo in "Administração"', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.goto('admin/players')
  await page.getByRole('button', { name: 'Editar Mica' }).click()
  await expect(page.getByRole('heading', { name: 'Foto', exact: true })).toBeVisible()

  await page.locator('input[type=file]').setInputFiles(picture)
  await expect(page.getByRole('img', { name: 'Foto de Mica', exact: true })).toHaveJSProperty('naturalWidth', 600)
  await expectAccessible(page)

  await page.getByRole('button', { name: 'Remover foto', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByRole('button', { name: 'Enviar foto', exact: true })).toBeVisible()

  await page.goto('admin/audit-log')
  await expect(page.getByText('removeu uma foto do jogador').first()).toBeVisible()
  await expect(page.getByText('enviou uma foto do jogador').first()).toBeVisible()
})

test('a player changes their own password in "Meu perfil"', async ({ page }) => {
  await login(page, 'dev-player')
  await page.goto('profile')
  const change = async (current: string, password: string, repeated = password) => {
    await page.getByLabel('Senha atual').fill(current)
    await page.getByLabel('Nova senha', { exact: true }).fill(password)
    await page.getByLabel('Repetir a nova senha').fill(repeated)
    await page.getByRole('button', { name: 'Alterar senha' }).click()
  }

  await change('password', 'mesa-verde-7', 'mesa-verde-8')
  await expect(page.getByText('As duas senhas não são iguais.')).toBeVisible()
  await change('errada-1', 'mesa-verde-7')
  await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()
  await expectAccessible(page)

  await change('password', 'mesa-verde-7')
  await expect(page.getByRole('status').filter({ hasText: 'Senha alterada.' })).toBeVisible()
  await expect(page.getByLabel('Senha atual')).toHaveValue('')

  // The old password no longer works, and the new one does.
  await logout(page)
  await page.getByLabel('Usuário').fill('dev-player')
  await page.getByLabel('Senha').fill('password')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toHaveText('Usuário ou senha incorretos.')
  await page.getByLabel('Senha').fill('mesa-verde-7')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Classificação' })).toBeVisible()

  // Back to the password the other tests log in with.
  await page.goto('profile')
  await change('mesa-verde-7', 'password')
  await expect(page.getByRole('status').filter({ hasText: 'Senha alterada.' })).toBeVisible()
})

test('an account with no player has only the password in "Meu perfil"', async ({ page }) => {
  await login(page, 'dev-admin')
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Meu perfil' }).click()
  await expect(page.getByText('Este acesso não está ligado a um jogador')).toBeVisible()
  await expect(page.getByLabel('Apelido')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Alterar senha' })).toBeVisible()
  await expectAccessible(page)
})
