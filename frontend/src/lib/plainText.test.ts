import { describe, expect, it } from 'vitest'
import { plainText } from './plainText'

describe('plainText', () => {
  it('reads the text of an imported description', () => {
    expect(plainText('<p>&nbsp;Liga - 07/26</p>')).toBe('Liga - 07/26')
    expect(plainText('<p>&nbsp;Liga - 06/26</p>\r\n<p>&nbsp;</p>')).toBe('Liga - 06/26')
  })

  it('keeps paragraphs and line breaks as lines', () => {
    expect(plainText('<p>Mesa paralela</p><p>Tragam a bebida<br>e o gelo</p>')).toBe('Mesa paralela\nTragam a bebida\ne o gelo')
  })

  it('leaves plain text as it is', () => {
    expect(plainText('Noite de pizza\nR$ 50 & bebida')).toBe('Noite de pizza\nR$ 50 & bebida')
  })

  it('is empty for no description, or one with no text', () => {
    expect(plainText(null)).toBe('')
    expect(plainText('<p>&nbsp;</p>')).toBe('')
  })
})
