import type { Meta, StoryObj } from '@storybook/react-vite'
import { players } from '@/mocks/data'
import { RouterStory } from '@/mocks/RouterStory'
import { PlayerLink } from './PlayerLink'

// A nickname that leads to the player's page.
const meta = { title: 'Components/PlayerLink', parameters: { layout: 'padded' } } satisfies Meta
export default meta

export const Nickname: StoryObj = { render: () => <RouterStory path="/" url="/" element={<PlayerLink player={players[0]} />} /> }

/** Inside a sentence the link is underlined, so it does not depend on color alone. */
export const InText: StoryObj = {
  render: () => (
    <RouterStory path="/" url="/" element={<p><PlayerLink player={players[2]} className="underline" /> <span className="text-sm text-muted">· por Maria</span></p>} />
  ),
}

export const LongNickname: StoryObj = {
  render: () => (
    <RouterStory path="/" url="/" element={<div className="w-40"><PlayerLink player={{ id: 1, nickname: 'Carlãozinho-do-churrasco-de-domingo' }} /></div>} />
  ),
}
