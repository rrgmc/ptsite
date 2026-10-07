import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { setSelectedSeasonId } from '@/lib/selectedSeason'
import { handlers } from '@/mocks/handlers'
import { RouterStory } from '@/mocks/RouterStory'
import { SeasonPickerPage } from './SeasonPickerPage'

// "Escolher temporada": the season list. Picking a season makes it the one that every screen shows.
const meta = { title: 'Screens/SeasonPicker', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

const screen = () => <RouterStory path="/seasons/select" url="/seasons/select" element={<SeasonPickerPage />} />

/** No pick: the current season is the selected one. */
export const Default: StoryObj = { render: screen }

export const AnotherSeasonSelected: StoryObj = {
  beforeEach: () => {
    setSelectedSeasonId(2)
    return () => setSelectedSeasonId(null)
  },
  render: screen,
}

export const Empty: StoryObj = {
  parameters: {
    msw: [
      http.get('/api/v1/seasons', () => HttpResponse.json({ data: [] })),
      http.get('/api/v1/seasons/current', () => HttpResponse.json({ message: 'Nenhuma temporada aberta.' }, { status: 404 })),
      ...handlers,
    ],
  },
  render: screen,
}
