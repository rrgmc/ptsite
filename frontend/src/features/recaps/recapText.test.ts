import { describe, expect, it } from 'vitest'
import { markNames, splitRecap } from './recapText'

describe('splitRecap', () => {
  it('takes the first line as the title and the rest as the text', () => {
    expect(splitRecap('🏠 Rodada 7\n\nO Tic venceu.\nO Lincoln fez 2º.\n')).toEqual({ title: '🏠 Rodada 7', text: 'O Tic venceu.\nO Lincoln fez 2º.' })
  })

  it('gives a recap of one line no text', () => {
    expect(splitRecap('Só o título')).toEqual({ title: 'Só o título', text: '' })
  })
})

describe('markNames', () => {
  const names = (text: string, nicknames: string[]) => markNames(text, nicknames).filter((s) => s.name).map((s) => s.text)

  it('marks each nickname in the text, keeping the rest as it is', () => {
    const segments = markNames('O Tic venceu e o Lincoln fez 2º.', ['Tic', 'Lincoln'])
    expect(segments.map((s) => s.text).join('')).toBe('O Tic venceu e o Lincoln fez 2º.')
    expect(names('O Tic venceu e o Lincoln fez 2º.', ['Tic', 'Lincoln'])).toEqual(['Tic', 'Lincoln'])
  })

  it('marks only whole words, accents included', () => {
    expect(names('Ticket, Tico e Tic.', ['Tic'])).toEqual(['Tic'])
    expect(names('Zé e Zéca', ['Zé'])).toEqual(['Zé'])
  })

  it('prefers the longer nickname', () => {
    expect(names('O Renatão venceu', ['Renato', 'Renatão'])).toEqual(['Renatão'])
    expect(names('Ana Paula e Ana', ['Ana', 'Ana Paula'])).toEqual(['Ana Paula', 'Ana'])
  })

  it('marks nothing without nicknames', () => {
    expect(markNames('Texto.', [])).toEqual([{ text: 'Texto.', name: false }])
  })
})
