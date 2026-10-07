import { useMemo, useState } from 'react'
import { Form } from 'react-aria-components'
import type { Player } from '@/api/client'
import { usePlayers, useSimulate } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PlayerPicker } from '@/components/PlayerPicker'
import { TextField } from '@/components/TextField'
import { PlayerLink } from '@/components/PlayerLink'
import { formatPoints, ordinal, parseMoneyInput } from '@/lib/format'
import { useSelectedSeason } from '../layout/useSelectedSeason'

/** "Simulação": what the standings would look like after an imagined next night. Nothing is saved. */
export function SimulatorPage() {
  const { season, isPending, error } = useSelectedSeason()
  const players = usePlayers({ status: 'active' })
  const simulate = useSimulate(season?.id ?? 0)
  const [potText, setPotText] = useState('')
  const [order, setOrder] = useState<Record<number, Player | null>>({})
  const percentages = useMemo(() => season?.percentages ?? [], [season])

  if (isPending || players.isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>Nenhuma temporada cadastrada.</Empty>

  const pot = parseMoneyInput(potText)
  const chosen = Object.values(order).filter((p): p is Player => p !== null).map((p) => p.id)
  const complete = pot !== null && percentages.every((p) => order[p.position])

  return (
    <>
      <PageHeader title="Simulação" subtitle={`E se o próximo evento terminar assim? · ${season.name}`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_1fr]">
        <Form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!complete) return
            simulate.mutate({ pot: pot!, positions: percentages.map((p) => ({ position: p.position, player_id: order[p.position]!.id })) })
          }}
        >
          <Card>
            <div className="flex flex-col gap-3">
              <TextField label="Pote imaginado (R$)" inputMode="decimal" value={potText} onChange={setPotText} placeholder="840,00" isRequired />
              {percentages.map((p) => (
                <PlayerPicker
                  key={p.position}
                  label={`${ordinal(p.position)} lugar · ${p.percent}%`}
                  players={players.data ?? []}
                  value={order[p.position] ?? null}
                  onChange={(player) => setOrder((o) => ({ ...o, [p.position]: player }))}
                  excludeIds={chosen.filter((id) => id !== order[p.position]?.id)}
                />
              ))}
              <Button type="submit" isDisabled={!complete} isPending={simulate.isPending}>Simular</Button>
              <p className="text-sm text-muted">Nada é salvo.</p>
            </div>
          </Card>
        </Form>

        <Card title="Classificação simulada">
          {simulate.error && <ErrorBox error={simulate.error} />}
          {!simulate.data ? (
            <Empty>Escolha o pote e a ordem de chegada para ver como ficaria a classificação.</Empty>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted">
                  <th scope="col" className="px-2 py-2">#</th>
                  <th scope="col" className="py-2">Jogador</th>
                  <th scope="col" className="py-2 text-right">Hoje</th>
                  <th scope="col" className="py-2 pr-2 text-right">Simulado</th>
                </tr>
              </thead>
              <tbody>
                {simulate.data.map((row) => (
                  <tr key={row.player.id} className="border-b border-border/60 last:border-0 even:bg-surface-stripe">
                    <td className="px-2 py-2 font-bold tabular">
                      {row.simulated_rank}
                      <Movement value={row.movement} />
                    </td>
                    <td className="py-2">
                      <PlayerLink player={row.player} className="" />
                      {row.added_points !== '0.00' && <span className="block text-xs text-success">+{formatPoints(row.added_points)}</span>}
                    </td>
                    <td className="py-2 text-right text-muted tabular">{formatPoints(row.current_points)}</td>
                    <td className="py-2 pr-2 text-right font-bold tabular">{formatPoints(row.simulated_points)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  )
}

function Movement({ value }: { value: number | null }) {
  if (value === null) return <span className="ml-1 text-xs text-primary" title="Entraria na classificação">novo</span>
  if (value === 0) return null
  const up = value > 0
  return (
    <span className={`ml-1 text-xs ${up ? 'text-success' : 'text-danger'}`}>
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      <span className="sr-only">{up ? 'sobe' : 'desce'}</span>
      {Math.abs(value)}
    </span>
  )
}
