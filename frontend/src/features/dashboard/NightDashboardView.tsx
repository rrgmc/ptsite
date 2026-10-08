import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link } from 'react-router'
import type { Night, NightDashboard, Player } from '@/api/client'
import { useQuickAddPlayer } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Checkbox } from '@/components/Checkbox'
import { Badge, Empty } from '@/components/Feedback'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
import { rich } from '@/i18n/rich'
import { hasFeature } from '@/lib/features'
import { formatMoney, formatTime, formatWeekday, ordinal, parseMoneyInput, titleOfNight } from '@/lib/format'
import { searchKey } from '@/lib/search'
import { currencySymbol } from '@/lib/site'
import { usePageTitle } from '@/lib/usePageTitle'
import { amountRows } from '../nights/amounts'
import { FinishingOrderFields } from '../nights/FinishingOrderFields'
import { moneyText } from '../nights/partialResult'
import { type Amounts, amountsInUse, type DashboardChange } from './dashboardMoney'
import { DashboardPlayerRow } from './DashboardPlayerRow'

type Percentages = { position: number; percent: number }[]
type OnChange = (change: DashboardChange) => void

/** How many players the search shows at once: a league may have more than a hundred. */
const SEARCH_LIMIT = 8

/**
 * "Painel do evento": a night's money and positions on one screen, made for a phone at the table
 * (docs/specs/night-dashboard.md). Every tap is one change, sent at once; only the amounts typed by hand have a
 * "Salvar".
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

      {canEdit && <AddPlayers players={players.filter((p) => !participantIds.includes(p.id))} everyone={players} canQuickAdd={canQuickAdd} onChange={onChange} />}

      {isOpen && (
        <Card title={t.dashboard.manual.title}>
          {canEdit ? (
            <div className="flex flex-col gap-4">
              {/* Keyed so the fields start again from amounts that someone else saved. */}
              <ManualAmounts key={`${dashboard.manual.pot}|${dashboard.manual.time_chip}`} dashboard={dashboard} onChange={onChange} />
              {hasFeature('mainEventPot') && <ManualMainEventPot key={dashboard.main_event_pot ?? ''} dashboard={dashboard} onChange={onChange} />}
            </div>
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
                pot={Number(inUse.pot) > 0 ? inUse.pot : null}
                firstGroup={{ label: t.nights.confirmed, ids: participantIds }}
                allowQuickAdd={canQuickAdd}
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

      {isOpen && canFinish && (
        <Link to={`/nights/${night.id}/result`} className="inline-flex min-h-touch items-center justify-center rounded-md border border-border bg-surface px-4 font-semibold hover:bg-surface-sunken">
          {t.dashboard.finish}
        </Link>
      )}

      <DashboardTotals dashboard={dashboard} />
    </div>
  )
}

/**
 * Brings a player onto the night. A league may have more than a hundred players, so none is listed until
 * someone searches: then one tap confirms a player, or confirms and marks the buy-in as paid. Whoever may
 * quick-add players adds a first-timer by nickname here.
 */
