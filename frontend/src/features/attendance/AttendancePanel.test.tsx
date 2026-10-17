import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { attendances, players } from '@/mocks/data'
import { AttendancePanel } from './AttendancePanel'

// The lists of who is coming and who folded (docs/specs/attendance.md, rule 6 and the "Closed" example).

function panel(compact: boolean) {
  render(
    <MemoryRouter>
      <AttendancePanel attendances={attendances} myPlayerId={1} isOpen={!compact} canAnswerForOthers={false} players={players} onAnswer={vi.fn()} compact={compact} />
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('AttendancePanel', () => {
  it('heads the ALL IN list "Vão jogar" while the night is open', () => {
    panel(false)
    expect(screen.getByRole('heading', { name: 'Vão jogar (3)' })).toBeInTheDocument()
  })

  it('heads it "Jogaram" once the night is finished', () => {
    panel(true)
    expect(screen.getByRole('heading', { name: 'Jogaram (3)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fold (1)' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^Vão jogar/ })).not.toBeInTheDocument()
  })
})
