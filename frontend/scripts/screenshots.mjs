// Takes phone screenshots of the main screens into docs/screens, for design review.
// README.md shows them, so run this after changing a screen. Use scripts/screenshots.sh, which builds the
// frontend in English and runs this against a fresh database with the development seed (the demo league and
// the dev logins). It schedules and finishes a night, so it needs a throwaway database.
//   BASE_URL=http://127.0.0.1:8130/app/ node scripts/screenshots.mjs
import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const out = fileURLToPath(new URL('../../docs/screens/', import.meta.url)) // also right on Windows
mkdirSync(out, { recursive: true })
// --lang makes native date and time fields use the formats of the site's language.
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH, args: ['--lang=en-US'] })
const context = await browser.newContext({
  ...devices['Pixel 7'],
  baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:8130/app/',
  locale: 'en-US',
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
  // A chart's code loads on demand, with "Loading chart…" in its place until then
  await page.getByText(/^Loading/).first().waitFor({ state: 'hidden' })
  // The players' photos load lazily: load them all now, also those a full-page screenshot scrolls to.
  const broken = await page.evaluate(async () => {
    await Promise.all([...document.images].map((img) => {
      img.loading = 'eager'
      return img.complete ? null : new Promise((done) => { img.onload = img.onerror = done })
    }))
    return [...document.images].filter((img) => img.naturalWidth === 0).map((img) => img.src)
  })
  if (broken.length) console.warn(`screenshots: ${name} has images that did not load: ${broken.join(', ')}`)
  await networkIdle()
  // The pointer stays where the last click was, which can be over a chart: move it away, or a tooltip shows
  await page.mouse.move(0, 0)
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}${name}.png`, fullPage })
}
async function login(username) {
  await page.goto('login')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByRole('heading', { name: 'Standings' }).waitFor()
}
async function pick(label, search) {
  await page.getByRole('button', { name: label }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill(search)
  await page.getByRole('dialog').getByRole('option').first().click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
}

await login('dev-keeper')
// The standings of 2022, a finished season. Liga 2022 is the second season the demo league seeds.
await page.goto('seasons/2')
await page.getByRole('table').waitFor()
await shot('01-standings')

// Back to the current season: a finished season takes no new night
await page.goto('results')
await page.getByRole('button', { name: '+ Schedule' }).waitFor()
// Only one night can be open, and the backup's current season may already have one: finish it first
const alreadyOpen = page.getByRole('link').filter({ hasText: 'Open' })
if (await alreadyOpen.count()) {
  await alreadyOpen.first().click()
  await page.getByRole('link', { name: /^Finish/ }).click()
  await page.getByLabel('Pot (R$)', { exact: true }).fill('800')
  await page.getByLabel('Main Event pot (R$)').fill('160')
  await page.getByLabel('Time chip (R$)').fill('0')
  for (const [position, search] of [['1st', 'moneymaker'], ['2nd', 'brunson'], ['3rd', 'jacobson'], ['4th', 'duhamel'], ['5th', 'cada'], ['6th', 'raymer']]) {
    await pick(new RegExp(`^${position} place`), search)
  }
  await page.getByRole('button', { name: 'Finish night' }).click()
  await page.getByText('Finished', { exact: true }).waitFor()
  await page.goto('results')
}
await page.getByRole('button', { name: '+ Schedule' }).click()
await page.getByRole('radiogroup', { name: 'Suggestions' }).waitFor()
await page.getByLabel('Date').fill('2023-03-10')
await page.getByRole('button', { name: 'Schedule night' }).click()
await page.getByRole('heading', { name: 'League - 03/10/2023' }).waitFor()
await page.getByRole('button', { name: 'Open night' }).click()
await page.getByRole('alertdialog').getByRole('button', { name: 'Open night' }).click()
await page.getByText('Open', { exact: true }).waitFor()
// Attendance, once the night is open: the keeper answers for three players who told them in person
for (const [nickname, answer] of [['Jacobson', 'ALL IN'], ['Duhamel', 'ALL IN'], ['Moneymaker', 'FOLD']]) {
  await page.getByRole('button', { name: /^Answer for another player/ }).click()
  await page.getByRole('dialog').getByRole('searchbox').fill(nickname)
  await page.getByRole('dialog').getByRole('option', { name: nickname, exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
  await page.getByRole('button', { name: answer, exact: true }).click()
  await page.getByRole('listitem').filter({ hasText: nickname }).first().waitFor()
}
await shot('02-attendance', true)

// The night dashboard: the payments of the open night, on a screen of its own with no menus
await page.getByRole('link', { name: 'Open the dashboard' }).click()
await page.getByRole('heading', { name: 'Night dashboard', level: 1 }).waitFor()
const marksOf = (nickname) => page.getByRole('group', { name: `Payments of ${nickname}` })
await marksOf('Jacobson').getByRole('button', { name: 'Buy-in' }).click()
await marksOf('Jacobson').getByRole('button', { name: '+ Rebuy' }).click()
await marksOf('Jacobson').getByRole('button', { name: 'Rebuy 1' }).waitFor()
// The rebuy was paid, but not in cash: two taps
await marksOf('Jacobson').getByRole('button', { name: 'Rebuy 1' }).click()
await marksOf('Jacobson').getByRole('button', { name: 'Rebuy 1' }).click()
await marksOf('Jacobson').getByRole('button', { name: 'Rebuy 1 (not in cash)' }).waitFor()
await page.getByRole('button', { name: 'More actions for Duhamel' }).click()
await page.getByRole('menuitem', { name: 'Is the house owner' }).click()
await page.getByText('House owner: Duhamel').waitFor()
await shot('03-night-dashboard')
await page.getByRole('link', { name: 'Back to the site' }).click()
await page.getByText('Open', { exact: true }).waitFor()

await page.getByRole('link', { name: /^Finish/ }).click()
await page.getByLabel('Pot (R$)', { exact: true }).fill('845')
await page.getByLabel('Main Event pot (R$)').fill('170')
await page.getByLabel('Time chip (R$)').fill('40')
for (const [position, search] of [['1st', 'jacobson'], ['2nd', 'duhamel'], ['3rd', 'cada'], ['4th', 'raymer'], ['5th', 'moneymaker'], ['6th', 'brunson']]) {
  await pick(new RegExp(`^${position} place`), search)
}
await shot('04-result-form', true)
await page.getByRole('button', { name: 'Finish night' }).click()
await page.getByText('Finished', { exact: true }).waitFor()
await shot('05-night-finished')

await page.goto('seasons/10/simulator')
await page.getByLabel('Imagined pot (R$)').fill('840')
for (const [position, search] of [['1st', 'moneymaker'], ['2nd', 'brunson'], ['3rd', 'jacobson'], ['4th', 'duhamel'], ['5th', 'cada'], ['6th', 'raymer']]) {
  await pick(new RegExp(`^${position} place`), search)
}
await page.getByRole('button', { name: 'Simulate' }).click()
await page.getByRole('heading', { name: 'Simulated standings' }).scrollIntoViewIfNeeded()
await shot('06-simulator')

// The season calendar of 2022: winners, and the Friday after Tiradentes left out
await page.goto('seasons/2/calendar')
// One screen of it, with April just under the header: the whole page is many screens long.
await page.getByRole('region', { name: 'April 2022' }).evaluate((month) => {
  window.scrollTo(0, month.getBoundingClientRect().top + window.scrollY - 72)
})
await shot('07-calendar')

// The Main Event of 2022: its players in order and the season's Main Event pot
await page.goto('seasons/2/main-event')
await page.getByRole('list', { name: /^Result: Main Event/ }).waitFor()
await shot('08-main-event', true)
await browser.close()
