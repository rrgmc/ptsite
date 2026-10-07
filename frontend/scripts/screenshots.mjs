// Takes screenshots of the main screens into docs/screens/<mobile|desktop>, for design review.
// README.md shows them, so run this after changing a screen. Use scripts/screenshots.sh, which builds the
// frontend and runs this once per device against a fresh database with the development seed (the demo league and
// the dev logins). It schedules and finishes a night, so it needs a throwaway database.
//   DEVICE=mobile|desktop BASE_URL=http://127.0.0.1:8130/app/ node scripts/screenshots.mjs
import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const device = process.env.DEVICE ?? 'mobile'
const viewports = {
  mobile: devices['Pixel 7'],
  desktop: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
}
const out = fileURLToPath(new URL(`../../docs/screens/${device}/`, import.meta.url)) // also right on Windows
mkdirSync(out, { recursive: true })
// --lang makes native date and time fields use Brazilian formats, as on the league's phones.
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH, args: ['--lang=pt-BR'] })
const context = await browser.newContext({
  ...viewports[device],
  baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:8130/app/',
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
})
const page = await context.newPage()

// Requests in flight. waitForLoadState('networkidle') is no use here: after a link inside the app it returns at
// once, because the document itself did not load again.
const pending = new Set()
let lastActivity = Date.now()
page.on('request', (request) => { pending.add(request); lastActivity = Date.now() })
for (const event of ['requestfinished', 'requestfailed']) {
  page.on(event, (request) => { pending.delete(request); lastActivity = Date.now() })
}
// A request that a page load cuts off may never report its end: forget those, and never wait more than 15 s.
page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) pending.clear() })
async function networkIdle() {
  const start = Date.now()
  while (pending.size > 0 || Date.now() - lastActivity < 500) {
    if (Date.now() - start > 15_000) {
      console.warn(`screenshots: still loading after 15 s: ${[...pending].map((request) => request.url()).join(', ')}`)
      pending.clear()
      return
    }
    await page.waitForTimeout(100)
  }
}

