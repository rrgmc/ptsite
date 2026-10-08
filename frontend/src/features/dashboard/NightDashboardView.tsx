import { useState } from 'react'
import { Button as AriaButton, Disclosure, DisclosurePanel, Form, Heading } from 'react-aria-components'
import { Link } from 'react-router'
import type { Night, NightDashboard, Player } from '@/api/client'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Badge, Empty } from '@/components/Feedback'
import { PlayerPicker } from '@/components/PlayerPicker'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
import { rich } from '@/i18n/rich'
import { hasFeature } from '@/lib/features'
import { formatMoney, formatTime, formatWeekday, ordinal, parseMoneyInput, titleOfNight } from '@/lib/format'
import { currencySymbol } from '@/lib/site'
import { usePageTitle } from '@/lib/usePageTitle'
import { amountRows } from '../nights/amounts'
import { FinishingOrderFields } from '../nights/FinishingOrderFields'
import { moneyText } from '../nights/partialResult'
import type { Amounts, DashboardChange } from './dashboardMoney'
import { DashboardPlayerRow } from './DashboardPlayerRow'

type Percentages = { position: number; percent: number }[]

/**
 * "Painel do evento": a night's money and positions on one screen, made for a phone at the table
 * (docs/specs/night-dashboard.md). Every tap is one change, sent at once; nothing here has a "Salvar" but the
 * typed Main Event pot.
 */
