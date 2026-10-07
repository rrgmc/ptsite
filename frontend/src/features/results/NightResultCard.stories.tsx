import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { finishedNight } from '@/mocks/data'
import { NightResultCard } from './NightResultCard'

const meta = {
  component: NightResultCard,
  args: { night: finishedNight },
  decorators: [(Story) => <MemoryRouter><div className="max-w-sm"><Story /></div></MemoryRouter>],
} satisfies Meta<typeof NightResultCard>
export default meta

export const Finished: StoryObj<typeof meta> = {}

/** On "Resultados" the title has the night's number in the season. */
export const Numbered: StoryObj<typeof meta> = { args: { number: 3 } }
