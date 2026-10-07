import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { statistics, statisticsEmpty } from '@/mocks/data'
import { RouterStory } from '@/mocks/RouterStory'
import { PointsProgressChart, WinsChart } from './StatisticsCharts'
import { AllTimeStatisticsPage, StatisticsPage, StatisticsView } from './StatisticsPage'

// "Estatísticas": top ten lists and two charts, for the selected season ("Temporada") or every season ("Geral").
const meta = { title: 'Screens/Statistics', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

export const Season: StoryObj = { render: () => <RouterStory path="/statistics" url="/statistics" element={<StatisticsPage />} /> }

/** One step per season on the line chart, the season under each pot, and "Outros" on the bar chart. */
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
