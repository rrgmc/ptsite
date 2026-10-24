// Plain functions on a recap's text (docs/specs/season-recaps.md, rules 1 and 4b).

/** A recap's first line is its title; the rest is its text. A recap of one line has no text. */
export function splitRecap(body: string): { title: string; text: string } {
  const [first, ...rest] = body.trim().split('\n')
  return { title: first.trim(), text: rest.join('\n').trim() }
}

export type Segment = { text: string; name: boolean }

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Splits a text into the parts that are a player's nickname and the parts that are not. A nickname counts only
 * as a whole word, with its capitals as written, and a longer nickname wins over a shorter one inside it.
 */
export function markNames(text: string, nicknames: string[]): Segment[] {
  const names = [...new Set(nicknames.filter((n) => n.trim() !== ''))].sort((a, b) => b.length - a.length)
  if (names.length === 0) return [{ text, name: false }]
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${names.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'gu')
  const segments: Segment[] = []
  let at = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > at) segments.push({ text: text.slice(at, match.index), name: false })
    segments.push({ text: match[0], name: true })
    at = match.index + match[0].length
  }
  if (at < text.length) segments.push({ text: text.slice(at), name: false })
  return segments
}
