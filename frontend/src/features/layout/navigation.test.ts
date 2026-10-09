import { afterEach, expect, it } from 'vitest'
import { overrideFeatures } from '@/lib/features'
import { navItemsFor } from './navigation'

let restore = () => {}
afterEach(() => restore())

const paths = (role: string) => navItemsFor(role).map((item) => item.to)
const bar = (flag: 'tab' | 'top') => navItemsFor('player').filter((item) => item[flag]).map((item) => item.to)

it('has "Meu perfil" on both bars, the last one, and the simulator only in the left menu', () => {
  expect(bar('tab')).toEqual(['/', '/results', '/calendar', '/players', '/profile'])
  expect(bar('top')).toEqual(['/', '/results', '/calendar', '/statistics', '/players', '/seasons', '/profile'])
  expect(paths('player')).toContain('/simulator')
})

it('keeps the screens of a season together, before "Jogadores" and "Temporadas"', () => {
  restore = overrideFeatures({ mainEvent: true })
  expect(paths('player')).toEqual(['/', '/results', '/calendar', '/simulator', '/main-event', '/statistics', '/players', '/seasons', '/profile'])
})

it('lists "Main Event" only on a site that has it', () => {
  restore = overrideFeatures({ mainEvent: false })
  expect(paths('player')).not.toContain('/main-event')

  restore()
  restore = overrideFeatures({ mainEvent: true })
  expect(paths('player')).toContain('/main-event')
})

it('lists the admin section only for an admin', () => {
  expect(paths('player')).not.toContain('/admin')
  expect(paths('admin')).toContain('/admin')
})
