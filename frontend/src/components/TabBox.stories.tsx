import type { Meta, StoryObj } from '@storybook/react-vite'
import { TabBox } from './TabBox'

// A box with tabs, used to group the statistics lists.
const meta = {
  title: 'Components/TabBox',
  component: TabBox,
  parameters: { layout: 'padded' },
  args: {
    label: 'Seções',
    tabs: [
      { id: 'players', title: 'Jogadores', content: <p>Pontuação Total e Eventos Pontuando.</p> },
      { id: 'nights', title: 'Eventos', content: <p>Pote por evento, Maiores Potes e Locais.</p> },
      { id: 'positions', title: 'Posições', content: <p>Posições e Vitórias.</p> },
    ],
  },
} satisfies Meta<typeof TabBox>
export default meta

type Story = StoryObj<typeof meta>

/** The first tab shows at first. */
export const FirstTab: Story = {}

/** On a narrow screen the titles scroll sideways. */
export const Narrow: Story = {
  decorators: [(Story) => <div className="max-w-48"><Story /></div>],
}
