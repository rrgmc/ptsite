import { useState } from 'react'
import { Button as AriaButton, Disclosure, DisclosurePanel, Form, Heading } from 'react-aria-components'
import { Link } from 'react-router'
import type { Night, NightDashboard, Player } from '@/api/client'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Checkbox } from '@/components/Checkbox'
import { Badge, Empty } from '@/components/Feedback'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
import { rich } from '@/i18n/rich'
import { hasFeature } from '@/lib/features'
import { formatMoney, formatTime, formatWeekday, moneyText, ordinal, parseMoneyInput, titleOfNight } from '@/lib/format'
import { searchKey } from '@/lib/search'
import { currencySymbol } from '@/lib/site'
import { usePageTitle } from '@/lib/usePageTitle'
import { amountRows } from '../nights/amounts'
import { FinishingOrderFields } from '../nights/FinishingOrderFields'
import { type Amounts, amountsInUse, type DashboardChange } from './dashboardMoney'
import { DashboardPlayerRow } from './DashboardPlayerRow'

type Percentages = { position: number; percent: number }[]
type OnChange = (change: DashboardChange) => void

/** How many players the search shows at once: a league may have more than a hundred. */
const SEARCH_LIMIT = 8

/**
 * "Painel do evento": a night's money and positions on one screen, made for a phone at the table
 * (docs/specs/night-dashboard.md). Every tap is one change, sent at once; only an amount typed by hand has a
 * "Salvar". No player is created here: a first-timer is added in the site, by whoever may.
 */
