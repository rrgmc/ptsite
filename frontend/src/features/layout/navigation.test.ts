import { afterEach, expect, it } from 'vitest'
import { overrideFeatures } from '@/lib/features'
import { isAlsoActive, navItemsFor } from './navigation'

let restore = () => {}
afterEach(() => restore())

const paths = (role: string) => navItemsFor(role).map((item) => item.to)
const bar = (flag: 'tab' | 'top') => navItemsFor('player').filter((item) => item[flag]).map((item) => item.to)

it('has "Meu perfil" on both bars, the last one, and the simulator only in the left menu', () => {
  restore = overrideFeatures({ seasonRecaps: true })
  expect(bar('tab')).toEqual(['/', '/results', '/calendar', '/players', '/profile'])
  expect(bar('top')).toEqual(['/', '/results', '/recaps', '/calendar', '/statistics/all', '/players', '/seasons', '/profile'])
  expect(paths('player')).toContain('/simulator')
})

it('keeps the screens of a season together, before "Jogadores" and "Temporadas"', () => {
  restore = overrideFeatures({ mainEvent: true, seasonRecaps: true })
  expect(paths('player')).toEqual(['/', '/results', '/recaps', '/calendar', '/simulator', '/main-event', '/statistics/all', '/players', '/seasons', '/profile'])
})

it('lists "Main Event" only on a site that has it', () => {
  restore = overrideFeatures({ mainEvent: false })
  expect(paths('player')).not.toContain('/main-event')

  restore()
  restore = overrideFeatures({ mainEvent: true })
  expect(paths('player')).toContain('/main-event')
})

it('opens "Estatísticas" on "Geral", and marks it on "Temporada" too, in any season', () => {
  const statistics = navItemsFor('player').find((item) => item.to === '/statistics/all')!
  expect(isAlsoActive(statistics, '/statistics')).toBe(true)
  expect(isAlsoActive(statistics, '/seasons/7/statistics')).toBe(true)
  expect(isAlsoActive(statistics, '/results')).toBe(false)
  expect(isAlsoActive(navItemsFor('player')[0], '/statistics')).toBe(false)
})

it('lists "Crônicas" after "Resultados", only on a site that has recaps', () => {
  restore = overrideFeatures({ seasonRecaps: false })
  expect(paths('player')).not.toContain('/recaps')

  restore()
  restore = overrideFeatures({ seasonRecaps: true })
  expect(paths('player').slice(0, 3)).toEqual(['/', '/results', '/recaps'])
})

it('lists the admin section only for an admin', () => {
  expect(paths('player')).not.toContain('/admin')
  expect(paths('admin')).toContain('/admin')
})
