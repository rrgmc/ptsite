import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { setSelectedSeasonId } from '@/lib/selectedSeason'
import { seasons, seasonsTopStandings } from '@/mocks/data'
import { handlers } from '@/mocks/handlers'
import { RouterStory } from '@/mocks/RouterStory'
import { SeasonsPage } from './SeasonsPage'

// "Temporadas", from the menu: every season with the first ten of its standings.
const meta = { title: 'Screens/Seasons', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

const screen = () => <RouterStory path="/seasons" url="/seasons" element={<SeasonsPage />} />

/** No pick: the current season is the selected one. The last season has no finished night. */
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
      http.get('/api/v1/seasons/top-standings', () => HttpResponse.json({ data: [] })),
      http.get('/api/v1/seasons/current', () => HttpResponse.json({ message: 'Nenhuma temporada aberta.' }, { status: 404 })),
      ...handlers,
    ],
  },
  render: screen,
}

/** An old season known only by its final standings: "Só totais", and its rounds as its nights (docs/specs/season-totals.md). */
export const TotalsOnlySeason: StoryObj = {
  parameters: {
    msw: [
      http.get('/api/v1/seasons/top-standings', () =>
        HttpResponse.json({
          data: [
            ...seasonsTopStandings.slice(0, 3),
            { ...seasonsTopStandings[2], season: { ...seasons[2], id: 5, name: 'Liga 2009', starts_on: '2009-01-01', rounds: 23, nights_count: 0, totals_only: true }, main_event_champion: null },
          ],
        }),
      ),
      ...handlers,
    ],
  },
  render: screen,
}
