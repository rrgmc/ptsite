import { useId, useMemo, useState } from 'react'
import {
  Autocomplete,
  Button,
  Dialog,
  DialogTrigger,
  Header,
  Heading,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Modal,
  ModalOverlay,
  SearchField,
  type Key,
} from 'react-aria-components'
import type { Player } from '@/api/client'
import { useQuickAddPlayer } from '@/api/queries'
import { t } from '@/i18n'
import { searchKey as normalize } from '@/lib/search'

const NEW = 'new:'
const NONE = 'none'

/**
 * Picks a player for a finishing position. Opens a full-screen sheet on phones (a dropdown closes when the
 * phone keyboard scrolls the page). Active players come first; inactive ones are marked, so an old night can
 * still be corrected. Players already used in another position are hidden. Results keepers and admins can
 * quick-add a first-timer by nickname (docs/specs/players.md). The add option comes last, after the matching
 * players, so a tap on the first row after a partial search picks an existing player, not a new one.
 * With `clearable`, a first row empties the choice, for forms where a position may stay empty.
 */
export function PlayerPicker({
  label,
  players,
  value,
  onChange,
  excludeIds = [],
  allowQuickAdd = false,
  clearable = false,
  errorMessage,
  firstGroup,
}: {
  label: string
  players: Player[]
  value: Player | null
  onChange: (player: Player | null) => void
  excludeIds?: number[]
  allowQuickAdd?: boolean
  /** Offers "Deixar em branco" while a player is chosen. */
  clearable?: boolean
  errorMessage?: string
  /** Players listed first, under their own heading, for example those who answered ALL IN. */
  firstGroup?: { label: string; ids: number[] }
}) {
  const [isOpen, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const quickAdd = useQuickAddPlayer()
  const labelId = useId()
  const errorId = useId()

  const { first, active, inactive, exact } = useMemo(() => {
    const query = normalize(search)
    const matches = players.filter(
      (p) => !excludeIds.includes(p.id) && (query === '' || normalize(p.nickname).includes(query) || normalize(p.name ?? '').includes(query)),
    )
    const firstIds = new Set(firstGroup?.ids ?? [])
    const rest = matches.filter((p) => !firstIds.has(p.id))
    return {
      // In the order given (for attendance: the order they answered)
      first: (firstGroup?.ids ?? []).map((id) => matches.find((p) => p.id === id)).filter((p): p is Player => p !== undefined),
      active: rest.filter((p) => p.status === 'active'),
      inactive: rest.filter((p) => p.status !== 'active'),
      exact: players.some((p) => normalize(p.nickname) === query),
    }
  }, [players, search, excludeIds, firstGroup])

  const canAdd = allowQuickAdd && search.trim() !== '' && !exact
  const error = errorMessage ?? (quickAdd.error instanceof Error ? quickAdd.error.message : undefined)

  async function choose(key: Key) {
    const id = String(key)
    if (id === NONE) {
      onChange(null)
    } else if (id.startsWith(NEW)) {
      const player = await quickAdd.mutateAsync(id.slice(NEW.length))
      onChange(player)
    } else {
      onChange(players.find((p) => String(p.id) === id) ?? null)
    }
    setSearch('')
    setOpen(false)
  }

  const current = (p: Player) =>
    p.id === value?.id ? (
      <span className="font-bold text-primary">
        <span aria-hidden>✓</span>
        <span className="sr-only">{t.components.playerPicker.chosen}</span>
      </span>
    ) : null

  const itemClass =
    'flex min-h-touch cursor-pointer items-center justify-between gap-2 rounded-sm px-3 outline-none focus:bg-primary-soft '

  return (
    <div className="flex flex-col gap-1">
      <Label id={labelId} className="text-sm font-semibold">{label}</Label>
      <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
        <Button
          aria-labelledby={`${labelId} ${labelId}-value`}
          aria-describedby={error ? errorId : undefined}
          className={`flex min-h-touch items-center justify-between rounded-md border bg-surface px-3 text-left ${error ? 'border-danger' : 'border-border'}`}
        >
          <span id={`${labelId}-value`} className={value ? 'font-semibold' : 'text-muted'}>{value?.nickname ?? t.components.playerPicker.choose}</span>
          <span aria-hidden className="text-muted">▾</span>
        </Button>
        <ModalOverlay isDismissable className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <Modal className="flex h-[85dvh] w-full max-w-md flex-col rounded-t-lg bg-surface shadow-raised sm:h-auto sm:max-h-[80dvh] sm:rounded-lg">
            <Dialog aria-labelledby={labelId} className="flex min-h-0 flex-1 flex-col outline-none">
              <div className="flex items-center justify-between gap-2 border-b border-border p-3">
                <Heading slot="title" className="font-bold">{label}</Heading>
                <Button slot="close" className="min-h-touch rounded-md px-3 font-semibold text-primary">{t.common.close}</Button>
              </div>
              {/* Autocomplete keeps focus in the search box while typing; the list uses virtual focus. */}
              <Autocomplete inputValue={search} onInputChange={setSearch}>
              <SearchField aria-label={t.components.playerPicker.searchLabel} autoFocus className="p-3">
                <Input placeholder={t.components.playerPicker.searchPlaceholder} className="min-h-touch w-full rounded-md border border-border bg-surface px-3 text-base" />
              </SearchField>
              {/* Action-only list: with a selection mode, React Aria would toggle selection instead of choosing once a
                  player is picked, so changing the pick would not work. The current player is marked instead. */}
              <ListBox
                aria-label={t.common.players}
                onAction={choose}
                className="min-h-0 flex-1 overflow-auto px-2 pb-3 outline-none"
                renderEmptyState={() => <p className="p-3 text-muted">{t.components.playerPicker.noneFound}</p>}
              >
                {clearable && value && search.trim() === '' && (
                  <ListBoxItem id={NONE} textValue={t.components.playerPicker.leaveBlank} className={`${itemClass} text-muted`}>
                    {t.components.playerPicker.leaveBlank}
                  </ListBoxItem>
                )}
                {first.length > 0 && (
                  <ListBoxSection>
                    <Header className="px-3 pt-2 text-xs font-bold uppercase text-primary">{firstGroup?.label}</Header>
                    {first.map((p) => (
                      <ListBoxItem key={p.id} id={String(p.id)} textValue={p.nickname} className={itemClass}>
                        {p.nickname}
                        {current(p)}
                      </ListBoxItem>
                    ))}
                  </ListBoxSection>
                )}
                {active.length > 0 && (
                  <ListBoxSection>
                    <Header className="px-3 pt-2 text-xs font-bold uppercase text-muted">{t.components.playerPicker.activeGroup}</Header>
                    {active.map((p) => (
                      <ListBoxItem key={p.id} id={String(p.id)} textValue={p.nickname} className={itemClass}>
                        {p.nickname}
                        {current(p)}
                      </ListBoxItem>
                    ))}
                  </ListBoxSection>
                )}
                {inactive.length > 0 && (
                  <ListBoxSection>
                    <Header className="px-3 pt-2 text-xs font-bold uppercase text-muted">{t.components.playerPicker.inactiveGroup}</Header>
                    {inactive.map((p) => (
                      <ListBoxItem key={p.id} id={String(p.id)} textValue={p.nickname} className={`${itemClass} text-muted`}>
                        {p.nickname}
                        <span className="text-xs">{t.common.inactive} {current(p)}</span>
                      </ListBoxItem>
                    ))}
                  </ListBoxSection>
                )}
                {canAdd && (
                  <ListBoxItem key={`${NEW}${search.trim()}`} id={`${NEW}${search.trim()}`} textValue={search} className={`${itemClass} mt-2 border-t border-dashed border-border pt-2 font-semibold text-primary`}>
                    {quickAdd.isPending ? t.components.playerPicker.adding : t.components.playerPicker.addNew({ nickname: search.trim() })}
                  </ListBoxItem>
                )}
              </ListBox>
              </Autocomplete>
            </Dialog>
          </Modal>
        </ModalOverlay>
      </DialogTrigger>
      {error && <p id={errorId} role="alert" className="text-sm font-medium text-danger">{error}</p>}
    </div>
  )
}
