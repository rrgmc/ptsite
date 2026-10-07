import { afterEach, describe, expect, it } from 'vitest'
import { overrideFeatures } from '@/lib/features'
import { amountRows } from './amounts'

const amounts = { pot: '840.00', mainEventPot: '170.00', timeChip: '25.00' }
let restore = () => {}
afterEach(() => restore())

describe('amountRows', () => {
  it('lists the pot, the Main Event pot and the time chip', () => {
    expect(amountRows(amounts).map(([, amount]) => amount)).toEqual(['840.00', '170.00', '25.00'])
  })

  it('leaves out an amount the site does not have', () => {
    restore = overrideFeatures({ mainEventPot: false })
    expect(amountRows(amounts).map(([, amount]) => amount)).toEqual(['840.00', '25.00'])

    restore()
    restore = overrideFeatures({ mainEventPot: false, timeChip: false })
    expect(amountRows(amounts).map(([, amount]) => amount)).toEqual(['840.00'])
  })
})
