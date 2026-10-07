import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SiteFooter } from './SiteFooter'

afterEach(cleanup)

describe('SiteFooter', () => {
  it('shows the version the build was given', () => {
    render(<SiteFooter />)
    expect(__APP_VERSION__).not.toBe('')
    expect(screen.getByRole('contentinfo')).toHaveTextContent(`Liga Demo ${__APP_VERSION__}`)
  })

  it('shows a release version', () => {
    render(<SiteFooter version="v2.1.0" />)
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Liga Demo v2.1.0')
  })
})
