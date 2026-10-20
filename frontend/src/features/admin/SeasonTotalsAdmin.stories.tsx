import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { handlers } from '@/mocks/handlers'
import { seasons, standings } from '@/mocks/data'
import { RouterStory } from '@/mocks/RouterStory'
import { SeasonTotalsAdmin } from './SeasonTotalsAdmin'

// "Resultado final" (admins): the final standings of a season known only by them (docs/specs/season-totals.md).
const meta = { title: 'Admin/Season totals', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

const old = { ...seasons[2], id: 9, name: 'Liga 2009', rounds: 3, nights_planned: 0, nights_count: 0, totals_only: true }
const screen = () => <RouterStory path="/admin/seasons/:seasonId/totals" url="/admin/seasons/9/totals" element={<SeasonTotalsAdmin />} />

/** The saved lines, read back from the standings. The 1st places add up to more than the rounds, and are marked. */
export const Saved: StoryObj = {
  parameters: {
    msw: [
      http.get('/api/v1/seasons', () => HttpResponse.json({ data: [...seasons, old] })),
      http.get('/api/v1/seasons/9/standings', () => HttpResponse.json({ data: standings })),
      http.put('/api/v1/seasons/9/totals', () => HttpResponse.json({ data: standings })),
      ...handlers,
    ],
  },
  render: screen,
}

/** A new season with no night and no line yet. */
export const Empty: StoryObj = {
  parameters: {
    msw: [
      http.get('/api/v1/seasons', () => HttpResponse.json({ data: [...seasons, { ...old, totals_only: false }] })),
      http.get('/api/v1/seasons/9/standings', () => HttpResponse.json({ data: [] })),
      ...handlers,
    ],
  },
  render: screen,
}
