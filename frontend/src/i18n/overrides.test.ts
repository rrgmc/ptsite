import { describe, expect, it } from 'vitest'
import * as en from './en'
import { fill, withOverrides } from './overrides'
import * as ptBR from './pt-BR'

const catalogue = {
  save: 'Salvar',
  nights: {
    pot: 'Pote',
    title: ({ date }: { date: string }) => `Evento de ${date}`,
  },
}

describe('a site\'s own wording', () => {
  it('replaces single texts and leaves the others', () => {
    const t = withOverrides(catalogue, { nights: { pot: 'Prêmio' } })
    expect(t.nights.pot).toBe('Prêmio')
    expect(t.save).toBe('Salvar')
    expect(t.nights.title({ date: '14/03' })).toBe('Evento de 14/03')
  })

  it('fills the values of a text that has them', () => {
    const t = withOverrides(catalogue, { nights: { title: 'Noite de {date}' } })
    expect(t.nights.title({ date: '14/03' })).toBe('Noite de 14/03')
  })

  it('does not change the catalogue it was given', () => {
    withOverrides(catalogue, { save: 'Gravar' })
    expect(catalogue.save).toBe('Salvar')
  })

  it.each([
    [{ sav: 'Gravar' }, 'there is no text named "sav"'],
    [{ nights: { pott: 'Prêmio' } }, 'there is no text named "nights.pott"'],
    [{ save: { again: 'Gravar' } }, '"save" is one text, not a group of texts'],
    [{ nights: 'Noites' }, '"nights" is a group of texts, not one text'],
  ])('refuses %j', (overrides, message) => {
    expect(() => withOverrides(catalogue, overrides)).toThrow(message)
  })

  it('leaves a name with no value as written', () => {
    expect(fill('{a} e {b}', { a: 1 })).toBe('1 e {b}')
  })
})

/** Every text's path with its kind: "auth.logIn: string". */
function shape(group: object, path = ''): string[] {
  return Object.entries(group).flatMap(([key, value]) =>
    typeof value === 'object' ? shape(value, `${path}${key}.`) : [`${path}${key}: ${typeof value}`],
  ).sort()
}

describe('the catalogues', () => {
  it('have the same texts in every language', () => {
    expect(shape(en)).toEqual(shape(ptBR))
  })
})