export function NightDashboardView({
  night,
  dashboard,
  percentages,
  players,
  canQuickAdd = false,
  canFinish = false,
  error,
  onChange,
}: {
  night: Night
  dashboard: NightDashboard
  /** The season's percentage table: its scoring positions, in order. */
  percentages: Percentages
  /** Every player who can be picked. */
  players: Player[]
  canQuickAdd?: boolean
  /** Whether this user finishes nights, and so gets the way to "Finalizar". */
  canFinish?: boolean
  /** Why the last change was refused. */
  error?: string
  onChange: (change: DashboardChange) => void
}) {
  usePageTitle(t.dashboard.title)
  const canEdit = dashboard.can_edit
  const isOpen = dashboard.status === 'open'
  const participantIds = dashboard.players.map((line) => line.player.id)
  const notice = isOpen ? (canEdit ? null : t.dashboard.readOnly) : canEdit ? t.dashboard.finishedAdmin : t.dashboard.finishedReadOnly

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header>
        <div className="flex items-center justify-between gap-2">
          <Link to={`/nights/${night.id}`} className="-ml-2 inline-flex min-h-touch items-center gap-1 rounded-md px-2 font-semibold text-primary hover:bg-primary-soft">
            <span aria-hidden>‹</span> {t.dashboard.backToSite}
          </Link>
          <Badge tone={isOpen ? 'primary' : 'neutral'}>{t.nights.status[dashboard.status]}</Badge>
        </div>
        <h1 className="font-display text-2xl font-extrabold">{t.dashboard.title}</h1>
        <p className="text-muted">
          {titleOfNight(night)} · {formatWeekday(night.starts_at)} · {night.place?.name ?? t.nights.noPlace}
        </p>
        <p className="text-sm text-muted">
          {dashboard.house_owner ? rich(t.dashboard.houseOwnerIs, { name: <strong>{dashboard.house_owner.nickname}</strong> }) : t.dashboard.noHouseOwner}
          {' · '}
          {t.dashboard.updatedAt({ time: formatTime(dashboard.read_at) })}
        </p>
      </header>

      {notice && <p role="status" className="rounded-md bg-surface-sunken p-3 text-sm">{notice}</p>}
      {error && <p role="alert" className="rounded-md border border-danger bg-danger-soft p-3 text-danger">{error}</p>}

      <Card title={t.dashboard.players.heading({ count: dashboard.players.length })}>
        {dashboard.players.length === 0 ? (
          <Empty>{t.dashboard.players.empty}</Empty>
        ) : (
          <ul className="-mx-2 divide-y divide-border/60">
            {dashboard.players.map((line) => (
              <DashboardPlayerRow
                key={line.player.id}
                line={line}
                prices={dashboard.prices}
                hasTimeChip={dashboard.totals.time_chip !== null}
                canEdit={canEdit}
                onChange={onChange}
              />
            ))}
          </ul>
        )}
      </Card>

      {canEdit && <OtherPlayers players={players.filter((p) => !participantIds.includes(p.id))} canQuickAdd={canQuickAdd} onChange={onChange} />}

      {isOpen && (
        <Card title={t.dashboard.positions.title}>
          {canEdit ? (
            <>
              <p className="mb-3 text-sm text-muted">{t.dashboard.positions.help}</p>
              <FinishingOrderFields
                percentages={percentages}
                players={players}
                order={percentages.map((p) => dashboard.positions.find((line) => line.position === p.position)?.player ?? null)}
                onChange={(order) => {
                  // The picker gives the whole order back; only the position that changed is sent.
                  percentages.forEach((p, i) => {
                    const before = dashboard.positions.find((line) => line.position === p.position)?.player ?? null
                    if (before?.id !== order[i]?.id) onChange({ type: 'position', position: p.position, player: order[i] })
                  })
                }}
                pot={Number(dashboard.totals.pot.owed) > 0 ? dashboard.totals.pot.owed : null}
                firstGroup={{ label: t.nights.confirmed, ids: participantIds }}
                allowQuickAdd={canQuickAdd}
                clearable
              />
            </>
          ) : (
            <PositionsList positions={dashboard.positions} />
          )}
          {hasFeature('mainEventPot') && (
            // Keyed so the field starts again from an amount that someone else saved.
            <MainEventPotField key={dashboard.main_event_pot ?? ''} dashboard={dashboard} canEdit={canEdit} onChange={onChange} />
          )}
        </Card>
      )}

      {dashboard.recorded && (
        <Card title={t.dashboard.recorded.title}>
          <p className="mb-2 text-sm text-muted">{t.dashboard.recorded.help}</p>
          <dl className="text-sm">
            {amountRows({ pot: dashboard.recorded.pot, mainEventPot: dashboard.recorded.main_event_pot, timeChip: dashboard.recorded.time_chip }).map(([label, amount]) => (
              <div key={label} className="flex items-center justify-between py-0.5">
                <dt className="font-semibold">{label}</dt>
                <dd className="tabular">{formatMoney(amount)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {isOpen && canFinish && (
        <Link to={`/nights/${night.id}/result`} className="inline-flex min-h-touch items-center justify-center rounded-md border border-border bg-surface px-4 font-semibold hover:bg-surface-sunken">
          {t.dashboard.finish}
        </Link>
      )}

      <DashboardTotals totals={dashboard.totals} />
    </div>
  )
}

/**
 * The players who are not on the night yet, closed until asked for: one tap confirms a player, or confirms and
 * marks the buy-in as paid. Inactive players and first-timers are in the picker below the list.
 */
function OtherPlayers({ players, canQuickAdd, onChange }: { players: Player[]; canQuickAdd: boolean; onChange: (change: DashboardChange) => void }) {
  const active = players.filter((p) => p.status === 'active')
  return (
    <Disclosure className="rounded-lg bg-surface shadow-card">
      <Heading>
        <AriaButton slot="trigger" className="group flex min-h-touch w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left font-display text-lg font-bold focus-visible:outline-3 focus-visible:outline-focus">
          {t.dashboard.others.heading({ count: active.length })}
          <span aria-hidden className="text-muted transition-transform group-aria-expanded:rotate-180">▾</span>
        </AriaButton>
      </Heading>
      <DisclosurePanel>
        <div className="px-4 pb-4">
          <ul className="-mx-2 divide-y divide-border/60">
            {active.map((player) => (
              <li key={player.id} className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 even:bg-surface-stripe">
                <span className="flex min-w-0 items-center gap-2">
                  <PlayerThumbnail player={player} size="xs" />
                  <span className="truncate font-semibold">{player.nickname}</span>
                </span>
                <span role="group" aria-label={t.dashboard.others.actionsOf({ nickname: player.nickname })} className="flex gap-2">
                  <Button variant="secondary" className="px-3 text-sm" onPress={() => onChange({ type: 'mark', player })}>{t.dashboard.others.confirm}</Button>
                  <Button className="px-3 text-sm" onPress={() => onChange({ type: 'mark', player, buy_in_paid: true })}>{t.dashboard.others.confirmPaid}</Button>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <PlayerPicker label={t.dashboard.others.addOther} players={players} value={null} onChange={(player) => player && onChange({ type: 'mark', player })} allowQuickAdd={canQuickAdd} />
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}

/** The positions filled so far, for someone who sees the dashboard and does not change it. */
function PositionsList({ positions }: { positions: NightDashboard['positions'] }) {
  if (positions.length === 0) return <p className="text-muted">{t.dashboard.positions.empty}</p>
  return (
    <ol className="divide-y divide-border/60">
      {positions.map(({ position, player }) => (
        <li key={position} className="flex items-center gap-2 py-1.5">
          <span className="w-8 shrink-0 font-bold text-muted tabular">{ordinal(position)}</span>
          <PlayerThumbnail player={player} size="xs" />
          <span className="truncate">{player.nickname}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * "Pote ME": the one amount the dashboard does not work out. The season may suggest a share of the pot; any
 * amount can be typed instead.
 */
function MainEventPotField({ dashboard, canEdit, onChange }: { dashboard: NightDashboard; canEdit: boolean; onChange: (change: DashboardChange) => void }) {
  const [text, setText] = useState(moneyText(dashboard.main_event_pot))
  const amount = text.trim() === '' ? null : parseMoneyInput(text)
  const invalid = text.trim() !== '' && amount === null
  const suggested = dashboard.suggested_main_event_pot

  if (!canEdit) {
    return (
      <p className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="font-semibold">{t.nights.amounts.mainEventPot}</span>
        <span className="tabular">{formatMoney(dashboard.main_event_pot)}</span>
      </p>
    )
  }
  return (
    <Form
      className="mt-4 flex flex-col gap-2 border-t border-border pt-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!invalid) onChange({ type: 'mainEventPot', amount })
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <TextField
          label={t.nights.moneyFields.mainEventPot({ currency: currencySymbol })}
          description={suggested ? t.dashboard.mainEventPot.suggested({ amount: formatMoney(suggested) }) : undefined}
          inputMode="decimal"
          value={text}
          onChange={setText}
          placeholder={t.nights.moneyFields.mainEventPotPlaceholder}
          errorMessage={invalid ? t.nights.invalidMoney : undefined}
        />
        <Button type="submit" variant="secondary" isDisabled={invalid || amount === dashboard.main_event_pot}>{t.dashboard.mainEventPot.save}</Button>
      </div>
      {suggested && suggested !== dashboard.main_event_pot && (
        <Button variant="ghost" className="self-start px-2" onPress={() => onChange({ type: 'mainEventPot', amount: suggested })}>
          {t.dashboard.mainEventPot.useSuggested({ amount: formatMoney(suggested) })}
        </Button>
      )}
    </Form>
  )
}

/**
 * The night's amounts, always in sight at the foot of the screen: the pot, the time chip apart from it, and the
 * two added up. Each says what is owed, what was paid and what is pending.
 */
export function DashboardTotals({ totals }: { totals: NightDashboard['totals'] }) {
  const columns: [label: string, amounts: Amounts][] = [
    [t.dashboard.totals.pot, totals.pot],
    ...(totals.time_chip ? [[t.dashboard.totals.timeChip, totals.time_chip] as [string, Amounts]] : []),
    [t.dashboard.totals.total, totals.total],
  ]
  return (
    <section
      aria-label={t.dashboard.totals.label}
      className="sticky bottom-0 z-10 -mx-4 mt-auto border-t border-border bg-surface px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-raised"
    >
      <dl className="flex gap-3">
        {columns.map(([label, amounts]) => (
          <div key={label} className="min-w-0 flex-1">
            <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
            <dd>
              <span className="block truncate font-display text-lg font-extrabold tabular">{formatMoney(amounts.owed)}</span>
              <span className="block truncate text-xs text-muted tabular">{t.dashboard.totals.paid({ amount: formatMoney(amounts.paid) })}</span>
              <span className={`block truncate text-xs tabular ${Number(amounts.pending) > 0 ? 'font-semibold text-warning' : 'text-muted'}`}>
                {t.dashboard.totals.pending({ amount: formatMoney(amounts.pending) })}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
