import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { mainEventNight } from '@/mocks/data'
import { MainEventResultCard } from './MainEventResultCard'

const meta = {
  component: MainEventResultCard,
  args: { night: mainEventNight },
  decorators: [(Story) => <MemoryRouter><div className="max-w-sm"><Story /></div></MemoryRouter>],
} satisfies Meta<typeof MainEventResultCard>
export default meta

/** A finished Main Event: its players in finishing order, with no pot and no points. */
export const Finished: StoryObj<typeof meta> = {}

/** An old Main Event of which only the champion is known. */
export const ChampionOnly: StoryObj<typeof meta> = {
  args: { night: { ...mainEventNight, main_event_positions: mainEventNight.main_event_positions!.slice(0, 1) } },
}
