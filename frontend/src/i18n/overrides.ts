/** A site's own wording: the same shape as the catalogue, with only the texts it changes, all as strings. */
export type MessageOverrides = { [key: string]: string | MessageOverrides }

type Catalogue = { [key: string]: unknown }

/** "Olá, {name}" with { name: 'Ana' } → "Olá, Ana". A name with no value stays as written. */
export function fill(text: string, values: Record<string, unknown> | undefined): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (values && name in values ? String(values[name]) : whole))
}

/**
 * The catalogue with a site's wording put over it. A string that replaces a text with values in it names them
 * in braces: "Pote ME de {amount}".
 *
 * A key the catalogue does not have is an error: it is a typing mistake, or a text that was renamed.
 */
export function withOverrides<T>(catalogue: T, overrides: MessageOverrides, path = ''): T {
  const result: Catalogue = { ...(catalogue as Catalogue) }
  for (const [key, override] of Object.entries(overrides)) {
    const at = path ? `${path}.${key}` : key
    const base = result[key]
    if (base === undefined) throw new Error(`messages.json: there is no text named "${at}".`)
    if (typeof override !== 'string') {
      if (typeof base !== 'object' || base === null) throw new Error(`messages.json: "${at}" is one text, not a group of texts.`)
      result[key] = withOverrides(base, override, at)
    } else if (typeof base === 'function') {
      result[key] = (values: Record<string, unknown>) => fill(override, values)
    } else if (typeof base === 'string') {
      result[key] = override
    } else {
      throw new Error(`messages.json: "${at}" is a group of texts, not one text.`)
    }
  }
  return result as T
}
