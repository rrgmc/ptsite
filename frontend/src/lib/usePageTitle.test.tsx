import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PageHeader } from '@/components/Card'
import { usePageTitle } from './usePageTitle'

function Screen({ name }: { name?: string }) {
  usePageTitle(name)
  return null
}

afterEach(cleanup)

describe('usePageTitle', () => {
  it('names the screen before the site', () => {
    render(<Screen name="Resultados" />)
    expect(document.title).toBe('Resultados · Liga Demo')
  })

  it('follows the name when it changes', () => {
    const { rerender } = render(<Screen name="Resultados" />)
    rerender(<Screen name="Calendário" />)
    expect(document.title).toBe('Calendário · Liga Demo')
  })

  it('shows the site alone for a screen with no name', () => {
    render(<Screen />)
    expect(document.title).toBe('Liga Demo')
  })

  it('returns to the site alone when the screen goes away', () => {
    const { unmount } = render(<Screen name="Resultados" />)
    unmount()
    expect(document.title).toBe('Liga Demo')
  })

  it('is set by the page header', () => {
    render(<PageHeader title="Classificação" subtitle="2026" />)
    expect(document.title).toBe('Classificação · Liga Demo')
  })
})
