import type { Meta, StoryObj } from '@storybook/react-vite'
import { holidayCalendar2027, seasonCalendar, season } from '@/mocks/data'
import { RouterStory } from '@/mocks/RouterStory'
import { CalendarPage, SeasonCalendar } from './CalendarPage'

// "Calendário": the season's nights on month calendars, with winners and the Fridays left out for holidays.
const meta = { title: 'Screens/Calendar', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

export const Screen: StoryObj = { render: () => <RouterStory path="/calendar" url="/calendar" element={<CalendarPage />} /> }

/** A finished season: winners on every night, nothing coming. */
export const FinishedSeason: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <RouterStory path="/" url="/" element={
      <SeasonCalendar season={{ ...season, starts_on: '2027-01-01', is_finished: true }} entries={seasonCalendar.filter((e) => !e.night || e.night.status === 'finished').slice(0, 5)} holidays={holidayCalendar2027} />
    } />
  ),
}

/** Today (10/03/2027) is ringed and in the legend, and March is tinted; the next night, 12/03, keeps its outline. The page starts at March, with a link to the complete calendar. */
export const Today: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <RouterStory path="/" url="/" element={
      <SeasonCalendar season={{ ...season, starts_on: '2027-01-01' }} entries={seasonCalendar} holidays={holidayCalendar2027} today="2027-03-10" />
    } />
  ),
}

/** The complete calendar, from January: "Ver no calendário" goes to March, and a link goes back to the page from March. */
export const WholeSeason: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <RouterStory path="/" url="/" element={
      <SeasonCalendar season={{ ...season, starts_on: '2027-01-01' }} entries={seasonCalendar} holidays={holidayCalendar2027} today="2027-03-10" showAll />
    } />
  ),
}

/** Nothing is coming: on the complete calendar, "Ir para hoje" goes to today's month (February). */
export const TodayWithNoNextNight: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <RouterStory path="/" url="/" element={
      <SeasonCalendar season={{ ...season, starts_on: '2027-01-01' }} entries={seasonCalendar.filter((e) => !e.night || e.night.status === 'finished')} holidays={holidayCalendar2027} today="2027-02-20" showAll />
    } />
  ),
}

export const Empty: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => <RouterStory path="/" url="/" element={<SeasonCalendar season={season} entries={[]} />} />,
}
