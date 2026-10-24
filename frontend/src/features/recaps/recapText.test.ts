import { describe, expect, it } from 'vitest'
import { markNames, splitRecap } from './recapText'

// The names are the invented players of src/mocks/data.ts.

describe('splitRecap', () => {
  it('takes the first line as the title and the rest as the text', () => {
    expect(splitRecap('🏠 Rodada 7\n\nA Ana venceu.\nO Breno fez 2º.\n')).toEqual({ title: '🏠 Rodada 7', text: 'A Ana venceu.\nO Breno fez 2º.' })
  })

  it('gives a recap of one line no text', () => {
    expect(splitRecap('Só o título')).toEqual({ title: 'Só o título', text: '' })
  })
})

describe('markNames', () => {
  const names = (text: string, nicknames: string[]) => markNames(text, nicknames).filter((s) => s.name).map((s) => s.text)

  it('marks each nickname in the text, keeping the rest as it is', () => {
    const segments = markNames('A Ana venceu e o Breno fez 2º.', ['Ana', 'Breno'])
    expect(segments.map((s) => s.text).join('')).toBe('A Ana venceu e o Breno fez 2º.')
    expect(names('A Ana venceu e o Breno fez 2º.', ['Ana', 'Breno'])).toEqual(['Ana', 'Breno'])
  })

  it('marks only whole words, accents included', () => {
    expect(names('Liana, Lias e Lia.', ['Lia'])).toEqual(['Lia'])
    expect(names('Zé e Zéca', ['Zé'])).toEqual(['Zé'])
  })

  it('prefers the longer nickname', () => {
    expect(names('O Dudu Neto venceu', ['Dudu', 'Dudu Neto'])).toEqual(['Dudu Neto'])
    expect(names('Ana Paula e Ana', ['Ana', 'Ana Paula'])).toEqual(['Ana Paula', 'Ana'])
  })

  it('marks nothing without nicknames', () => {
    expect(markNames('Texto.', [])).toEqual([{ text: 'Texto.', name: false }])
  })
})