async function shot(name, fullPage = false) {
  await networkIdle()
  // A chart's code loads on demand, with "Carregando gráfico…" in its place until then
  await page.getByText(/^Carregando/).first().waitFor({ state: 'hidden' })
  // The players' photos load lazily: load them all now, also those a full-page screenshot scrolls to.
  const broken = await page.evaluate(async () => {
    await Promise.all([...document.images].map((img) => {
      img.loading = 'eager'
      return img.complete ? null : new Promise((done) => { img.onload = img.onerror = done })
    }))
    return [...document.images].filter((img) => img.naturalWidth === 0).map((img) => img.src)
  })
  if (broken.length) console.warn(`screenshots: ${name} (${device}) has images that did not load: ${broken.join(', ')}`)
  await networkIdle()
  // The pointer stays where the last click was, which can be over a chart: move it away, or a tooltip shows
  await page.mouse.move(0, 0)
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}${name}.png`, fullPage })
}
async function login(username) {
  await page.goto('login')
  await page.getByLabel('Usuário').fill(username)
  await page.getByLabel('Senha').fill('password')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('heading', { name: 'Classificação' }).waitFor()
}
async function pick(label, search) {
  await page.getByRole('button', { name: label }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill(search)
  await page.getByRole('dialog').getByRole('option').first().click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
}

await page.goto('login')
await shot('01-login')
await login('dev-keeper')
// "Temporadas": every season with the first ten of its standings
await page.goto('seasons')
await page.getByRole('heading', { name: 'Temporadas' }).waitFor()
await shot('16-seasons')
// "Escolher temporada": picking 2022 makes it the season on every screen, with a notice that it is not the current one
await page.getByRole('link', { name: /^Temporada:/ }).click()
await page.getByRole('heading', { name: 'Escolher temporada' }).waitFor()
await shot('18-season-picker')
await page.getByRole('listitem').filter({ has: page.getByText('Liga 2022', { exact: true }) }).getByRole('button').click()
await page.getByRole('table').waitFor()
await shot('02-standings-2022')
await page.getByRole('link', { name: 'Ver todos' }).click()
await page.getByRole('heading', { name: 'Resultados' }).waitFor()
await shot('03-results-2022')
await page.getByRole('button', { name: 'Menu' }).click()
await page.getByRole('dialog', { name: 'Menu' }).waitFor()
await shot('17-menu')
await page.keyboard.press('Escape')

// Back to the current season: a finished season takes no new night
await page.getByRole('button', { name: 'Voltar para a atual' }).click()
await page.getByRole('button', { name: '+ Agendar' }).waitFor()
// Only one night can be open, and the backup's current season may already have one: finish it first
const alreadyOpen = page.getByRole('link').filter({ hasText: 'Aberto' })
if (await alreadyOpen.count()) {
  await alreadyOpen.first().click()
  await page.getByRole('link', { name: /Finalizar/ }).click()
  await page.getByLabel('Pote (R$)').fill('800')
  await page.getByLabel('Pote ME (R$)').fill('160')
  await page.getByLabel('Time chip (R$)').fill('0')
  for (const [position, search] of [[1, 'moneymaker'], [2, 'brunson'], [3, 'jacobson'], [4, 'duhamel'], [5, 'cada'], [6, 'raymer']]) {
    await pick(new RegExp(`^${position}º lugar`), search)
  }
  await page.getByRole('button', { name: 'Finalizar evento' }).click()
  await page.getByText('Finalizado', { exact: true }).waitFor()
  await page.goto('results')
}
await page.getByRole('button', { name: '+ Agendar' }).click()
await page.getByRole('radiogroup', { name: 'Sugestões' }).waitFor()
await shot('04-schedule-night') // the regular suggestion is chosen; the date is still editable
await page.getByLabel('Data').fill('2023-03-10')
await page.getByRole('button', { name: 'Agendar evento' }).click()
await page.getByRole('heading', { name: 'Liga - 10/03/2023' }).waitFor()
await page.getByRole('button', { name: 'Abrir evento' }).click()
await shot('06-open-confirm')
await page.getByRole('alertdialog').getByRole('button', { name: 'Abrir evento' }).click()
await page.getByText('Aberto', { exact: true }).waitFor()
// Attendance, once the night is open: the keeper answers for three players who told them in person
for (const [nickname, answer] of [['Jacobson', 'ALL IN'], ['Duhamel', 'ALL IN'], ['Moneymaker', 'FOLD']]) {
  await page.getByRole('button', { name: /^Responder por outro jogador/ }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill(nickname)
  await page.getByRole('dialog').getByRole('option', { name: nickname, exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
  await page.getByRole('button', { name: answer, exact: true }).click()
  await page.getByRole('listitem').filter({ hasText: nickname }).first().waitFor()
}
await shot('05-attendance', true)

await page.getByRole('link', { name: /Finalizar/ }).click()
await page.getByLabel('Pote (R$)').fill('845')
await page.getByLabel('Pote ME (R$)').fill('170')
await page.getByLabel('Time chip (R$)').fill('40')
await pick(/^1º lugar/, 'jacobson')
await pick(/^2º lugar/, 'duhamel')
await pick(/^3º lugar/, 'cada')
await page.getByRole('button', { name: /^4º lugar/ }).click()
await page.getByRole('dialog').getByRole('searchbox').fill('Estreante')
await shot('07-player-picker-quick-add')
await page.getByRole('option', { name: /Adicionar/ }).click()
await page.getByRole('dialog').waitFor({ state: 'detached' })
await pick(/^5º lugar/, 'moneymaker')
await pick(/^6º lugar/, 'brunson')
await shot('08-result-form', true)
await page.getByRole('button', { name: 'Finalizar evento' }).click()
await page.getByText('Finalizado', { exact: true }).waitFor()
await shot('09-night-finished')

await page.goto('seasons/10/simulator')
await page.getByLabel('Pote imaginado (R$)').fill('840')
for (const [position, search] of [[1, 'moneymaker'], [2, 'brunson'], [3, 'jacobson'], [4, 'duhamel'], [5, 'cada'], [6, 'raymer']]) {
  await pick(new RegExp(`^${position}º lugar`), search)
}
await page.getByRole('button', { name: 'Simular' }).click()
await page.getByRole('heading', { name: 'Classificação simulada' }).scrollIntoViewIfNeeded()
await shot('10-simulator')

// On a phone "Sair" is in the menu
if (!(await page.getByRole('button', { name: 'Sair' }).isVisible())) await page.getByRole('button', { name: 'Menu' }).click()
await page.getByRole('button', { name: 'Sair' }).click()
await page.getByLabel('Usuário').waitFor()
await login('dev-admin')
await page.goto('admin')
await page.getByRole('heading', { name: 'Administração' }).waitFor()
await shot('11-admin-seasons')
await page.goto('admin/audit-log')
await page.getByText('finalizou o evento').first().waitFor()
await shot('12-admin-audit-log')

// The season planner for the first half of 2027: Carnival, Sexta-feira Santa and the Corpus Christi emenda are out
await page.goto('admin')
await page.getByRole('link', { name: 'Planejar datas' }).first().click() // the newest season that is not finished
await page.getByLabel('De', { exact: true }).fill('2027-01-04')
await page.getByLabel('Até', { exact: true }).fill('2027-06-30')
await page.getByText('Emenda: Corpus Christi').waitFor()
await shot('13-admin-season-planner', true)
await page.goto('admin/holidays?year=2027')
await page.getByRole('heading', { name: 'Feriados de 2027' }).waitFor()
await page.getByText('Sexta-feira Santa').first().waitFor()
await shot('14-admin-holidays')

// The season calendar of 2022: winners, and the Friday after Tiradentes left out
// Liga 2022 is the second season the demo league seeds.
await page.goto('seasons/2/calendar')
await page.getByRole('region', { name: 'Abril de 2022' }).waitFor()
await shot('15-calendar', true)
await browser.close()
