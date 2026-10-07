import type { Meta, StoryObj } from '@storybook/react-vite'
import { SiteFooter } from './SiteFooter'

const meta = { title: 'Layout/Footer', component: SiteFooter } satisfies Meta<typeof SiteFooter>
export default meta

export const Release: StoryObj<typeof meta> = { args: { version: 'v2.1.0' } }
export const BetweenReleases: StoryObj<typeof meta> = { args: { version: 'v2.1.0-3-gabc1234-dirty' } }
