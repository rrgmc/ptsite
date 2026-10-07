import { Link } from 'react-router'
import type { Night, PartialResult } from '@/api/client'
import { useMe, usePartialResult, useSeason } from '@/api/queries'
import { Card } from '@/components/Card'
import { ErrorBox, Loading } from '@/components/Feedback'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { PlayerLink } from '@/components/PlayerLink'
import { formatMoney, formatPoints, formatTime, ordinal, shareOf } from '@/lib/format'
import { isEmptyPartial } from './partialResult'

/** The partial result of an open night, loaded from the API, with the way to fill it for those who may. */
export function NightPartialResult({ night }: { night: Night }) {
  const partial = usePartialResult(night.id)
  const season = useSeason(night.season_id)
  const me = useMe()

  if (partial.isPending || season.isPending) return <Loading />
  if (partial.error || season.error) return <ErrorBox error={partial.error ?? season.error} />

  return (
    <PartialResultCard
      nightId={night.id}
      partial={partial.data!}
      percentages={season.data!.percentages ?? []}
      canSave={Boolean(me.data?.abilities.save_partial_results)}
    />
  )
}

/**
 * "Resultado parcial": what the players recorded so far on an open night. With a pot, it shows the points each
 * position would earn from it, as the form does. They count only when the night is finished; the results keeper
 * starts the real result from it.
 */
export function PartialResultCard({
  nightId,
  partial,
  percentages,
  canSave,
}: {
  nightId: number
  partial: PartialResult
  /** The season's percentage table: its scoring positions, in order. */
  percentages: { position: number; percent: number }[]
  canSave: boolean
}) {
  const empty = isEmptyPartial(partial)
  const amounts = [
    ['Pote Total', partial.pot],
    ['Pote ME', partial.main_event_pot],
    ['Time chip', partial.time_chip],
  ] as const

  return (
    <Card className="max-w-md" title="Resultado parcial">
      {empty ? (
        <p className="text-muted">Ninguém preencheu o resultado parcial ainda.</p>
      ) : (
        <>
          <ol className="divide-y divide-border/60">
            {percentages.map(({ position, percent }) => {
              const player = partial.positions.find((line) => line.position === position)?.player
              return (
                <li key={position} className="flex items-center justify-between gap-2 px-2 py-1.5 even:bg-surface-stripe">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-8 shrink-0 font-bold text-muted tabular">{ordinal(position)}</span>
                    {player ? (
                      <>
                        <PlayerThumbnail player={player} />
                        <PlayerLink player={player} className="min-w-0" />
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </span>
                  {partial.pot && (
                    <span className="shrink-0 tabular" aria-label={`Pontos do ${ordinal(position)} lugar`}>
                      {formatPoints(shareOf(partial.pot, percent))}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
          <dl className="mt-2 border-t border-border pt-2 text-sm">
            {amounts.map(([label, amount]) => (
              <div key={label} className="flex items-center justify-between py-0.5">
                <dt className="font-semibold">{label}</dt>
                <dd className="tabular">{formatMoney(amount)}</dd>
              </div>
            ))}
          </dl>
          {partial.saved_at && (
            <p className="mt-2 text-sm text-muted">
              Salvo por {partial.saved_by?.name ?? 'alguém'} às {formatTime(partial.saved_at)}. Ainda não vale pontos.
            </p>
          )}
        </>
      )}
      {canSave && (
        <Link
          to={`/nights/${nightId}/partial-result`}
          className="mt-3 inline-flex min-h-touch w-full items-center justify-center rounded-md border border-border bg-surface px-4 font-semibold hover:bg-surface-sunken sm:w-auto"
        >
          {empty ? 'Preencher resultado parcial' : 'Editar resultado parcial'}
        </Link>
      )}
    </Card>
  )
}
