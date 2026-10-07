import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { Player } from '@/api/client'
import { players } from '@/mocks/data'
import { PlayerPicker } from './PlayerPicker'

function Picker(props: { initial?: Player | null; allowQuickAdd?: boolean; clearable?: boolean; errorMessage?: string; excludeIds?: number[] }) {
  const [value, setValue] = useState<Player | null>(props.initial ?? null)
  return (
    <PlayerPicker
      label="1º lugar · 38%"
      players={players}
      value={value}
      onChange={setValue}
      allowQuickAdd={props.allowQuickAdd}
      clearable={props.clearable}
      errorMessage={props.errorMessage}
      excludeIds={props.excludeIds}
    />
  )
}

const meta = { component: Picker } satisfies Meta<typeof Picker>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Chosen: Story = { args: { initial: players[0] } }
/** Results keepers and admins can add a first-timer: type a new nickname in the search. */
export const WithQuickAdd: Story = { args: { allowQuickAdd: true } }
export const WithError: Story = { args: { initial: players[0], errorMessage: 'Este jogador já está na 1ª posição.' } }
/** Players already placed in other positions are hidden. */
export const SomeAlreadyPlaced: Story = { args: { excludeIds: [1, 2, 3] } }
/** Where a position may stay empty (the partial result), the list starts with "Deixar em branco". */
export const Clearable: Story = { args: { initial: players[0], clearable: true } }
