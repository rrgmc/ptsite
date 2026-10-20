/**
 * The places of the champions bands: by distinct number of titles, so the next count after a tie is the next
 * place (6, 4, 4, 2 titles → 1st, 2nd, 2nd, 3rd). The lists keep the rule of the standings (1, 2, 2, 4).
 */
export function titlePlaces<T extends { count: number }>(rows: T[]): (T & { rank: number })[] {
  const counts = [...new Set(rows.map((row) => row.count))].sort((a, b) => b - a)
  return rows.map((row) => ({ ...row, rank: counts.indexOf(row.count) + 1 }))
}
