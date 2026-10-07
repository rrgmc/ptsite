import type { Standing } from '@/api/client'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { RankCell } from '@/components/RankedList'
import { formatPoints } from '@/lib/format'

export function StandingsTable({ rows, caption }: { rows: Standing[]; caption: string }) {
  // With very large text and a wide font, the table scrolls sideways inside its card instead of widening the page.
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted">
            <th scope="col" className="w-8 px-1 py-2 sm:w-12 sm:px-2">#</th>
            <th scope="col" className="py-2">Jogador</th>
            <th scope="col" className="hidden py-2 text-right sm:table-cell">Pontuou</th>
            <th scope="col" className="hidden py-2 text-right sm:table-cell">Vitórias</th>
            <th scope="col" className="py-2 pr-2 text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const tied = rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank
            return (
              <tr key={row.player.id} className="border-b border-border/60 last:border-0 even:bg-surface-stripe">
                <RankCell rank={row.rank} tied={tied} />
                <td className="py-2">
                  <span className="flex items-center gap-2 sm:gap-3">
                    <PlayerThumbnail player={row.player} />
                    <span className="min-w-0">
                      <PlayerLink player={row.player} />
                      {/* Each half stays whole, so a narrow column breaks the line between them. */}
                      <span className="block text-xs text-muted sm:hidden">
                        <span className="inline-block whitespace-nowrap">{row.nights_scored} {row.nights_scored === 1 ? 'evento' : 'eventos'}</span>
                        {' · '}
                        <span className="inline-block whitespace-nowrap">{row.wins} {row.wins === 1 ? 'vitória' : 'vitórias'}</span>
                      </span>
                    </span>
                  </span>
                </td>
                <td className="hidden py-3 text-right tabular sm:table-cell">{row.nights_scored}</td>
                <td className="hidden py-3 text-right tabular sm:table-cell">{row.wins}</td>
                <td className="py-3 pr-2 text-right font-bold tabular">{formatPoints(row.points)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
