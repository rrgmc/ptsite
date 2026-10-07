import type { Meta, StoryObj } from '@storybook/react-vite'
import { RouterStory } from '@/mocks/RouterStory'
import { PeriodSwitch } from './PeriodSwitch'

// "Temporada" or "Geral", on the statistics screen and on a player's page.
const meta = { title: 'Components/PeriodSwitch', parameters: { layout: 'padded' } } satisfies Meta
export default meta

export const Season: StoryObj = {
  render: () => <RouterStory path="/" url="/" element={<PeriodSwitch seasonTo="/statistics" allTimeTo="/statistics/all" allTime={false} />} />,
}

export const AllTime: StoryObj = {
  render: () => <RouterStory path="/" url="/" element={<PeriodSwitch seasonTo="/statistics" allTimeTo="/statistics/all" allTime />} />,
}
