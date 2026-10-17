import type { Meta, StoryObj } from '@storybook/react-vite'
import { finishedNightDashboard } from '@/mocks/data'
import { withFeatures } from '@/mocks/withFeatures'
import { DashboardPlayersCard } from './DashboardPlayersCard'

const meta = {
  component: DashboardPlayersCard,
  args: { dashboard: finishedNightDashboard },
  decorators: [(Story) => <div className="max-w-md"><Story /></div>],
} satisfies Meta<typeof DashboardPlayersCard>
export default meta

/** A finished night's players on its page: what each one paid, and Breno's last rebuy still unpaid. */
export const Finished: StoryObj<typeof meta> = {}

/** Payments that were not in cash have a sign of their own. */
export const NonCash: StoryObj<typeof meta> = {
  args: {
    dashboard: {
      ...finishedNightDashboard,
      players: finishedNightDashboard.players.map((line, i) => (i === 0 ? { ...line, buy_in_non_cash: true, rebuys: line.rebuys.map((r) => ({ ...r, non_cash: true })) } : line)),
    },
  },
}

/** A site with no time chip shows no time chip marks. */
export const NoTimeChip: StoryObj<typeof meta> = {
  args: { dashboard: { ...finishedNightDashboard, totals: { ...finishedNightDashboard.totals, time_chip: null } } },
  decorators: [withFeatures({ timeChip: false })],
}
