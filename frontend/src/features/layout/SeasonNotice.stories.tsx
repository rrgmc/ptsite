import type { Meta, StoryObj } from '@storybook/react-vite'
import { seasons } from '@/mocks/data'
import { SeasonNotice } from './SeasonNotice'

// Shown above a season screen while a season other than the current one is selected.
const meta = { title: 'Layout/Season notice', component: SeasonNotice } satisfies Meta<typeof SeasonNotice>
export default meta

export const Default: StoryObj<typeof meta> = { args: { season: seasons[1], onBack: () => {} } }
