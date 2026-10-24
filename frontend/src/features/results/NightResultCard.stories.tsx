import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { extraNight, finishedNight } from '@/mocks/data'
import { withFeatures } from '@/mocks/withFeatures'
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

/** The small card beside a recap on "Crônicas", the same size on every screen. */
export const Compact: StoryObj<typeof meta> = { args: { number: 3, compact: true } }

/** An extra night, such as a parallel table: it has no number and is marked. */
export const Extra: StoryObj<typeof meta> = { args: { night: extraNight } }

/** On a finished night's page with a dashboard: how many rebuys and late arrivals it had. */
export const WithCounts: StoryObj<typeof meta> = { args: { counts: { rebuys: 4, lateArrivals: 1 } } }

/** A site with no Main Event pot and no time chip shows the pot alone. */
export const PotOnly: StoryObj<typeof meta> = { decorators: [withFeatures({ mainEventPot: false, timeChip: false })] }
