import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { players, standings, topTen } from '@/mocks/data'
import { SeasonTopTen } from './SeasonTopTen'

// The first ten of a season: one list on a phone, two columns from a tablet up.
const meta = {
  component: SeasonTopTen,
  parameters: { layout: 'padded' },
  args: { rows: topTen, caption: 'Os dez primeiros de Liga 2025' },
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof SeasonTopTen>
export default meta
type Story = StoryObj<typeof meta>

export const TenPlayers: Story = {}

/** The tenth place is shared with players who did not fit. */
export const CutTie: Story = { args: { tiedNotShown: 2 } }

/** Carlão and Dudu share 3rd place: there is no tie-breaker (docs/specs/points-and-standings.md). */
export const FewerThanTen: Story = { args: { rows: standings } }

export const LongNickname: Story = {
  args: { rows: [{ ...topTen[0], player: { ...players[0], nickname: 'Zé do Caixão Terceiro da Silva' } }, ...topTen.slice(1)] },
}
