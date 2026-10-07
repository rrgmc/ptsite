import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { openNight } from '@/mocks/data'
import { AttendanceBanner } from './AttendanceBanner'

// Shown above "Classificação" and "Resultados" while a night is open. It links to the night's page, so it needs a
// router.
const meta = {
  title: 'Attendance/Banner',
  component: AttendanceBanner,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: { night: openNight, answer: null, onAnswer: () => {} },
} satisfies Meta<typeof AttendanceBanner>
export default meta
type Story = StoryObj<typeof meta>

/** A player who has not answered yet. */
export const NotAnswered: Story = {}
/** A player who answered ALL IN. */
export const AllIn: Story = { args: { answer: 'all_in' } }
/** A player who answered FOLD. */
export const Fold: Story = { args: { answer: 'fold' } }
/** The API refused the answer. */
export const WithError: Story = { args: { error: 'As confirmações deste evento estão encerradas.' } }
/** A night with no place yet. */
export const WithoutPlace: Story = { args: { night: { ...openNight, place: null } } }
/** A long place name wraps, and the buttons move below it. */
export const LongPlaceName: Story = {
  args: { night: { ...openNight, place: { ...openNight.place!, name: 'Salão de festas do Condomínio Residencial Jardim das Acácias Imperiais' } } },
}
