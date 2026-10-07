import { useState } from 'react'
import { Form } from 'react-aria-components'
import { ApiError, type CalendarHoliday, type Holiday } from '@/api/client'
import {
  type HolidayInput,
  useDeleteHolidayException,
  useHolidayCalendar,
  useHolidays,
  useSaveHoliday,
  useSaveHolidayException,
} from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Badge, ErrorBox, Loading } from '@/components/Feedback'
import { Select } from '@/components/Select'
import { TextField } from '@/components/TextField'
import { formatLongDate } from '@/lib/format'
import { holidayRule } from './holidayRule'

const SCOPES = [
  { id: 'national', label: 'Nacional' },
  { id: 'state', label: 'Estadual (SP)' },
  { id: 'city', label: 'Municipal (São Paulo)' },
]
const scopeLabel = (scope: string | null) => SCOPES.find((s) => s.id === scope)?.label ?? 'Só neste ano'

/** "Feriados": the holiday table used by the season planner, and its changes for a single year. */
export function HolidaysAdmin({ initialYear = new Date().getFullYear() + 1 }: { initialYear?: number }) {
  const [year, setYear] = useState(initialYear)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">
        Usados em “Planejar datas” de cada temporada. Evento em feriado, na véspera de feriado (emenda) ou no fim de
        semana de Carnaval fica de fora do plano.
      </p>
      <YearCalendar year={year} setYear={setYear} />
      <ExtraHolidayForm year={year} />
      <HolidayTable />
    </div>
  )
}

