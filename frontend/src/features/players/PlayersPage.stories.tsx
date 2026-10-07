import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { players } from '@/mocks/data'
import { handlers } from '@/mocks/handlers'
import { RouterStory } from '@/mocks/RouterStory'
import { PlayersPage } from './PlayersPage'

// The players page: everyone in a list ("Lista"), or the photo and memo of the players who have a memo ("Detalhado").
const meta = { title: 'Screens/Players', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

const page = (url: string) => <RouterStory path="/players" url={url} element={<PlayersPage />} />

export const List: StoryObj = { render: () => page('/players') }

/** Ana has a photo, Carlão only a thumbnail, and Lia, who is inactive, no image. The other players have no memo. */
export const Detailed: StoryObj = { render: () => page('/players?view=detailed') }

export const DetailedEmpty: StoryObj = {
  parameters: {
    msw: [http.get('/api/v1/players', () => HttpResponse.json({ data: players.map((p) => ({ ...p, memo: null })) })), ...handlers],
  },
  render: () => page('/players?view=detailed'),
}
