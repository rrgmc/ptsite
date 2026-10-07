import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { emptyPartialResult, partialResult, players, season } from '@/mocks/data'
import { withFeatures } from '@/mocks/withFeatures'
import { PartialResultCard } from './PartialResultCard'

const percentages = season.percentages ?? []

const meta = {
  component: PartialResultCard,
  args: { nightId: 11, percentages, canSave: true, partial: partialResult },
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof PartialResultCard>
export default meta
type Story = StoryObj<typeof meta>

/** Nobody recorded anything yet. */
export const Empty: Story = { args: { partial: emptyPartialResult } }
/** The pot, the time chip and the two players already out. */
export const Partial: Story = {}
export const Complete: Story = {
  args: {
    partial: { ...partialResult, main_event_pot: '170.00', positions: percentages.map(({ position }, i) => ({ position, player: players[i] })) },
  },
}
/** An inactive player, or an account with no player, sees it without the button. */
export const ReadOnly: Story = { args: { canSave: false } }
export const LongNickname: Story = {
  args: {
    partial: { ...partialResult, positions: [{ position: 6, player: { ...players[4], nickname: 'Estela Maria dos Santos Albuquerque de Oliveira' } }] },
  },
}
/** A site with no Main Event pot and no time chip shows the pot alone. */
export const PotOnly: Story = { decorators: [withFeatures({ mainEventPot: false, timeChip: false })] }
