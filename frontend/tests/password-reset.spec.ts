import { expect, test, type Page } from '@playwright/test'
import { expectAccessible } from './helpers'

// A forgotten password (docs/specs/accounts-and-roles.md, rule 12). The tests cannot read the email, so the
// account "e2e-reset" starts with a link whose token is known (backend/database/seeders/EndToEndSeeder.php).
// That the mailed link works is checked in backend/tests/Feature/PasswordResetTest.php.
const seededToken = 'e2e-password-reset-token'

async function askForLink(page: Page, login: string) {
  await page.goto('login')
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
  await page.getByLabel('Usuário ou e-mail').fill(login)
  await page.getByRole('button', { name: 'Enviar link' }).click()
}

test('the site says so when no account has the username', async ({ page }) => {
  await askForLink(page, 'ninguem')
  await expect(page.getByText('Não encontramos nenhum acesso com este usuário ou e-mail.')).toBeVisible()
  await expectAccessible(page)
})

test('an account with no email is told to ask an admin', async ({ page }) => {
  await askForLink(page, 'dev-keeper')
  await expect(page.getByText('Este acesso não tem um e-mail válido cadastrado. Peça a um administrador para definir uma nova senha.')).toBeVisible()
})

test('a link is sent to the account\'s email, shown with most of its name hidden', async ({ page }) => {
  await askForLink(page, 'e2e-forgot')
  await expect(page.getByRole('status')).toContainText('Enviamos um link para e•••@example.org.')
  await expectAccessible(page)

  await page.getByRole('link', { name: 'Voltar para o login' }).click()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})

test('the link in the email sets a new password, once', async ({ page }) => {
  await page.goto(`reset-password?token=${seededToken}`)
  await expect(page.getByText('Escolha uma nova senha para o usuário e2e-reset.')).toBeVisible()
  await expectAccessible(page)

  await page.getByLabel('Nova senha', { exact: true }).fill('mesa-verde-7')
  await page.getByLabel('Repetir a nova senha').fill('mesa-verde-8')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByText('As duas senhas não são iguais.')).toBeVisible()

  await page.getByLabel('Repetir a nova senha').fill('mesa-verde-7')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByRole('status')).toHaveText('Senha alterada. Entre com a nova senha.')

  // The old password no longer works, and the new one does.
  await page.getByRole('link', { name: 'Entrar' }).click()
  await page.getByLabel('Usuário').fill('e2e-reset')
  await page.getByLabel('Senha').fill('password')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toHaveText('Usuário ou senha incorretos.')
  await page.getByLabel('Senha').fill('mesa-verde-7')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Classificação' })).toBeVisible()
})

test('a link that does not work offers a new one', async ({ page }) => {
  // A token that never existed gets the same answer as a used one.
  await page.goto('reset-password?token=nao-existe')
  await expect(page.getByRole('alert')).toHaveText('Este link não é válido ou já foi usado. Peça um novo link.')
  await expectAccessible(page)

  await page.getByRole('link', { name: 'Pedir um novo link' }).click()
  await expect(page.getByLabel('Usuário ou e-mail')).toBeVisible()
})
