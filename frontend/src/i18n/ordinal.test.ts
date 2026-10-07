import { describe, expect, it } from 'vitest'
import { common as en } from './en/common'
import { common as ptBR } from './pt-BR/common'

describe('a place in an order', () => {
  it('is written with the ordinal sign in Portuguese', () => {
    expect([1, 2, 6, 11].map((position) => ptBR.ordinal({ position }))).toEqual(['1º', '2º', '6º', '11º'])
  })

  it('is written with its ending in English', () => {
    const written = [1, 2, 3, 4, 10, 11, 12, 13, 21, 22, 23, 101, 111].map((position) => en.ordinal({ position }))
    expect(written).toEqual(['1st', '2nd', '3rd', '4th', '10th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st', '111th'])
  })
})
