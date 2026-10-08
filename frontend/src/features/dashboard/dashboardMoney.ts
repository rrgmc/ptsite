import type { NightDashboard, Player } from '@/api/client'
import { site } from '@/lib/site'

export type DashboardPlayer = NightDashboard['players'][number]
export type Amounts = NightDashboard['totals']['pot']

/**
 * One tap on the dashboard. A rebuy is named by its place in the player's list and by its id, which is 0 while
 * the API has not answered the tap that added it. `count` is how many rebuys the player had when tapped.
 */
export type DashboardChange =
  | { type: 'mark'; player: Player; buy_in_paid?: boolean; time_chip?: boolean; time_chip_paid?: boolean }
  | { type: 'addRebuy'; player: Player; count: number }
  | { type: 'markRebuy'; player: Player; index: number; id: number; paid: boolean }
  | { type: 'removeRebuy'; player: Player; index: number; id: number }
  | { type: 'removePlayer'; player: Player }
  | { type: 'houseOwner'; player: Player | null }
  | { type: 'position'; position: number; player: Player | null }
  | { type: 'mainEventPot'; amount: string | null }
  | { type: 'amounts'; pot: string | null; time_chip: string | null }

const cents = (amount: string) => Math.round(Number(amount) * 100)
const decimal = (amount: number) => (amount / 100).toFixed(2)
const amounts = (owed: number, paid: number): Amounts => ({ owed: decimal(owed), paid: decimal(paid), pending: decimal(owed - paid) })

/** Whether anything is recorded for the player beyond taking part. The API refuses to remove such a player. */
export function hasPayments(line: DashboardPlayer): boolean {
  return line.buy_in_paid || line.time_chip || line.time_chip_paid || line.rebuys.length > 0
}

/**
 * The dashboard with every amount worked out again from its prices and its players, as the API does
 * (docs/specs/night-dashboard.md, rule 11). The suggested Main Event pot is left as it was: the API sends it.
 */
export function recalculated(dashboard: NightDashboard): NightDashboard {
  const { prices } = dashboard
  const hasTimeChip = dashboard.totals.time_chip !== null
  const timeChipValue = hasTimeChip ? cents(prices.time_chip_value) : 0
  const rebuyTimeChip = prices.rebuy_charges_time_chip ? timeChipValue : 0
  const pot = { owed: 0, paid: 0 }
  const timeChip = { owed: 0, paid: 0 }

  const players = dashboard.players.map((line) => {
    const isHouseOwner = line.player.id === dashboard.house_owner?.id
    const buyIn = cents(isHouseOwner ? prices.house_owner_buy_in : prices.buy_in)
    const paidRebuys = line.rebuys.filter((rebuy) => rebuy.paid).length
    const ofPot = { owed: buyIn + line.rebuys.length * cents(prices.rebuy_value), paid: (line.buy_in_paid ? buyIn : 0) + paidRebuys * cents(prices.rebuy_value) }
    const ofTimeChip = {
      owed: (line.time_chip ? timeChipValue : 0) + line.rebuys.length * rebuyTimeChip,
      paid: (line.time_chip_paid ? timeChipValue : 0) + paidRebuys * rebuyTimeChip,
    }
    pot.owed += ofPot.owed
    pot.paid += ofPot.paid
    timeChip.owed += ofTimeChip.owed
    timeChip.paid += ofTimeChip.paid
    return { ...line, is_house_owner: isHouseOwner, buy_in: decimal(buyIn), ...amounts(ofPot.owed + ofTimeChip.owed, ofPot.paid + ofTimeChip.paid) }
  })

  return {
    ...dashboard,
    players,
    totals: {
      pot: amounts(pot.owed, pot.paid),
      time_chip: hasTimeChip ? amounts(timeChip.owed, timeChip.paid) : null,
      total: amounts(pot.owed + timeChip.owed, pot.paid + timeChip.paid),
    },
  }
}

/**
 * The night's pot and time chip as they stand: the ones typed by hand ("Definir manualmente") when there are,
 * and else the ones worked out from the players. `timeChip` is null on a site without the time chip. The Main
 * Event pot is the one set by hand, or else the season's share of the pot; null when the season sets none.
 */
