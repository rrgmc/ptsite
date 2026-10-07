import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { handlers } from '@/mocks/handlers'
import { holidayCalendar2027, nightPlan, season } from '@/mocks/data'
import { RouterStory } from '@/mocks/RouterStory'
import { PlanCalendar, SeasonPlanner } from './SeasonPlanner'

// "Planejar datas" (admins): the season's Fridays for 2027 on month calendars, with Carnival, Sexta-feira Santa and
// the Corpus Christi emenda left out.
const meta = { title: 'Admin/Season planner', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

// The day is fixed, to match the mocked plan (2027). With the real day, the months on screen changed from one day to
// the next.
export const Screen: StoryObj = {
  render: () => <RouterStory path="/admin/seasons/:seasonId/plan" url="/admin/seasons/1/plan" element={<SeasonPlanner today="2027-01-04" />} />,
}

/** January to June: ticked Fridays, the ones left out, one already scheduled and the holidays. */
export const WithSkips: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <RouterStory path="/" url="/" element={
      <PlanCalendar season={season} from="2027-01-04" to="2027-06-30" dates={nightPlan} holidays={holidayCalendar2027} onScheduled={() => {}} />
    } />
  ),
}

/** Today (10/03/2027) is ringed and in the legend, and March is tinted. */
export const Today: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <RouterStory path="/" url="/" element={
      <PlanCalendar season={season} from="2027-01-04" to="2027-06-30" dates={nightPlan} holidays={holidayCalendar2027} onScheduled={() => {}} today="2027-03-10" />
    } />
  ),
}

/** The plan goes past the season's rounds: a warning, but scheduling is still allowed. */
export const OverTheRounds: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <RouterStory path="/" url="/" element={
      <PlanCalendar season={{ ...season, rounds: 26, nights_planned: 20 }} from="2027-01-04" to="2027-06-30" dates={nightPlan} holidays={[]} onScheduled={() => {}} />
    } />
  ),
}

export const EmptyRange: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <RouterStory path="/" url="/" element={
      <PlanCalendar season={season} from="2027-01-04" to="2027-01-06" dates={[]} holidays={[]} onScheduled={() => {}} />
    } />
  ),
}

/** The API refuses the range (the end before the start). */
export const RangeError: StoryObj = {
  parameters: {
    msw: [
      http.get('/api/v1/seasons/:id/night-plan', () =>
        HttpResponse.json({ message: 'A data final deve ser depois da data inicial.', rule: 'plan.range', errors: { to: ['A data final deve ser depois da data inicial.'] } }, { status: 422 }),
      ),
      ...handlers,
    ],
  },
  render: () => <RouterStory path="/admin/seasons/:seasonId/plan" url="/admin/seasons/1/plan" element={<SeasonPlanner />} />,
}
