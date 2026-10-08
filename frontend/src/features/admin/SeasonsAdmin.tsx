import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ApiError, type Season } from '@/api/client'
import { usePlaces, useSaveSeason, useSeasons } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Checkbox } from '@/components/Checkbox'
import { Badge, ErrorBox, Loading } from '@/components/Feedback'
import { Select } from '@/components/Select'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
import { formatDate, ordinal, parseMoneyInput } from '@/lib/format'
import { hasFeature } from '@/lib/features'
import { currencySymbol } from '@/lib/site'
import { moneyText } from '@/features/nights/partialResult'
import { EVERY_WEEKS, WEEKDAYS } from './weekdays'

const STANDARD = [38, 23, 15, 11, 8, 5]

export function SeasonsAdmin() {
  const seasons = useSeasons()
  const navigate = useNavigate()

  if (seasons.isPending) return <Loading />
  if (seasons.error) return <ErrorBox error={seasons.error} />

  const status = (s: Season) =>
    s.is_finished ? <Badge>{t.admin.seasons.finished}</Badge> : s.is_open ? <Badge tone="primary">{t.admin.seasons.open}</Badge> : <Badge tone="warning">{t.admin.seasons.closed}</Badge>
  const actionLink = 'inline-flex min-h-touch items-center rounded-md px-3 font-semibold whitespace-nowrap text-primary hover:bg-primary-soft'
  const actions = (s: Season) => (
    <>
      {!s.is_finished && hasFeature('seasonPlanner') && (
        <Link to={`/admin/seasons/${s.id}/plan`} className={actionLink}>{t.admin.seasons.planDates}</Link>
      )}
      {hasFeature('mainEvent') && (
        <Link to={`/admin/seasons/${s.id}/main-event`} aria-label={t.admin.mainEvent.linkLabel({ season: s.name })} className={actionLink}>{t.admin.seasons.mainEvent}</Link>
      )}
      <Button variant="ghost" onPress={() => navigate(`/admin/seasons/${s.id}`)} aria-label={t.admin.editItem({ name: s.name })}>{t.common.edit}</Button>
    </>
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Button className="self-start" onPress={() => navigate('/admin/seasons/new')}>{t.admin.seasons.newSeason}</Button>
      <Card title={t.admin.seasons.listTitle}>
        {/* On a narrow screen the table scrolls sideways inside its card instead of widening the page. "relative" keeps the
            headings that only screen readers get inside the scrolling area. */}
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">{t.admin.seasons.listTitle}</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th scope="col" className="px-2 py-2">{t.admin.seasons.columns.season}</th>
                <th scope="col" className="px-2 py-2">{t.admin.seasons.columns.start}</th>
                <th scope="col" className="hidden px-2 py-2 text-right sm:table-cell">{t.admin.seasons.columns.nights}</th>
                <th scope="col" className="hidden px-2 py-2 text-right sm:table-cell">{t.admin.seasons.columns.finished}</th>
                <th scope="col" className="hidden px-2 py-2 sm:table-cell">{t.admin.seasons.columns.status}</th>
                <th scope="col" className="hidden px-2 py-2 sm:table-cell"><span className="sr-only">{t.admin.seasons.columns.actions}</span></th>
              </tr>
            </thead>
            {/* One body per season: a phone hides the two counts, and puts the status and the actions on a second line. */}
            {seasons.data!.map((s) => (
              <tbody key={s.id} className="border-b border-border/60 last:border-0 odd:bg-surface-stripe">
                <tr>
                  <th scope="row" className="px-2 py-2 text-left font-semibold wrap-anywhere">{s.name}</th>
                  <td className="px-2 py-2 whitespace-nowrap tabular">{formatDate(s.starts_on)}</td>
                  <td className="hidden px-2 py-2 text-right tabular sm:table-cell">{s.nights_planned ?? 0}</td>
                  <td className="hidden px-2 py-2 text-right tabular sm:table-cell">{s.nights_count ?? 0}</td>
                  <td className="hidden px-2 py-2 sm:table-cell">{status(s)}</td>
                  <td className="hidden py-1 sm:table-cell">
                    <span className="flex flex-wrap items-center justify-end gap-x-2">{actions(s)}</span>
                  </td>
                </tr>
                <tr className="sm:hidden">
                  <td colSpan={2} className="px-2 pb-1">
                    <span className="flex flex-wrap items-center gap-x-1">{status(s)}{actions(s)}</span>
                  </td>
                </tr>
              </tbody>
            ))}
          </table>
        </div>
      </Card>
    </div>
  )
}