export function amountsInUse(dashboard: NightDashboard): { pot: string; timeChip: string | null; total: string; mainEventPot: string | null } {
  const pot = dashboard.manual.pot ?? dashboard.totals.pot.owed
  const timeChip = dashboard.totals.time_chip ? (dashboard.manual.time_chip ?? dashboard.totals.time_chip.owed) : null
  const mainEventPot = dashboard.main_event_pot ?? dashboard.suggested_main_event_pot
  return { pot, timeChip, total: decimal(cents(pot) + cents(timeChip ?? '0')), mainEventPot }
}

const emptyLine = (player: Player): DashboardPlayer => ({
  player,
  is_house_owner: false,
  buy_in: '0.00',
  buy_in_paid: false,
  time_chip: false,
  time_chip_paid: false,
  rebuys: [],
  owed: '0.00',
  paid: '0.00',
  pending: '0.00',
})

/** The players with this one changed. A player who was not on the night joins it, in the order of the names. */
function withPlayer(players: DashboardPlayer[], player: Player, change: (line: DashboardPlayer) => DashboardPlayer = (line) => line): DashboardPlayer[] {
  const found = players.some((line) => line.player.id === player.id)
  return (found ? players : [...players, emptyLine(player)])
    .map((line) => (line.player.id === player.id ? change(line) : line))
    .sort((a, b) => a.player.nickname.localeCompare(b.player.nickname, site.locale, { sensitivity: 'base' }))
}

/**
 * What the dashboard shows right after a tap, before the API answers: the same rules as the API, so the answer
 * changes nothing on screen. A new rebuy has the id 0 until then.
 */
export function applyChange(dashboard: NightDashboard, change: DashboardChange): NightDashboard {
  const { players } = dashboard
  switch (change.type) {
    case 'mark':
      return recalculated({
        ...dashboard,
        players: withPlayer(players, change.player, (line) => {
          // A time chip that is paid is owed, and one that is not owed is not paid.
          const timeChip = change.time_chip ?? (change.time_chip_paid ? true : line.time_chip)
          return {
            ...line,
            buy_in_paid: change.buy_in_paid ?? line.buy_in_paid,
            time_chip: timeChip,
            time_chip_paid: timeChip ? (change.time_chip_paid ?? line.time_chip_paid) : false,
          }
        }),
      })
    case 'addRebuy':
      return recalculated({ ...dashboard, players: withPlayer(players, change.player, (line) => ({ ...line, rebuys: [...line.rebuys, { id: 0, paid: false }] })) })
    case 'markRebuy':
      return recalculated({
        ...dashboard,
        players: withPlayer(players, change.player, (line) => ({ ...line, rebuys: line.rebuys.map((rebuy, i) => (i === change.index ? { ...rebuy, paid: change.paid } : rebuy)) })),
      })
    case 'removeRebuy':
      return recalculated({ ...dashboard, players: withPlayer(players, change.player, (line) => ({ ...line, rebuys: line.rebuys.filter((_, i) => i !== change.index) })) })
    case 'removePlayer':
      return recalculated({
        ...dashboard,
        players: players.filter((line) => line.player.id !== change.player.id),
        house_owner: dashboard.house_owner?.id === change.player.id ? null : dashboard.house_owner,
      })
    case 'houseOwner':
      return recalculated({ ...dashboard, house_owner: change.player, players: change.player ? withPlayer(players, change.player) : players })
    case 'position':
      return recalculated({
        ...dashboard,
        players: change.player ? withPlayer(players, change.player) : players,
        positions: [
          ...dashboard.positions.filter((line) => line.position !== change.position),
          ...(change.player ? [{ position: change.position, player: change.player }] : []),
        ].sort((a, b) => a.position - b.position),
      })
    case 'mainEventPot':
      return { ...dashboard, main_event_pot: change.amount }
    case 'amounts':
      return { ...dashboard, manual: { pot: change.pot, time_chip: dashboard.totals.time_chip ? change.time_chip : null } }
  }
}
