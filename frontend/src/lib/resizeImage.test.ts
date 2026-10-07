import { describe, expect, it } from 'vitest'
import { fitWithin } from './resizeImage'

describe('fitWithin', () => {
  it('shrinks a wide picture by its width', () => {
    // A 4000 x 3000 camera picture keeps its shape.
    expect(fitWithin({ width: 4000, height: 3000 }, 1600)).toEqual({ width: 1600, height: 1200 })
  })

  it('shrinks a tall picture by its height', () => {
    expect(fitWithin({ width: 3000, height: 4000 }, 1600)).toEqual({ width: 1200, height: 1600 })
  })

  it('keeps the size of a picture that already fits', () => {
    expect(fitWithin({ width: 206, height: 274 }, 1600)).toEqual({ width: 206, height: 274 })
  })
})
