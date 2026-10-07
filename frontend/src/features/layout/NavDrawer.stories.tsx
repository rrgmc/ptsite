import type { Meta, StoryObj } from '@storybook/react-vite'
import { RouterStory } from '@/mocks/RouterStory'
import { NavDrawer } from './NavDrawer'
import { navItemsFor } from './navigation'

// The left menu, open. It lists every place of the site; the bottom bar and the top bar show only some of them.
const meta = { title: 'Layout/Menu', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

export const Player: StoryObj = {
  render: () => <RouterStory path="/" url="/" element={<NavDrawer items={navItemsFor('player')} userName="Ana" onLogout={() => {}} defaultOpen />} />,
}

/** Admins also get "Administração". */
export const Admin: StoryObj = {
  render: () => <RouterStory path="/" url="/" element={<NavDrawer items={navItemsFor('admin')} userName="Breno" onLogout={() => {}} defaultOpen />} />,
}

export const Closed: StoryObj = {
  render: () => <RouterStory path="/" url="/" element={<NavDrawer items={navItemsFor('player')} userName="Ana" onLogout={() => {}} />} />,
}