/** A season's own page in "Administração": /admin/seasons/new or /admin/seasons/:seasonId. */
export function SeasonEditPage() {
  const { seasonId } = useParams()
  const id = seasonId === 'new' ? undefined : Number(seasonId)
  // The list, not one season: the form's fields come from it, and it is usually loaded already.
  const seasons = useSeasons()
  const season = seasons.data?.find((s) => s.id === id)
  const navigate = useNavigate()
  const location = useLocation()
  // Back to the list where it was left, or to the list itself when this page was opened directly.
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/admin'))

  return (
    <div className="flex flex-col gap-3">
      <Link to="/admin" className="inline-flex min-h-touch items-center self-start font-semibold text-primary">{t.admin.seasons.back}</Link>
      {id === undefined ? (
        <SeasonForm season={null} onDone={back} />
      ) : seasons.isPending ? (
        <Loading />
      ) : seasons.error ? (
        <ErrorBox error={seasons.error} />
      ) : season ? (
        <SeasonForm key={season.id} season={season} onDone={back} />
      ) : (
        <ErrorBox error={new Error(t.admin.seasons.notFound)} />
      )}
    </div>
  )
}

function SeasonForm({ season, onDone }: { season: Season | null; onDone: () => void }) {
  const places = usePlaces()
  const save = useSaveSeason()
  const [name, setName] = useState(season?.name ?? '')
  const [startsOn, setStartsOn] = useState(season?.starts_on ?? '')
  const [placeId, setPlaceId] = useState<number | null>(season?.default_place?.id ?? null)
  const [isFinished, setIsFinished] = useState(season?.is_finished ?? false)
  const [weekday, setWeekday] = useState<number | null>(season?.schedule.weekday ?? null)
  const [nightTime, setNightTime] = useState(season?.schedule.time ?? '')
  const [rounds, setRounds] = useState(season ? String(season.rounds) : '')
  const [everyWeeks, setEveryWeeks] = useState<number | null>(season?.schedule.every_weeks ?? null)
  const [percents, setPercents] = useState<string[]>((season?.percentages?.map((p) => p.percent) ?? STANDARD).map(String))
  const [buyIn, setBuyIn] = useState(moneyText(season?.buy_in))
  const [houseOwnerBuyIn, setHouseOwnerBuyIn] = useState(moneyText(season?.house_owner_buy_in))
  const [timeChipValue, setTimeChipValue] = useState(moneyText(season?.time_chip_value))
  const [rebuysAllowed, setRebuysAllowed] = useState(String(season?.rebuys_allowed ?? 0))
  const [allowsExtraRebuys, setAllowsExtraRebuys] = useState(season?.allows_extra_rebuys ?? false)
  const [rebuyValue, setRebuyValue] = useState(moneyText(season?.rebuy_value))
  const [rebuyChargesTimeChip, setRebuyChargesTimeChip] = useState(season?.rebuy_charges_time_chip ?? false)
  const [mainEventPotPercent, setMainEventPotPercent] = useState(season?.main_event_pot_percent == null ? '' : String(season.main_event_pot_percent))
  const total = percents.reduce((sum, p) => sum + (Number(p) || 0), 0)
  const error = save.error instanceof ApiError ? save.error : null
  // A season has rebuys when some are allowed, or when extra ones are. Without them, their fields are hidden.
  const hasRebuys = Number(rebuysAllowed) > 0 || allowsExtraRebuys
  const timeChip = hasFeature('timeChip')
  const houseOwner = hasFeature('houseOwnerBuyIn')
  // The share is only used by the night dashboard, to suggest a night's Main Event pot.
  const potShare = hasFeature('mainEventPot') && hasFeature('nightDashboard')
  /** An empty amount is none; a wrong one is undefined, and stops the form. */
  const amount = (text: string) => (text.trim() === '' ? null : (parseMoneyInput(text) ?? undefined))
  const amounts = {
    buy_in: amount(buyIn),
    ...(hasRebuys ? { rebuy_value: amount(rebuyValue) } : { rebuy_value: null }),
    ...(timeChip && { time_chip_value: amount(timeChipValue) }),
    ...(houseOwner && { house_owner_buy_in: amount(houseOwnerBuyIn) }),
  }
  const moneyError = (field: keyof typeof amounts) => error?.fieldError(field) ?? (amounts[field] === undefined ? t.nights.invalidMoney : undefined)

  return (
    <Card title={season ? t.admin.editItem({ name: season.name }) : t.admin.seasons.newTitle}>
      <Form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (Object.values(amounts).includes(undefined)) return
          save.mutate(
            {
              id: season?.id,
              name,
              starts_on: startsOn,
              default_place_id: placeId,
              ...(amounts as { [K in keyof typeof amounts]: string | null }),
              rebuys_allowed: Number(rebuysAllowed) || 0,
              allows_extra_rebuys: allowsExtraRebuys,
              // An amount or a switch this site does not have is not sent: the API refuses it.
              ...(timeChip && { rebuy_charges_time_chip: hasRebuys && rebuyChargesTimeChip }),
              ...(potShare && { main_event_pot_percent: mainEventPotPercent.trim() === '' ? null : Number(mainEventPotPercent) }),
              is_finished: isFinished,
              is_open: !isFinished,
              percentages: percents.map((p, i) => ({ position: i + 1, percent: Number(p) || 0 })),
              // Left empty on a new season, the API copies the latest season's regular night.
              ...(weekday !== null && { schedule_weekday: weekday }),
              ...(nightTime !== '' && { schedule_time: nightTime }),
              ...(everyWeeks !== null && { schedule_every_weeks: everyWeeks }),
              ...(rounds !== '' && { rounds: Number(rounds) }),
            },
            { onSuccess: onDone },
          )
        }}
      >
        <TextField label={t.common.name} value={name} onChange={setName} isRequired errorMessage={error?.fieldError('name')} />
        <TextField label={t.admin.seasons.start} type="date" value={startsOn} onChange={setStartsOn} isRequired errorMessage={error?.fieldError('starts_on')} />
        <TextField
          label={t.admin.seasons.rounds}
          description={t.admin.seasons.roundsHelp}
          inputMode="numeric"
          value={rounds}
          onChange={setRounds}
          errorMessage={error?.fieldError('rounds')}
        />
        <Select label={t.admin.seasons.defaultPlace} options={(places.data ?? []).map((p) => ({ id: p.id, label: p.name }))} selectedKey={placeId} onSelectionChange={(k) => setPlaceId(k === null ? null : Number(k))} />
        <fieldset className="min-w-0 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-semibold">{t.admin.seasons.regularNight}</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select label={t.admin.seasons.weekday} options={WEEKDAYS} selectedKey={weekday} onSelectionChange={(k) => setWeekday(k === null ? null : Number(k))} placeholder={season ? t.common.select : t.admin.seasons.sameAsPrevious} />
            <TextField label={t.admin.seasons.time} type="time" value={nightTime} onChange={setNightTime} errorMessage={error?.fieldError('schedule_time')} />
            <Select label={t.admin.seasons.frequency} options={EVERY_WEEKS} selectedKey={everyWeeks} onSelectionChange={(k) => setEveryWeeks(k === null ? null : Number(k))} placeholder={season ? t.common.select : t.admin.seasons.sameAsPrevious} />
          </div>
        </fieldset>
        <fieldset className="min-w-0 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-semibold">{t.admin.seasons.money.title}</legend>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField label={t.admin.seasons.money.buyIn({ currency: currencySymbol })} inputMode="decimal" value={buyIn} onChange={setBuyIn} errorMessage={moneyError('buy_in')} />
              {houseOwner && (
                <TextField
                  label={t.admin.seasons.money.houseOwnerBuyIn({ currency: currencySymbol })}
                  description={t.admin.seasons.money.houseOwnerBuyInHelp}
                  inputMode="decimal"
                  value={houseOwnerBuyIn}
                  onChange={setHouseOwnerBuyIn}
                  errorMessage={moneyError('house_owner_buy_in')}
                />
              )}
              {timeChip && (
                <TextField label={t.admin.seasons.money.timeChipValue({ currency: currencySymbol })} inputMode="decimal" value={timeChipValue} onChange={setTimeChipValue} errorMessage={moneyError('time_chip_value')} />
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField
                label={t.admin.seasons.money.rebuysAllowed}
                description={t.admin.seasons.money.rebuysAllowedHelp}
                inputMode="numeric"
                value={rebuysAllowed}
                onChange={setRebuysAllowed}
                errorMessage={error?.fieldError('rebuys_allowed')}
              />
              {hasRebuys && (
                <TextField
                  label={t.admin.seasons.money.rebuyValue({ currency: currencySymbol })}
                  description={timeChip ? t.admin.seasons.money.rebuyValueHelp : undefined}
                  inputMode="decimal"
                  value={rebuyValue}
                  onChange={setRebuyValue}
                  errorMessage={moneyError('rebuy_value')}
                />
              )}
            </div>
            {potShare && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TextField
                  label={t.admin.seasons.money.mainEventPotPercent}
                  description={t.admin.seasons.money.mainEventPotPercentHelp}
                  inputMode="numeric"
                  value={mainEventPotPercent}
                  onChange={setMainEventPotPercent}
                  errorMessage={error?.fieldError('main_event_pot_percent')}
                />
              </div>
            )}
            <Checkbox isSelected={allowsExtraRebuys} onChange={setAllowsExtraRebuys}>{t.admin.seasons.money.allowsExtraRebuys}</Checkbox>
            {hasRebuys && timeChip && <Checkbox isSelected={rebuyChargesTimeChip} onChange={setRebuyChargesTimeChip}>{t.admin.seasons.money.rebuyChargesTimeChip}</Checkbox>}
          </div>
        </fieldset>
        <fieldset className="min-w-0 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-semibold">{t.admin.seasons.percentages}</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {percents.map((p, i) => (
              <TextField key={i} label={ordinal(i + 1)} inputMode="numeric" value={p} onChange={(v) => setPercents((all) => all.map((x, j) => (j === i ? v : x)))} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className={total === 100 ? 'text-success' : 'font-semibold text-danger'}>{t.admin.seasons.total({ total })}</span>
            <span className="flex flex-wrap gap-1">
              <Button variant="ghost" onPress={() => setPercents((all) => [...all, '0'])}>{t.admin.seasons.addPosition}</Button>
              {percents.length > 1 && <Button variant="ghost" onPress={() => setPercents((all) => all.slice(0, -1))}>{t.admin.seasons.removePosition}</Button>}
            </span>
          </div>
          {error?.fieldError('percentages') && <p role="alert" className="mt-1 text-sm text-danger">{error.fieldError('percentages')}</p>}
        </fieldset>
        <Checkbox isSelected={isFinished} onChange={setIsFinished}>{t.admin.seasons.isFinished}</Checkbox>
        {error && !error.body.errors && <ErrorBox error={error} />}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" isPending={save.isPending}>{t.common.save}</Button>
          <Button variant="ghost" onPress={onDone}>{t.common.cancel}</Button>
        </div>
      </Form>
    </Card>
  )
}
