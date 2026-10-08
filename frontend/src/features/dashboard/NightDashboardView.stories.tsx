import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { recalculated } from './dashboardMoney'
import { finishedNightDashboard, finishedNight, nightDashboard, openNight, players, season } from '@/mocks/data'
import { withFeatures } from '@/mocks/withFeatures'
import { NightDashboardView } from './NightDashboardView'

const meta = {
  component: NightDashboardView,
  parameters: { layout: 'fullscreen' },
  args: { night: openNight, dashboard: nightDashboard, percentages: season.percentages ?? [], players, canQuickAdd: true, canFinish: true, onChange: () => {} },
  // The frame the screen has in the site (BareLayout).
  decorators: [(Story) => <MemoryRouter><main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-3"><Story /></main></MemoryRouter>],
} satisfies Meta<typeof NightDashboardView>
export default meta
type Story = StoryObj<typeof meta>

/** The night of the spec's example, at Estela's house: Breno's third rebuy and Dudu's buy-in are pending. */
export const Open: Story = {}

/** The night was just opened: nobody is on it yet. */
export const NoPlayers: Story = {
  args: { dashboard: recalculated({ ...nightDashboard, players: [], positions: [], house_owner: null, suggested_main_event_pot: null }) },
}

/** An inactive player, or an account with no player, sees the dashboard and changes nothing. */
export const ReadOnly: Story = { args: { dashboard: { ...nightDashboard, can_edit: false }, canFinish: false, canQuickAdd: false } }

/** A night that does not record every payment: the pot and the Main Event pot are set by hand, and the time chip is still worked out. */
export const AmountsSetByHand: Story = { args: { dashboard: { ...nightDashboard, manual: { pot: '600.00', time_chip: null }, main_event_pot: '100.00', suggested_main_event_pot: '120.00' } } }

/** The API refused the last tap. */
export const ChangeRefused: Story = { args: { error: 'O limite é de 2 rebuys por jogador.' } }

/** A finished night, as a player sees it: the amounts it was finished with, and no positions. */
export const Finished: Story = { args: { night: finishedNight, dashboard: finishedNightDashboard, canFinish: false } }

/** A finished night, as an admin sees it: the payments can still be corrected. */
export const FinishedAsAdmin: Story = { args: { night: finishedNight, dashboard: { ...finishedNightDashboard, can_edit: true } } }

/** A season that takes no rebuy past its limit, and has no share of the pot for the Main Event. */
export const RebuysAtTheLimit: Story = {
  args: { dashboard: { ...nightDashboard, prices: { ...nightDashboard.prices, allows_extra_rebuys: false }, suggested_main_event_pot: null } },
}

export const LongNicknameAndManyRebuys: Story = {
  args: {
    dashboard: recalculated({
      ...nightDashboard,
      players: nightDashboard.players.map((line, i) =>
        i === 1
          ? { ...line, player: { ...line.player, nickname: 'Breno Augusto dos Santos Albuquerque de Oliveira' }, time_chip: true, rebuys: Array.from({ length: 7 }, (_, n) => ({ id: n + 10, paid: n < 4 })) }
          : line,
      ),
    }),
  },
}

/** A site with no time chip and no Main Event pot: the pot and the total alone. */
export const PotOnly: Story = {
  decorators: [withFeatures({ timeChip: false, mainEventPot: false })],
  args: { dashboard: recalculated({ ...nightDashboard, totals: { ...nightDashboard.totals, time_chip: null }, suggested_main_event_pot: null }) },
}
