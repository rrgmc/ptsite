import { describe, expect, it } from 'vitest'
import type { Holiday } from '@/api/client'
import { holidayRule } from './holidayRule'

const base: Holiday = { id: 1, name: 'X', scope: 'national', month: null, day: null, easter_offset: null, first_year: null, last_year: null, archived: false }

describe('holidayRule', () => {
  it('describes fixed and Easter-based holidays', () => {
    expect(holidayRule({ ...base, month: 4, day: 21 })).toBe('Todo ano em 21/04')
    expect(holidayRule({ ...base, easter_offset: -2 })).toBe('2 dias antes da Páscoa')
    expect(holidayRule({ ...base, easter_offset: 60 })).toBe('60 dias depois da Páscoa')
    expect(holidayRule({ ...base, easter_offset: 1 })).toBe('1 dia depois da Páscoa')
  })

  it('adds the years when limited', () => {
    expect(holidayRule({ ...base, month: 11, day: 20, first_year: 2024 })).toBe('Todo ano em 20/11, desde 2024')
    expect(holidayRule({ ...base, month: 11, day: 20, last_year: 2023 })).toBe('Todo ano em 20/11, até 2023')
  })
})
