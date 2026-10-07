import type { Meta, StoryObj } from '@storybook/react-vite'
import { HolidaysAdmin } from './HolidaysAdmin'

// "Feriados" (admins): the year's holidays, with Corpus Christi cancelled for 2027 and one extra holiday, and the
// table they come from.
const meta = { title: 'Admin/Holidays', component: HolidaysAdmin, args: { initialYear: 2027 } } satisfies Meta<typeof HolidaysAdmin>
export default meta

export const Default: StoryObj<typeof meta> = {}
