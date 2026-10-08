import type { Meta, StoryObj } from '@storybook/react-vite'
import { FoldPanel } from './FoldPanel'

// A titled box that folds, used to group the statistics lists.
const meta = {
  title: 'Components/FoldPanel',
  component: FoldPanel,
  parameters: { layout: 'padded' },
  args: { title: 'Jogadores', children: <p>Pontuação Total e Eventos Pontuando.</p> },
} satisfies Meta<typeof FoldPanel>
export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {}

/** Only the title shows until it is pressed. */
export const Folded: Story = { args: { defaultOpen: false } }