export function NightDashboardView({
  night,
  dashboard,
  percentages,
  players,
  error,
  onChange,
}: {
  night: Night
  dashboard: NightDashboard
  /** The season's percentage table: its scoring positions, in order. */
  percentages: Percentages
  /** Every player who can be picked. */
  players: Player[]
  /** Why the last change was refused. */
  error?: string
  onChange: OnChange
}) {
  usePageTitle(t.dashboard.title)
  const canEdit = dashboard.can_edit
  const isOpen = dashboard.status === 'open'
  const participantIds = dashboard.players.map((line) => line.player.id)
  const notice = isOpen ? (canEdit ? null : t.dashboard.readOnly) : canEdit ? t.dashboard.finishedAdmin : t.dashboard.finishedReadOnly
  const inUse = amountsInUse(dashboard)

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

      {/* The players can be folded away, to reach the amounts and the positions on a night with many of them. */}
      <Disclosure defaultExpanded className="rounded-lg bg-surface shadow-card">
        <Heading>
          <AriaButton slot="trigger" className="group flex min-h-touch w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left font-display text-lg font-bold focus-visible:outline-3 focus-visible:outline-focus">
            {t.dashboard.players.heading({ count: dashboard.players.length })}
            <span aria-hidden className="text-muted transition-transform group-aria-expanded:rotate-180">▾</span>
          </AriaButton>
        </Heading>
        <DisclosurePanel>
          <div className="px-4 pb-4">
            {canEdit && <AddPlayers players={players.filter((p) => !participantIds.includes(p.id))} onChange={onChange} />}
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
          </div>
        </DisclosurePanel>
      </Disclosure>

      {isOpen && (
        <Card title={t.dashboard.manual.title}>
          {canEdit ? (
            // Keyed so the fields start again from amounts that someone else saved.
            <AmountsForm key={`${dashboard.manual.pot}|${dashboard.manual.time_chip}|${dashboard.main_event_pot}`} dashboard={dashboard} onChange={onChange} />
          ) : (
            <dl className="text-sm">
              {amountRows({ pot: inUse.pot, mainEventPot: inUse.mainEventPot, timeChip: inUse.timeChip }).map(([label, amount]) => (
                <div key={label} className="flex items-center justify-between py-0.5">
                  <dt className="font-semibold">{label}</dt>
                  <dd className="tabular">{formatMoney(amount)}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      )}

      {isOpen && (
        <Card title={t.dashboard.positions.title}>
          {canEdit ? (
            <>
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
                pot={Number(inUse.pot) > 0 ? inUse.pot : null}
                firstGroup={{ label: t.nights.confirmed, ids: participantIds }}
                clearable
              />
            </>
          ) : (
            <PositionsList positions={dashboard.positions} />
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

      <DashboardTotals dashboard={dashboard} />
    </div>
  )
}

/**
 * "Adicionar jogador", at the top of the players: brings a player onto the night. A league may have more than a
 * hundred players, so none is listed until someone searches: then one tap confirms a player, or confirms and
 * marks the buy-in as paid.
 */
function AddPlayers({ players, onChange }: { players: Player[]; onChange: OnChange }) {
  const [search, setSearch] = useState('')
  const query = searchKey(search)
  // Active players first, then by name.
  const found =
    query === ''
      ? []
      : players
          .filter((p) => searchKey(p.nickname).includes(query) || searchKey(p.name ?? '').includes(query))
          .sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active') || a.nickname.localeCompare(b.nickname))
  const add = (change: DashboardChange) => {
    onChange(change)
    setSearch('')
  }

  return (
    <div className="mb-3 border-b border-border pb-3">
      <TextField label={t.dashboard.others.heading} type="search" value={search} onChange={setSearch} placeholder={t.dashboard.others.searchPlaceholder} />
      {query !== '' && found.length === 0 && <p className="mt-3 text-muted">{t.dashboard.others.noneFound}</p>}
      {found.length > 0 && (
        <ul className="-mx-2 mt-2 divide-y divide-border/60">
          {found.slice(0, SEARCH_LIMIT).map((player) => (
            <li key={player.id} className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 even:bg-surface-stripe">
              <span className="flex min-w-0 items-center gap-2">
                <PlayerThumbnail player={player} size="xs" />
                <span className="truncate font-semibold">{player.nickname}</span>
                {player.status !== 'active' && <span className="text-xs text-muted">{t.common.inactive}</span>}
              </span>
              <span role="group" aria-label={t.dashboard.others.actionsOf({ nickname: player.nickname })} className="flex gap-1.5">
                <Button variant="secondary" className="min-h-9! px-2.5 text-sm" onPress={() => add({ type: 'mark', player })}>{t.dashboard.others.confirm}</Button>
                <Button className="min-h-9! px-2.5 text-sm" onPress={() => add({ type: 'mark', player, buy_in_paid: true })}>{t.dashboard.others.confirmPaid}</Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {found.length > SEARCH_LIMIT && <p className="mt-2 text-sm text-muted">{t.dashboard.others.more({ shown: SEARCH_LIMIT, total: found.length })}</p>}
    </div>
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

type AmountKey = 'pot' | 'timeChip' | 'mainEventPot'

/**
 * "Valores": the pot, the time chip and the Main Event pot, each in a field with a "Manual" mark beside it.
 * Unmarked, a field is closed and shows the amount worked out (for the Main Event pot, the season's share of the
 * pot). Marked, its amount is typed, and stands in for the one worked out once saved: one "Salvar" saves every
 * marked amount. Unmarking a saved amount goes back to the one worked out, at once.
 */
function AmountsForm({ dashboard, onChange }: { dashboard: NightDashboard; onChange: OnChange }) {
  const { manual, totals } = dashboard
  const fields: { key: AmountKey; label: string; checkLabel: string; saved: string | null; worked: string | null }[] = [
    { key: 'pot', label: t.nights.moneyFields.pot({ currency: currencySymbol }), checkLabel: t.dashboard.manual.checkPot, saved: manual.pot, worked: totals.pot.owed },
    ...(totals.time_chip
      ? [{ key: 'timeChip' as const, label: t.nights.moneyFields.timeChip({ currency: currencySymbol }), checkLabel: t.dashboard.manual.checkTimeChip, saved: manual.time_chip, worked: totals.time_chip.owed }]
      : []),
    ...(hasFeature('mainEventPot')
      ? [{ key: 'mainEventPot' as const, label: t.nights.moneyFields.mainEventPot({ currency: currencySymbol }), checkLabel: t.dashboard.manual.checkMainEventPot, saved: dashboard.main_event_pot, worked: dashboard.suggested_main_event_pot }]
      : []),
  ]
  const [marked, setMarked] = useState<Partial<Record<AmountKey, boolean>>>(() => Object.fromEntries(fields.map((f) => [f.key, f.saved !== null])))
  const [texts, setTexts] = useState<Partial<Record<AmountKey, string>>>(() => Object.fromEntries(fields.map((f) => [f.key, moneyText(f.saved)])))
  /** The amount typed in a field: null when it is empty or wrong. */
  const typed = (key: AmountKey) => parseMoneyInput(texts[key] ?? '')
  const send = (amounts: Partial<Record<AmountKey, string | null>>) => {
    if ('pot' in amounts || 'timeChip' in amounts) {
      onChange({ type: 'amounts', ...('pot' in amounts && { pot: amounts.pot }), ...('timeChip' in amounts && { time_chip: amounts.timeChip }) })
    }
    if ('mainEventPot' in amounts) onChange({ type: 'mainEventPot', amount: amounts.mainEventPot ?? null })
  }
  const open = fields.filter((f) => marked[f.key])
  const incomplete = open.some((f) => typed(f.key) === null)
  const changed = open.filter((f) => typed(f.key) !== f.saved)

  return (
    <Form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!incomplete && changed.length > 0) send(Object.fromEntries(changed.map((f) => [f.key, typed(f.key)])))
      }}
    >
      {fields.map((field) => (
        <div key={field.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <TextField
            label={field.label}
            inputMode="decimal"
            isDisabled={!marked[field.key]}
            value={marked[field.key] ? (texts[field.key] ?? '') : moneyText(field.worked)}
            onChange={(text) => setTexts({ ...texts, [field.key]: text })}
            errorMessage={marked[field.key] && (texts[field.key] ?? '').trim() !== '' && typed(field.key) === null ? t.nights.invalidMoney : undefined}
          />
          <Checkbox
            aria-label={field.checkLabel}
            isSelected={Boolean(marked[field.key])}
            onChange={(checked) => {
              setMarked({ ...marked, [field.key]: checked })
              // Marking starts from the amount in use; unmarking drops the one that was saved.
              setTexts({ ...texts, [field.key]: checked ? moneyText(field.worked) : '' })
              if (!checked && field.saved !== null) send({ [field.key]: null })
            }}
          >
            {t.dashboard.manual.mark}
          </Checkbox>
        </div>
      ))}
      {open.length > 0 && (
        <Button type="submit" variant="secondary" className="self-start" isDisabled={incomplete || changed.length === 0}>{t.dashboard.manual.save}</Button>
      )}
    </Form>
  )
}

/**
 * The night's amounts, always in sight at the foot of the screen: the pot, the time chip apart from it, and the
 * two added up. An amount typed by hand stands in for the one worked out, which is still shown below it. Each
 * says what was paid and what is pending, of what the players owe.
 */
export function DashboardTotals({ dashboard }: { dashboard: NightDashboard }) {
  const { totals, manual } = dashboard
  const inUse = amountsInUse(dashboard)
  const columns: { label: string; amount: string; amounts: Amounts; isManual: boolean }[] = [
    { label: t.dashboard.totals.pot, amount: inUse.pot, amounts: totals.pot, isManual: manual.pot !== null },
    ...(totals.time_chip ? [{ label: t.dashboard.totals.timeChip, amount: inUse.timeChip!, amounts: totals.time_chip, isManual: manual.time_chip !== null }] : []),
    { label: t.dashboard.totals.total, amount: inUse.total, amounts: totals.total, isManual: manual.pot !== null || manual.time_chip !== null },
  ]
  return (
    <section
      aria-label={t.dashboard.totals.label}
      className="sticky bottom-0 z-10 -mx-4 mt-auto border-t border-border bg-surface px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-raised"
    >
      <dl className="flex gap-3">
        {columns.map(({ label, amount, amounts, isManual }) => (
          <div key={label} className="min-w-0 flex-1">
            <dt className="text-xs font-semibold uppercase text-muted">
              {label}
              {isManual && <span className="ml-1 lowercase text-primary">({t.dashboard.manual.mark})</span>}
            </dt>
            <dd>
              <span className="block truncate font-display text-lg font-extrabold tabular">{formatMoney(amount)}</span>
              {isManual && <span className="block truncate text-xs text-muted tabular">{t.dashboard.totals.calculated({ amount: formatMoney(amounts.owed) })}</span>}
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
