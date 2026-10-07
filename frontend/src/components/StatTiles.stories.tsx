import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatTiles } from './StatTiles'

// A few numbers with their labels, at the top of a player's statistics.
const meta = { title: 'Components/StatTiles', component: StatTiles, parameters: { layout: 'padded' } } satisfies Meta<typeof StatTiles>
export default meta
type Story = StoryObj<typeof meta>

export const Player: Story = {
  args: {
    tiles: [
      { label: 'Posição', value: '1º' },
      { label: 'Pontos', value: '986,30' },
      { label: 'Eventos pontuando', value: 4 },
      { label: 'Vitórias', value: 2 },
    ],
  },
}

/** No position, and a large total. */
export const NoRankAndLargeNumber: Story = {
  args: {
    tiles: [
      { label: 'Posição geral', value: '—' },
      { label: 'Pontos', value: '110.966,40' },
      { label: 'Eventos pontuando', value: 0 },
      { label: 'Vitórias', value: 0 },
    ],
  },
}
