import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { players } from '@/mocks/data'
import { type Order, withEmptyRow } from './order'
import { PlayerOrderFields } from './PlayerOrderFields'

const meta = { component: PlayerOrderFields } satisfies Meta<typeof PlayerOrderFields>
export default meta

function Fields({ initial }: { initial: Order }) {
  const [order, setOrder] = useState(() => withEmptyRow(initial))
  return <div className="max-w-xl"><PlayerOrderFields players={players} order={order} onChange={setOrder} /></div>
}

/** Nobody chosen yet: one picker, for the 1st place. */
export const Empty: StoryObj = { render: () => <Fields initial={[]} /> }

/** Three players chosen, and the picker for the 4th place. Removing one moves the ones below up. */
export const Filled: StoryObj = { render: () => <Fields initial={players.slice(0, 3)} /> }
