import type { Meta, StoryObj } from '@storybook/react-vite'
import { RouterStory } from '@/mocks/RouterStory'
import { type GridDay, GridLegend, MonthGrid } from './MonthGrid'

// One month of the calendar and of the planner. These stories show the square of today on every kind of day, and the tinted box of today's month.
const meta = { title: 'Components/MonthGrid', parameters: { layout: 'padded' } } satisfies Meta
export default meta

const days: Record<string, GridDay> = {
  '2027-03-05': { tone: 'finished', label: '🏆 Ana · R$ 840,00', href: '/nights/1' },
  '2027-03-12': { tone: 'night', label: '21:30 · Casa do Ana', href: '/nights/2', highlight: true },
  '2027-03-17': { tone: 'planned', label: 'Evento extra, marcado', onToggle: () => {} },
  '2027-03-19': { tone: 'candidate', label: 'Evento habitual', onToggle: () => {} },
  '2027-03-25': { tone: 'holiday', label: 'Feriado: Quinta-feira Santa' },
  '2027-03-26': { tone: 'skipped', label: 'Sem evento · Feriado: Sexta-feira Santa' },
}

function Grid({ today }: { today: string }) {
  return (
    <RouterStory path="/" url="/" element={
      <div className="flex max-w-sm flex-col gap-3">
        <GridLegend today items={[{ tone: 'night', label: 'Evento' }, { tone: 'holiday', label: 'Feriado' }]} />
        <MonthGrid month="2027-03" days={days} today={today} isDisabled={(d) => d < '2027-03-03'} />
      </div>
    } />
  )
}

export const TodayOnAPlainDay: StoryObj = { render: () => <Grid today="2027-03-10" /> }
export const TodayIsTheNextNight: StoryObj = { render: () => <Grid today="2027-03-12" /> }
export const TodayOnAFinishedNight: StoryObj = { render: () => <Grid today="2027-03-05" /> }
export const TodayOnATickedDay: StoryObj = { render: () => <Grid today="2027-03-17" /> }
export const TodayOnAnUntickedDay: StoryObj = { render: () => <Grid today="2027-03-19" /> }
export const TodayOnAHoliday: StoryObj = { render: () => <Grid today="2027-03-25" /> }
export const TodayOnADayLeftOut: StoryObj = { render: () => <Grid today="2027-03-26" /> }
export const TodayOutsideTheRange: StoryObj = { render: () => <Grid today="2027-03-01" /> }
/** Today is in another month: no day is a square and the box is not tinted. */
export const TodayInAnotherMonth: StoryObj = { render: () => <Grid today="2027-04-10" /> }
