import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { recaps } from '@/mocks/data'
import { SeasonRecapCard } from './SeasonRecapCard'

// "Crônica da temporada" (docs/specs/season-recaps.md, rule 4).

afterEach(cleanup)

describe('SeasonRecapCard', () => {
  it('shows the newest recap with its night, and the older ones only when asked', async () => {
    render(<SeasonRecapCard recaps={recaps} />)

    expect(screen.getByText('Depois do evento de 11/04/2026')).toBeInTheDocument()
    expect(screen.getByText(/Ana não deu chance/)).toBeInTheDocument()
    expect(screen.queryByText(/Começa a temporada/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Crônicas anteriores (1)' }))
    expect(screen.getByText(/Começa a temporada/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Esconder crônicas anteriores' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('marks a draft', () => {
    render(<SeasonRecapCard recaps={[{ ...recaps[1], published: false, published_at: null }]} />)

    expect(screen.getByText('Rascunho')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows nothing without a recap', () => {
    const { container } = render(<SeasonRecapCard recaps={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
