import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import type { Attendance, Player } from '@/api/client'
import { attendances, players } from '@/mocks/data'
import { type Answer, AttendancePanel } from './AttendancePanel'

/** A stateful panel: answering updates the lists, as the real API does. */
function Panel(props: { initial: Attendance[]; myPlayerId: number | null; isOpen: boolean; notOpenYet?: boolean; canAnswerForOthers: boolean; error?: string }) {
  const [rows, setRows] = useState(props.initial)
  const answer = (target: Player, value: Answer | null) => {
    const playerId = target.id
    const others = rows.filter((a) => a.player.id !== playerId)
    const current = rows.find((a) => a.player.id === playerId)
    if (value === null) return setRows(others)
    if (current?.answer === value) return
    setRows([...others, { player: target, answer: value, answered_at: new Date().toISOString(), answered_by: playerId === props.myPlayerId ? null : { id: 1, name: 'Maria' } }])
  }
  return (
    <AttendancePanel
      attendances={rows}
      myPlayerId={props.myPlayerId}
      isOpen={props.isOpen}
      notOpenYet={props.notOpenYet}
      canAnswerForOthers={props.canAnswerForOthers}
      players={players}
      myPlayer={players.find((p) => p.id === props.myPlayerId) ?? null}
      onAnswer={answer}
      error={props.error}
    />
  )
}

// The nicknames in the lists link to the players' pages, so the panel needs a router.
const meta = { component: Panel, decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>] } satisfies Meta<typeof Panel>
export default meta
type Story = StoryObj<typeof meta>

/** A player who has not answered yet. */
export const PlayerNotAnswered: Story = { args: { initial: attendances, myPlayerId: 5, isOpen: true, canAnswerForOthers: false } }
/** A player who answered ALL IN. */
export const PlayerAllIn: Story = { args: { initial: attendances, myPlayerId: 1, isOpen: true, canAnswerForOthers: false } }
/** A results keeper can also answer for someone else. */
export const ResultsKeeper: Story = { args: { initial: attendances, myPlayerId: 10, isOpen: true, canAnswerForOthers: true } }
/** No answers yet. */
export const Empty: Story = { args: { initial: [], myPlayerId: 1, isOpen: true, canAnswerForOthers: false } }
/** A scheduled night takes no answers yet. */
export const NotOpenYet: Story = { args: { initial: [], myPlayerId: 1, isOpen: false, notOpenYet: true, canAnswerForOthers: true } }
/** After the night is finished, the lists stay and answers are closed. */
export const Closed: Story = { args: { initial: attendances, myPlayerId: 1, isOpen: false, canAnswerForOthers: true } }
/** The API refused the answer. */
export const WithError: Story = { args: { initial: attendances, myPlayerId: 1, isOpen: true, canAnswerForOthers: false, error: 'As confirmações deste evento estão encerradas.' } }