function AddPlayers({ players, everyone, canQuickAdd, onChange }: { players: Player[]; everyone: Player[]; canQuickAdd: boolean; onChange: OnChange }) {
  const [search, setSearch] = useState('')
  const quickAdd = useQuickAddPlayer()
  const query = searchKey(search)
  // Active players first, then by name.
  const found =
    query === ''
      ? []
      : players
          .filter((p) => searchKey(p.nickname).includes(query) || searchKey(p.name ?? '').includes(query))
          .sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active') || a.nickname.localeCompare(b.nickname))
  const canAdd = canQuickAdd && query !== '' && !everyone.some((p) => searchKey(p.nickname) === query)
  const add = (change: DashboardChange) => {
    onChange(change)
    setSearch('')
  }

  return (
    <Card title={t.dashboard.others.heading}>
      <TextField
        label={t.dashboard.others.search}
        type="search"
        value={search}
        onChange={setSearch}
        placeholder={t.dashboard.others.searchPlaceholder}
        description={query === '' ? t.dashboard.others.hint : undefined}
        errorMessage={quickAdd.error instanceof Error ? quickAdd.error.message : undefined}
      />
      {query !== '' && found.length === 0 && !canAdd && <p className="mt-3 text-muted">{t.dashboard.others.noneFound}</p>}
      {found.length > 0 && (
        <ul className="-mx-2 mt-3 divide-y divide-border/60">
          {found.slice(0, SEARCH_LIMIT).map((player) => (
            <li key={player.id} className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 even:bg-surface-stripe">
              <span className="flex min-w-0 items-center gap-2">
                <PlayerThumbnail player={player} size="xs" />
                <span className="truncate font-semibold">{player.nickname}</span>
                {player.status !== 'active' && <span className="text-xs text-muted">{t.common.inactive}</span>}
              </span>
              <span role="group" aria-label={t.dashboard.others.actionsOf({ nickname: player.nickname })} className="flex gap-2">
                <Button variant="secondary" className="px-3 text-sm" onPress={() => add({ type: 'mark', player })}>{t.dashboard.others.confirm}</Button>
                <Button className="px-3 text-sm" onPress={() => add({ type: 'mark', player, buy_in_paid: true })}>{t.dashboard.others.confirmPaid}</Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {found.length > SEARCH_LIMIT && <p className="mt-2 text-sm text-muted">{t.dashboard.others.more({ shown: SEARCH_LIMIT, total: found.length })}</p>}
      {canAdd && (
        <Button
          variant="ghost"
          className="mt-2 px-2 text-left"
          isPending={quickAdd.isPending}
          onPress={() => quickAdd.mutate(search.trim(), { onSuccess: (player) => add({ type: 'mark', player }) })}
        >
          {t.components.playerPicker.addNew({ nickname: search.trim() })}
        </Button>
      )}
    </Card>
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

/** An amount as typed: nothing is no amount, and a wrong one is undefined. */
const typedAmount = (text: string) => (text.trim() === '' ? null : (parseMoneyInput(text) ?? undefined))

/**
 * "Definir manualmente": the pot and the time chip typed by hand, for a night that does not record every
 * player's payments. Each field says what the dashboard works out, which an empty field keeps using. Unticking
 * goes back to the amounts worked out, at once.
 */
function ManualAmounts({ dashboard, onChange }: { dashboard: NightDashboard; onChange: OnChange }) {
  const { manual, totals } = dashboard
  const saved = manual.pot !== null || manual.time_chip !== null
  const [isManual, setManual] = useState(saved)
  const [potText, setPotText] = useState(moneyText(manual.pot))
  const [timeChipText, setTimeChipText] = useState(moneyText(manual.time_chip))
  const pot = typedAmount(potText)
  const timeChip = totals.time_chip ? typedAmount(timeChipText) : null
  const invalid = pot === undefined || timeChip === undefined

  return (
    <Form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!invalid) onChange({ type: 'amounts', pot, time_chip: timeChip })
      }}
    >
      <Checkbox
        isSelected={isManual}
        onChange={(checked) => {
          setManual(checked)
          if (!checked && saved) onChange({ type: 'amounts', pot: null, time_chip: null })
        }}
      >
        {totals.time_chip ? t.dashboard.manual.check : t.dashboard.manual.checkPotOnly}
      </Checkbox>
      {isManual && (
        <>
          <p className="text-sm text-muted">{t.dashboard.manual.help}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label={t.nights.moneyFields.pot({ currency: currencySymbol })}
              description={t.dashboard.manual.calculated({ amount: formatMoney(totals.pot.owed) })}
              inputMode="decimal"
              value={potText}
              onChange={setPotText}
              errorMessage={pot === undefined ? t.nights.invalidMoney : undefined}
            />
            {totals.time_chip && (
              <TextField
                label={t.nights.moneyFields.timeChip({ currency: currencySymbol })}
                description={t.dashboard.manual.calculated({ amount: formatMoney(totals.time_chip.owed) })}
                inputMode="decimal"
                value={timeChipText}
                onChange={setTimeChipText}
                errorMessage={timeChip === undefined ? t.nights.invalidMoney : undefined}
              />
            )}
          </div>
          <Button type="submit" variant="secondary" className="self-start" isDisabled={invalid || (pot === manual.pot && timeChip === manual.time_chip)}>
            {t.dashboard.manual.save}
          </Button>
        </>
      )}
    </Form>
  )
}

/**
 * "Pote ME": the season's share of the pot unless it is set by hand. Unticking goes back to the season's share,
 * at once.
 */
function ManualMainEventPot({ dashboard, onChange }: { dashboard: NightDashboard; onChange: OnChange }) {
  const saved = dashboard.main_event_pot !== null
  const [isManual, setManual] = useState(saved)
  const [text, setText] = useState(moneyText(dashboard.main_event_pot))
  const amount = typedAmount(text)
  const suggested = dashboard.suggested_main_event_pot

  return (
    <Form
      className="flex flex-col gap-2 border-t border-border pt-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (amount) onChange({ type: 'mainEventPot', amount })
      }}
    >
      <Checkbox
        isSelected={isManual}
        onChange={(checked) => {
          setManual(checked)
          if (!checked && saved) onChange({ type: 'mainEventPot', amount: null })
        }}
      >
        {t.dashboard.mainEventPot.check}
      </Checkbox>
      {isManual ? (
        <>
          <TextField
            label={t.nights.moneyFields.mainEventPot({ currency: currencySymbol })}
            description={suggested ? t.dashboard.manual.calculated({ amount: formatMoney(suggested) }) : undefined}
            inputMode="decimal"
            value={text}
            onChange={setText}
            placeholder={t.nights.moneyFields.mainEventPotPlaceholder}
            errorMessage={amount === undefined ? t.nights.invalidMoney : undefined}
          />
          <Button type="submit" variant="secondary" className="self-start" isDisabled={!amount || amount === dashboard.main_event_pot}>
            {t.dashboard.mainEventPot.save}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">{suggested ? t.dashboard.mainEventPot.suggested({ amount: formatMoney(suggested) }) : t.dashboard.mainEventPot.none}</p>
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
              {isManual && <span className="ml-1 normal-case text-primary">({t.dashboard.manual.mark})</span>}
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
