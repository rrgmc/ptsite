import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { statistics, statisticsEmpty } from '@/mocks/data'
import { RouterStory } from '@/mocks/RouterStory'
import { PositionTable } from './PositionTable'
import { PlacesChart, PointsProgressChart, PotsChart, WinsChart } from './StatisticsCharts'
import { AllTimeStatisticsPage, StatisticsPage, StatisticsView } from './StatisticsPage'

// "Estatísticas": the totals, the charts and the top ten lists in boxes that fold, for the selected season
// ("Temporada") or every season ("Geral").
const meta = { title: 'Screens/Statistics', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

export const Season: StoryObj = { render: () => <RouterStory path="/statistics" url="/statistics" element={<StatisticsPage />} /> }

/** One step per season on the line charts, the season under each pot, "Outros" on the bar chart, and the Main Event lists. */
export const AllTime: StoryObj = { render: () => <RouterStory path="/statistics/all" url="/statistics/all" element={<AllTimeStatisticsPage />} /> }

export const NoFinishedNight: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => <RouterStory path="/" url="/" element={<StatisticsView statistics={statisticsEmpty} />} />,
}

export const Failed: StoryObj = {
  parameters: { msw: { handlers: [http.get('/api/v1/statistics', () => HttpResponse.json({ message: 'Erro no servidor.' }, { status: 500 }))] } },
  render: () => <RouterStory path="/statistics/all" url="/statistics/all" element={<AllTimeStatisticsPage />} />,
}

/** A season with one finished night: a single point per player. */
export const OneNight: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <PointsProgressChart
      perSeason={false}
      progress={{ steps: statistics.points_progress.steps.slice(0, 1), series: statistics.points_progress.series.map((s) => ({ ...s, points: s.points.slice(0, 1) })) }}
    />
  ),
}

/** One player won every night. */
export const OneWinner: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => <WinsChart statistics={{ ...statistics, positions: [{ ...statistics.positions[0], rows: statistics.positions[0].rows.slice(0, 1) }] }} />,
}

/** The pot of each night of a season. */
export const Pots: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => <PotsChart perSeason={false} progress={statistics.points_progress} />,
}

/** More places than the pie has colors: the ones after the seventh are one slice, "Outros". */
export const ManyPlaces: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <PlacesChart
      places={{
        ...statistics.places,
        rows: Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, player: null, night: null, place: { id: i + 1, name: `Casa ${i + 1}` }, count: 20 - 2 * i, amount: null })),
      }}
    />
  ),
}

/** "Posições": twelve players, the first ten shown, with "Ver todos" for the rest. */
export const Positions: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => <RouterStory path="/" url="/" element={<PositionTable rows={statistics.position_table} />} />,
}
