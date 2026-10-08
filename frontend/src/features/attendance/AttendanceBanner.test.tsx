import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { overrideFeatures } from '@/lib/features'
import { openMainEventNight, openNight } from '@/mocks/data'
import { type Answer } from './AttendancePanel'
import { AttendanceBanner } from './AttendanceBanner'

// The banner above "Classificação" and "Resultados" (docs/specs/attendance.md, rule 8 and the "Banner" example).

function banner(answer: Answer | null, error?: string, night = openNight) {
  const onAnswer = vi.fn()
  render(
    <MemoryRouter>
      <AttendanceBanner night={night} answer={answer} onAnswer={onAnswer} error={error} />
    </MemoryRouter>,
  )
  return onAnswer
}

afterEach(cleanup)

describe('AttendanceBanner', () => {
  it('names the open night and links to its page', () => {
    banner(null)
    expect(screen.getByRole('complementary', { name: 'Evento aberto' })).toHaveTextContent('Evento aberto: Sábado, 18/04 · Casa do Breno')
    expect(screen.getByRole('link', { name: 'Evento aberto: Sábado, 18/04' })).toHaveAttribute('href', '/nights/11')
  })

  it('offers ALL IN and FOLD to a player who has not answered', async () => {
    const onAnswer = banner(null)
    expect(screen.getByText('Confirme sua presença')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'ALL IN' }))
    expect(onAnswer).toHaveBeenLastCalledWith('all_in')
    await userEvent.click(screen.getByRole('button', { name: 'FOLD' }))
    expect(onAnswer).toHaveBeenLastCalledWith('fold')
  })

  it.each([['all_in', 'Você: ALL IN'], ['fold', 'Você: FOLD']] as const)('shows the answer %s without buttons, with the way to change it', (answer, text) => {
    banner(answer)
    expect(screen.getByRole('complementary')).toHaveTextContent(text)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Alterar' })).toHaveAttribute('href', '/nights/11')
  })

  it('shows the message when the API refuses the answer', () => {
    banner(null, 'As confirmações deste evento estão encerradas.')
    expect(screen.getByRole('alert')).toHaveTextContent('As confirmações deste evento estão encerradas.')
  })

  it('leads to the night dashboard of a regular night, on a site that has it', () => {
    const restore = overrideFeatures({ nightDashboard: true })
    banner('all_in')
    expect(screen.getByRole('link', { name: 'Painel do evento' })).toHaveAttribute('href', '/nights/11/dashboard')
    cleanup()

    banner('all_in', undefined, openMainEventNight)
    expect(screen.queryByRole('link', { name: 'Painel do evento' })).not.toBeInTheDocument()
    restore()
    cleanup()

    const off = overrideFeatures({ nightDashboard: false })
    banner('all_in')
    expect(screen.queryByRole('link', { name: 'Painel do evento' })).not.toBeInTheDocument()
    off()
  })
})
