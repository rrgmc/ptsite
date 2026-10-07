/**
 * The text of a night's description. A description imported from an older site may be HTML from a text editor
 * (`<p>&nbsp;Liga - 07/26</p>`); the ones written here are plain text. The markup is read, never rendered.
 */
export function plainText(text: string | null | undefined): string {
  if (!text) return ''
  const withBreaks = text.replace(/<\/p>|<br\s*\/?>/gi, '\n')
  const parsed = new DOMParser().parseFromString(withBreaks, 'text/html').body.textContent ?? ''
  return parsed
    .replace(/ /g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
