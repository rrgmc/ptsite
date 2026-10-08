import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { overrideFeatures } from '@/lib/features'
import { SettingsAdmin } from './SettingsAdmin'

let restore = () => {}
afterEach(() => {
  cleanup()
  restore()
})

const feature = (name: string) => within(screen.getByText(name).closest('li')!)

it('lists every feature with whether the site has it', () => {
  restore = overrideFeatures({ timeChip: false })
  render(<SettingsAdmin />)
  expect(screen.getAllByRole('listitem')).toHaveLength(5)
  expect(feature('Pote ME').getByText('Ligado')).toBeDefined()
  expect(feature('Time chip').getByText('Desligado')).toBeDefined()
})

it("shows the site's version and the core's", () => {
  render(<SettingsAdmin version="v3.0.0+ptsite.v1.8.0" />)
  expect(screen.getByText('Versão do site').nextElementSibling).toHaveTextContent('v3.0.0')
  expect(screen.getByText('Versão do PTSite').nextElementSibling).toHaveTextContent('v1.8.0')
})

it("shows one version in the core's own build", () => {
  render(<SettingsAdmin version="v1.8.0" />)
  expect(screen.getByText('Versão', { selector: 'dt' }).nextElementSibling).toHaveTextContent('v1.8.0')
  expect(screen.queryByText('Versão do PTSite')).toBeNull()
})
