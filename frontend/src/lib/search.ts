/** A text as it is compared in a search: no accents, no capitals, no spaces around it. "Élio " → "elio". */
export function searchKey(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}
