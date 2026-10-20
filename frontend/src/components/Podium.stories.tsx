import type { Meta, StoryObj } from '@storybook/react-vite'
import { players, standings } from '@/mocks/data'
import { RouterStory } from '@/mocks/RouterStory'
import { Podium } from './Podium'

// The first three of a result, with a medal each: "Campeonato" and the Main Event, above the standings.
const meta = { title: 'Components/Podium', parameters: { layout: 'padded' } } satisfies Meta
export default meta

/** Two players share the 3rd place, so the box shows four. */
export const SharedThirdPlace: StoryObj = {
  render: () => <RouterStory path="/" url="/" element={<Podium title="Campeonato" caption="Classificação final: Liga 2026" lines={standings} />} />,
}

/** Two season champions, who share the 1st place. */
export const SharedFirstPlace: StoryObj = {
  render: () => (
    <RouterStory
      path="/"
      url="/"
      element={<Podium title="Campeonato" caption="Classificação final: Liga 2025" lines={[{ rank: 1, player: players[0] }, { rank: 1, player: players[1] }, { rank: 3, player: players[2] }]} />}
    />
  ),
}

/** An old Main Event of which only the champion is known. */
export const OnlyTheChampion: StoryObj = {
  render: () => <RouterStory path="/" url="/" element={<Podium title="Main Event" caption="Classificação: Main Event" lines={[{ rank: 1, player: players[2] }]} />} />,
}
