import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useParams } from 'react-router'
import { ApiError, type Player, type Season, type Standing } from '@/api/client'
import { usePlayers, useSaveSeasonTotals, useSeasons, useStandings } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PlayerPicker } from '@/components/PlayerPicker'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
import { moneyText, ordinal, parseMoneyInput } from '@/lib/format'

/** One line as typed: the texts of its fields, read when the form is sent. */
interface Line {
  player: Player
  points: string
  counts: string[]
}

const COUNT = /^\d{1,4}$/

/**
 * "Resultado final", in "Administração": /admin/seasons/:seasonId/totals. The final standings of a season known
 * only by them (docs/specs/season-totals.md): for each player, the points and the times in each scoring position.
 * Saving replaces the season's lines. A season with nights gets its standings from them, so it has none.
 */
export function SeasonTotalsAdmin() {
  const seasonId = Number(useParams().seasonId)
  // The list, not one season: it is usually loaded already.
  const seasons = useSeasons()
  const standings = useStandings(seasonId)
  const season = seasons.data?.find((s) => s.id === seasonId)

  return (
    <div className="flex flex-col gap-3">
      <Link to="/admin" className="inline-flex min-h-touch items-center self-start font-semibold text-primary">{t.admin.seasons.back}</Link>
      {seasons.isPending || standings.isPending ? (
        <Loading />
      ) : seasons.error || standings.error ? (
        <ErrorBox error={seasons.error ?? standings.error} />
      ) : !season ? (
        <ErrorBox error={new Error(t.admin.seasons.notFound)} />
      ) : !season.totals_only && (season.nights_planned ?? 0) > 0 ? (
        <Card className="max-w-xl" title={t.admin.seasonTotals.title({ season: season.name })}>
          <p className="text-muted">{t.admin.seasonTotals.hasNights}</p>
        </Card>
      ) : (
        <TotalsForm key={season.id} season={season} standings={season.totals_only ? standings.data! : []} />
      )}
    </div>
  )
}

function TotalsForm({ season, standings }: { season: Season; standings: Standing[] }) {
  const players = usePlayers()
  const save = useSaveSeasonTotals(season.id)
  const positions = season.percentages?.length ?? 6
  const [lines, setLines] = useState<Line[]>(() =>
    standings.map((row) => ({
      player: row.player,
      points: moneyText(row.points),
      counts: Array.from({ length: positions }, (_, i) => String(row.positions.find((p) => p.position === i + 1)?.count ?? 0)),
    })),
  )
  const [checked, setChecked] = useState(false)
  const error = save.error instanceof ApiError ? save.error : null

  const change = (index: number, line: Partial<Line>) => {
    save.reset()
    setLines(lines.map((l, i) => (i === index ? { ...l, ...line } : l)))
  }
  const pointsOk = (line: Line) => parseMoneyInput(line.points) !== null
  const countOk = (text: string) => COUNT.test(text.trim())
  const valid = lines.every((line) => pointsOk(line) && line.counts.every(countOk))
  // Each position's total, from the counts that can be read.
  const sums = Array.from({ length: positions }, (_, i) => lines.reduce((sum, line) => sum + (countOk(line.counts[i]) ? Number(line.counts[i]) : 0), 0))

  return (
    <Card title={t.admin.seasonTotals.title({ season: season.name })}>
      <Form
        aria-label={t.admin.seasonTotals.title({ season: season.name })}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          setChecked(true)
          if (!valid) return
          save.mutate(lines.map((line) => ({
            player_id: line.player.id,
            points: parseMoneyInput(line.points)!,
            positions: line.counts.map((c) => Number(c.trim())),
          })))
        }}
      >
        <p className="text-muted">{t.admin.seasonTotals.intro}</p>
        {lines.length === 0 ? (
          <Empty>{t.admin.seasonTotals.empty}</Empty>
        ) : (
          <ol className="flex flex-col gap-3">
            {lines.map((line, index) => (
              <li key={line.player.id} className="rounded-md border border-border p-3">
                <fieldset>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <legend className="font-semibold">{index + 1}. {line.player.nickname}</legend>
                    <Button
                      variant="ghost"
                      aria-label={t.admin.seasonTotals.remove({ name: line.player.nickname })}
                      onPress={() => {
                        save.reset()
                        setLines(lines.filter((_, i) => i !== index))
                      }}
                    >
                      {t.common.remove}
                    </Button>
                  </div>
                  {/* On a phone, the points take a row and the positions go three by three. */}
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-[minmax(7rem,2fr)_repeat(var(--positions),minmax(3.5rem,1fr))]" style={{ '--positions': positions } as React.CSSProperties}>
                    <div className="col-span-3 sm:col-span-1">
                      <TextField
                        label={t.admin.seasonTotals.points}
                        inputMode="decimal"
                        value={line.points}
                        onChange={(points) => change(index, { points })}
                        isInvalid={checked && !pointsOk(line)}
                        errorMessage={error?.fieldError(`rows.${index}.points`)}
                      />
                    </div>
                    {line.counts.map((count, i) => (
                      <TextField
                        key={i}
                        label={ordinal(i + 1)}
                        aria-label={t.admin.seasonTotals.times({ position: ordinal(i + 1) })}
                        inputMode="numeric"
                        value={count}
                        onChange={(text) => change(index, { counts: line.counts.map((c, j) => (j === i ? text : c)) })}
                        isInvalid={checked && !countOk(count)}
                      />
                    ))}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
        )}
        <PlayerPicker
          label={t.admin.seasonTotals.add}
          players={players.data ?? []}
          value={null}
          excludeIds={lines.map((line) => line.player.id)}
          onChange={(player) => {
            if (!player) return
            save.reset()
            setLines([...lines, { player, points: '', counts: Array.from({ length: positions }, () => '0') }])
          }}
        />
        {lines.length > 0 && (
          <div>
            <h3 className="font-display font-bold">{t.admin.seasonTotals.sums}</h3>
            <p className="mb-2 text-sm text-muted">{t.admin.seasonTotals.sumsHelp({ rounds: season.rounds })}</p>
            <dl className="flex flex-wrap gap-x-5 gap-y-1">
              {sums.map((sum, i) => (
                <div key={i} className="flex gap-1">
                  <dt className="font-semibold">{ordinal(i + 1)}</dt>
                  <dd className={`tabular ${sum === season.rounds ? '' : 'font-semibold text-warning'}`}>
                    {sum === season.rounds ? sum : t.admin.seasonTotals.sumOff({ count: sum, rounds: season.rounds })}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {checked && !valid && <p role="alert" className="text-danger">{t.admin.seasonTotals.invalid}</p>}
        {error && <p role="alert" className="text-danger">{error.body.message}</p>}
        {save.isSuccess && <p role="status" className="text-success">{t.admin.seasonTotals.saved}</p>}
        <Button type="submit" className="self-start" isPending={save.isPending}>{t.common.save}</Button>
      </Form>
    </Card>
  )
}
