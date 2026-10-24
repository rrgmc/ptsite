import type { Meta, StoryObj } from '@storybook/react-vite'
import { recaps } from '@/mocks/data'
import { SeasonRecapCard } from './SeasonRecapCard'

// "Crônica da temporada", below the standings on a site with recaps (docs/specs/season-recaps.md).
const meta = { title: 'Screens/Standings/SeasonRecapCard', component: SeasonRecapCard, parameters: { layout: 'padded' } } satisfies Meta<typeof SeasonRecapCard>
export default meta
type Story = StoryObj<typeof meta>

/** The recap after the latest night, with an older one behind "Crônicas anteriores". */
export const WithOlder: Story = { args: { recaps } }

/** Only one recap, about no single night: no date and no button. */
export const OnlyOne: Story = { args: { recaps: [recaps[1]] } }

/** What a writer or an admin sees of a draft. */
export const Draft: Story = { args: { recaps: [{ ...recaps[0], published: false, published_at: null }] } }
