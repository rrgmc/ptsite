import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { players, standings } from '@/mocks/data'
import { StandingsTable } from './StandingsTable'

const meta = {
  component: StandingsTable,
  args: { rows: standings, caption: 'Classificação' },
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof StandingsTable>
export default meta
type Story = StoryObj<typeof meta>

/** Carlão and Dudu share 3rd place: there is no tie-breaker (docs/specs/points-and-standings.md). */
export const WithTie: Story = {}
export const LongNickname: Story = {
  args: { rows: [{ ...standings[0], player: { ...players[0], nickname: 'Zé do Caixão Terceiro da Silva' } }, ...standings.slice(1)] },
}
