// Fails when a screen writes a text of its own. Every text a visitor reads belongs in src/i18n, so that it
// exists in every language and a site can reword it (docs/architecture/frontend.md, "Texts").
//
//   node scripts/check-i18n.mjs            check
//   node scripts/check-i18n.mjs --list     also print each text found
//   node scripts/check-i18n.mjs --update   write the baseline again (it may only get smaller)
//
// What counts as a text:
// - words between tags: <p>Nenhum evento.</p>
// - a literal in a property that is read out or shown: label, aria-label, title, placeholder, alt, description,
//   errorMessage, emptyMessage, confirmLabel, cancelLabel
// - any other literal that reads as wording: one with an accented letter ('Não encontrado'), or a word or a
//   sentence that starts with a capital letter ('Hoje', 'Algo deu errado')
//
// Tests, stories and the invented data of src/mocks are not checked: they may name the texts they expect.
//
// scripts/i18n-baseline.json lists the files not converted yet, with how many texts each still has. A file may
// have fewer than its number, never more, and a file that is not listed must have none.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('..', import.meta.url))
const src = join(root, 'src')
const baselineFile = join(root, 'scripts', 'i18n-baseline.json')
const TEXT_PROPERTIES = new Set(['label', 'aria-label', 'title', 'placeholder', 'alt', 'description', 'errorMessage', 'emptyMessage', 'confirmLabel', 'cancelLabel'])
const SKIPPED = [/^i18n\//, /^mocks\//, /^test\//, /\.test\.tsx?$/, /\.stories\.tsx?$/, /\.d\.ts$/]
const LETTERS = /\p{L}{2,}/u
const ACCENTED = /[À-ÖØ-öø-ÿ]/
// A word or a sentence that starts with a capital letter: 'Hoje', 'Algo deu errado'. Class names and keys do not.
const WORDING = /^\p{Lu}\p{Ll}+(?:[ ,.:!?…]+[\p{L}\d]+)*[.:!?…]?$/u
// Capitalized literals that are code, not wording: keys of the keyboard, HTTP words, names of web APIs.
const NOT_WORDING = new Set(['Enter', 'Escape', 'Tab', 'Home', 'End', 'Accept', 'Bearer', 'Authorization', 'Intl', 'Date', 'Error', 'Latest'])
const isWording = (text) => ACCENTED.test(text) || (WORDING.test(text) && !NOT_WORDING.has(text))

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? filesIn(path) : /\.tsx?$/.test(name) ? [path] : []
  })
}

/** The texts a file writes itself, as "line: text". */
function textsIn(path) {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const found = []
  const add = (node, text) => found.push(`${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${text.trim().replace(/\s+/g, ' ').slice(0, 70)}`)

  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isTypeNode(node)) return
    if (ts.isJsxText(node)) {
      if (LETTERS.test(node.text)) add(node, node.text)
    } else if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const name = node.name.getText()
      if (TEXT_PROPERTIES.has(name) ? LETTERS.test(node.initializer.text) : isWording(node.initializer.text)) add(node, node.initializer.text)
      return
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (isWording(node.text)) add(node, node.text)
    } else if (ts.isTemplateExpression(node)) {
      const text = [node.head, ...node.templateSpans.map((span) => span.literal)].map((part) => part.text).join('…')
      if (ACCENTED.test(text)) add(node, text)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

const counts = {}
const listing = []
for (const path of filesIn(src)) {
  const name = relative(src, path).replaceAll('\\', '/')
  if (SKIPPED.some((pattern) => pattern.test(name))) continue
  const texts = textsIn(path)
  if (texts.length > 0) {
    counts[name] = texts.length
    listing.push(...texts.map((text) => `${name}:${text}`))
  }
}

if (process.argv.includes('--list')) console.log(listing.join('\n'))

let baseline = {}
try {
  baseline = JSON.parse(readFileSync(baselineFile, 'utf8'))
} catch {
  // No baseline: every file must be clean.
}

if (process.argv.includes('--update')) {
  const grown = Object.entries(counts).filter(([name, count]) => Object.keys(baseline).length > 0 && count > (baseline[name] ?? 0))
  if (grown.length > 0) {
    console.error(`check-i18n: the baseline may only get smaller. More texts than before in: ${grown.map(([name]) => name).join(', ')}`)
    process.exit(1)
  }
  writeFileSync(baselineFile, `${JSON.stringify(Object.fromEntries(Object.entries(counts).sort()), null, 2)}\n`)
  console.log(`check-i18n: baseline written, ${Object.values(counts).reduce((a, b) => a + b, 0)} texts in ${Object.keys(counts).length} files.`)
  process.exit(0)
}

const problems = Object.entries(counts)
  .filter(([name, count]) => count > (baseline[name] ?? 0))
  .map(([name, count]) => `${name}: ${count} texts written in the file${baseline[name] ? `, ${baseline[name]} allowed until it is converted` : ''}`)
const total = Object.values(counts).reduce((a, b) => a + b, 0)

if (problems.length > 0) {
  console.error(problems.join('\n'))
  console.error('check-i18n: move these texts to src/i18n (docs/architecture/frontend.md, "Texts"). --list shows them.')
  process.exit(1)
}
console.log(total === 0 ? 'check-i18n: no text is written outside src/i18n.' : `check-i18n: ${total} texts in ${Object.keys(counts).length} files still wait to be moved to src/i18n.`)
