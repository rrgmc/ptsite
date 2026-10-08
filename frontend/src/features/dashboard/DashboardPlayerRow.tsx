import { Button as AriaButton, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components'
import type { NightDashboard } from '@/api/client'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Feedback'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { ToggleChip } from '@/components/ToggleChip'
import { t } from '@/i18n'
import { formatMoney } from '@/lib/format'
import { type DashboardChange, type DashboardPlayer, hasPayments } from './dashboardMoney'

/** The most rebuys the API takes for one player, whatever the season allows past its limit. */
const MAX_REBUYS = 50

const menuItem = 'flex min-h-touch cursor-pointer items-center rounded-sm px-3 outline-none focus:bg-primary-soft disabled:cursor-not-allowed disabled:text-muted'

/**
 * One participant of the night: what they paid and what is pending, as chips that one tap turns on or off. The
 * less common actions (the house owner, removing a rebuy or the player) are in a menu at the end of the row.
 */
export function DashboardPlayerRow({
  line,
  prices,
  hasTimeChip,
  canEdit,
  onChange,
}: {
  line: DashboardPlayer
  prices: NightDashboard['prices']
  /** Whether this site has the time chip. */
  hasTimeChip: boolean
  canEdit: boolean
  onChange: (change: DashboardChange) => void
}) {
  const { player, rebuys } = line
  const canRebuy = (rebuys.length < prices.rebuys_allowed || prices.allows_extra_rebuys) && rebuys.length < MAX_REBUYS
  const lastRebuy = rebuys.length - 1

  return (
    <li className="px-2 py-2 even:bg-surface-stripe">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <PlayerThumbnail player={player} size="xs" />
          <span className="truncate font-semibold">{player.nickname}</span>
          {line.is_house_owner && <Badge tone="primary">{t.dashboard.players.houseOwner}</Badge>}
        </span>
        {Number(line.pending) > 0 ? (
          <span className="shrink-0 text-sm font-semibold text-warning tabular">{t.dashboard.players.pending({ amount: formatMoney(line.pending) })}</span>
        ) : (
          Number(line.owed) > 0 && <span className="shrink-0 text-sm text-muted">{t.dashboard.players.settled}</span>
        )}
      </div>

      <div role="group" aria-label={t.dashboard.players.marksOf({ nickname: player.nickname })} className="mt-2 flex flex-wrap items-center gap-2">
        <ToggleChip isSelected={line.buy_in_paid} isDisabled={!canEdit} onChange={(paid) => onChange({ type: 'mark', player, buy_in_paid: paid })}>
          {t.dashboard.players.buyIn}
        </ToggleChip>
        {hasTimeChip && (
          <ToggleChip tone="owed" isSelected={line.time_chip} isDisabled={!canEdit} onChange={(owed) => onChange({ type: 'mark', player, time_chip: owed })}>
            {t.dashboard.players.timeChip}
          </ToggleChip>
        )}
        {hasTimeChip && line.time_chip && (
          <ToggleChip isSelected={line.time_chip_paid} isDisabled={!canEdit} onChange={(paid) => onChange({ type: 'mark', player, time_chip_paid: paid })}>
            {t.dashboard.players.timeChipPaid}
          </ToggleChip>
        )}
        {rebuys.map((rebuy, index) => (
          // Named by its place: a rebuy has no id until the API answers the tap that added it.
          <ToggleChip key={index} isSelected={rebuy.paid} isDisabled={!canEdit} onChange={(paid) => onChange({ type: 'markRebuy', player, index, id: rebuy.id, paid })}>
            {t.dashboard.players.rebuy({ number: index + 1 })}
          </ToggleChip>
        ))}
        {canEdit && canRebuy && (
          <Button variant="secondary" className="rounded-full px-3 text-sm" onPress={() => onChange({ type: 'addRebuy', player, count: rebuys.length })}>
            {t.dashboard.players.addRebuy}
          </Button>
        )}
        {canEdit && (
          <MenuTrigger>
            <AriaButton
              aria-label={t.dashboard.players.moreActions({ nickname: player.nickname })}
              className="ml-auto flex min-h-touch min-w-touch items-center justify-center rounded-full text-xl text-muted hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus"
            >
              <span aria-hidden>⋯</span>
            </AriaButton>
            <Popover placement="bottom end" className="min-w-56 rounded-md border border-border bg-surface p-1 shadow-raised">
              <Menu className="outline-none" disabledKeys={hasPayments(line) ? ['remove'] : []}>
                <MenuItem className={menuItem} onAction={() => onChange({ type: 'houseOwner', player: line.is_house_owner ? null : player })}>
                  {line.is_house_owner ? t.dashboard.players.unsetHouseOwner : t.dashboard.players.setHouseOwner}
                </MenuItem>
                {rebuys.length > 0 && (
                  <MenuItem className={menuItem} onAction={() => onChange({ type: 'removeRebuy', player, index: lastRebuy, id: rebuys[lastRebuy].id })}>
                    {t.dashboard.players.removeLastRebuy}
                  </MenuItem>
                )}
                <MenuItem id="remove" className={menuItem} onAction={() => onChange({ type: 'removePlayer', player })}>
                  {t.dashboard.players.removeFromNight}
                </MenuItem>
              </Menu>
            </Popover>
          </MenuTrigger>
        )}
      </div>
    </li>
  )
}