function YearCalendar({ year, setYear }: { year: number; setYear: (y: number) => void }) {
  const calendar = useHolidayCalendar(year)
  const cancel = useSaveHolidayException()
  const undo = useDeleteHolidayException()
  const error = cancel.error ?? undo.error

  return (
    <Card
      title={`Feriados de ${year}`}
      action={
        <span className="flex">
          <Button variant="ghost" aria-label="Ano anterior" onPress={() => setYear(year - 1)}>‹</Button>
          <Button variant="ghost" aria-label="Próximo ano" onPress={() => setYear(year + 1)}>›</Button>
        </span>
      }
    >
      {error && <ErrorBox error={error} />}
      {calendar.isPending ? <Loading /> : calendar.error ? <ErrorBox error={calendar.error} /> : (
        <ul className="divide-y divide-border/60">
          {calendar.data!.map((h: CalendarHoliday) => (
            <li key={`${h.date}-${h.holiday_id ?? h.exception_id}`} className="flex min-h-touch items-center justify-between gap-2 -mx-2 px-2 py-2 even:bg-surface-stripe">
              <span className={`min-w-0 wrap-break-word hyphens-auto ${h.cancelled ? 'text-muted line-through' : ''}`}>
                <span className="font-semibold">{h.name}</span>
                <span className="block text-sm text-muted">{formatLongDate(h.date)} · {scopeLabel(h.scope)}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                {h.cancelled && <Badge tone="warning">Não haverá em {year}</Badge>}
                {h.holiday_id === null && <Badge tone="primary">Só em {year}</Badge>}
                {h.exception_id !== null ? (
                  <Button variant="ghost" className="px-2" onPress={() => undo.mutate(h.exception_id!)}>{h.cancelled ? 'Desfazer' : 'Remover'}</Button>
                ) : (
                  <Button variant="ghost" className="px-2" onPress={() => cancel.mutate({ year, holiday_id: h.holiday_id! })}>Não haverá</Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function ExtraHolidayForm({ year }: { year: number }) {
  const save = useSaveHolidayException()
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const error = save.error instanceof ApiError ? save.error : null

  return (
    <Card title={`Feriado só em ${year}`}>
      <Form
        className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate({ year, date, name }, { onSuccess: () => { setDate(''); setName('') } })
        }}
      >
        <TextField label="Data" type="date" value={date} onChange={setDate} isRequired errorMessage={error?.fieldError('date')} />
        <TextField label="Nome" value={name} onChange={setName} isRequired errorMessage={error?.fieldError('name')} />
        <Button type="submit" variant="secondary" isPending={save.isPending}>Adicionar</Button>
      </Form>
    </Card>
  )
}

function HolidayTable() {
  const holidays = useHolidays({ archived: true })
  const save = useSaveHoliday()
  const [adding, setAdding] = useState(false)
  const [archiving, setArchiving] = useState<Holiday | null>(null)
  const isSaving = (id: number) => save.isPending && save.variables?.id === id

  return (
    <Card title="Tabela de feriados" action={!adding && <Button variant="ghost" onPress={() => setAdding(true)}>+ Novo feriado</Button>}>
      {adding && <HolidayForm onDone={() => setAdding(false)} />}
      {save.error && <ErrorBox error={save.error} />}
      {holidays.isPending ? <Loading /> : holidays.error ? <ErrorBox error={holidays.error} /> : (
        <ul className="divide-y divide-border/60">
          {holidays.data!.map((h) => (
            <li key={h.id} className="flex min-h-touch items-center justify-between gap-2 -mx-2 px-2 py-2 even:bg-surface-stripe">
              <span className="min-w-0 wrap-break-word hyphens-auto">
                <span className="flex flex-wrap items-center gap-x-2">
                  <span className={`font-semibold ${h.archived ? 'text-muted line-through' : ''}`}>{h.name}</span>
                  {h.archived && <Badge tone="danger">arquivado</Badge>}
                </span>
                <span className="block text-sm text-muted">{holidayRule(h)} · {scopeLabel(h.scope)}</span>
              </span>
              {/* Archiving asks first. Restoring hides nothing, so it takes effect at once. */}
              <Button
                variant="ghost"
                isPending={isSaving(h.id)}
                onPress={() => (h.archived ? save.mutate({ id: h.id, archived: false }) : setArchiving(h))}
                aria-label={`${h.archived ? 'Restaurar' : 'Arquivar'} ${h.name}`}
              >
                {h.archived ? 'Restaurar' : 'Arquivar'}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {archiving && (
        <ConfirmDialog
          isOpen
          onOpenChange={() => setArchiving(null)}
          title={`Arquivar ${archiving.name}?`}
          confirmLabel="Arquivar"
          confirmVariant="danger"
          isPending={save.isPending}
          onConfirm={() => save.mutate({ id: archiving.id, archived: true }, { onSettled: () => setArchiving(null) })}
        >
          O feriado deixa de contar em “Planejar datas” e sai dos calendários. Dá para restaurar depois, nesta tabela.
        </ConfirmDialog>
      )}
    </Card>
  )
}

function HolidayForm({ onDone }: { onDone: () => void }) {
  const save = useSaveHoliday()
  const [name, setName] = useState('')
  const [scope, setScope] = useState<HolidayInput['scope']>('city')
  const [kind, setKind] = useState<'fixed' | 'easter'>('fixed')
  const [date, setDate] = useState('') // dd/mm
  const [offset, setOffset] = useState('')
  const [firstYear, setFirstYear] = useState('')
  const error = save.error instanceof ApiError ? save.error : null
  const [day, month] = date.split('/').map(Number)

  return (
    <Form
      className="mb-4 flex flex-col gap-3 rounded-md border border-border p-3"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(
          {
            name,
            scope,
            ...(kind === 'fixed' ? { day: day || null, month: month || null } : { easter_offset: Number(offset) }),
            first_year: firstYear ? Number(firstYear) : null,
          },
          { onSuccess: onDone },
        )
      }}
    >
      <TextField label="Nome" value={name} onChange={setName} isRequired errorMessage={error?.fieldError('name')} />
      <Select label="Abrangência" options={SCOPES} selectedKey={scope ?? null} onSelectionChange={(k) => setScope(k as HolidayInput['scope'])} />
      <Select
        label="Quando"
        options={[{ id: 'fixed', label: 'Mesmo dia todo ano' }, { id: 'easter', label: 'Relativo à Páscoa' }]}
        selectedKey={kind}
        onSelectionChange={(k) => setKind(k === 'easter' ? 'easter' : 'fixed')}
      />
      {kind === 'fixed' ? (
        <TextField label="Dia e mês" placeholder="21/04" inputMode="numeric" value={date} onChange={setDate} isRequired errorMessage={error?.fieldError('day') ?? error?.fieldError('month')} />
      ) : (
        <TextField
          label="Dias depois da Páscoa"
          description="Negativo para antes: Sexta-feira Santa é −2, Corpus Christi é 60."
          inputMode="numeric"
          value={offset}
          onChange={setOffset}
          isRequired
          errorMessage={error?.fieldError('easter_offset')}
        />
      )}
      <TextField label="A partir do ano (opcional)" inputMode="numeric" value={firstYear} onChange={setFirstYear} errorMessage={error?.fieldError('first_year')} />
      {error && !error.body.errors?.name && <ErrorBox error={error} />}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" isPending={save.isPending}>Salvar</Button>
        <Button variant="ghost" onPress={onDone}>Cancelar</Button>
      </div>
    </Form>
  )
}
