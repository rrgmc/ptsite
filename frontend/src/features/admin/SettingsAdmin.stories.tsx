import type { Meta, StoryObj } from '@storybook/react-vite'
import { withFeatures } from '@/mocks/withFeatures'
import { SettingsAdmin } from './SettingsAdmin'

// "Configurações" (admins): the site's features and its version, to read only.
const meta = { title: 'Admin/Settings', component: SettingsAdmin, args: { version: 'v3.0.0+ptsite.v1.8.0' } } satisfies Meta<typeof SettingsAdmin>
export default meta

/** A site with every feature, built from a release of its own on a release of the core. */
export const Default: StoryObj<typeof meta> = {}

/** A site that turned two features off. */
export const SomeFeaturesOff: StoryObj<typeof meta> = { decorators: [withFeatures({ timeChip: false, mainEvent: false })] }

/** The core's own build has one version. */
export const CoreOnly: StoryObj<typeof meta> = { args: { version: 'v1.8.0-3-gabc1234' } }
