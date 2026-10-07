import type { Meta, StoryObj } from '@storybook/react-vite'
import { RouterStory } from '@/mocks/RouterStory'
import { ViewSwitch } from './ViewSwitch'

// A choice between ways to show one page: "Lista" or "Detalhado" on the players page.
const meta = { title: 'Components/ViewSwitch', parameters: { layout: 'padded' } } satisfies Meta
export default meta

const options = (detailed: boolean) => [
  { label: 'Lista', to: '/players', current: !detailed },
  { label: 'Detalhado', to: '/players?view=detailed', current: detailed },
]

export const First: StoryObj = {
  render: () => <RouterStory path="/" url="/" element={<ViewSwitch label="Modo de exibição" options={options(false)} />} />,
}

export const Second: StoryObj = {
  render: () => <RouterStory path="/" url="/" element={<ViewSwitch label="Modo de exibição" options={options(true)} />} />,
}
