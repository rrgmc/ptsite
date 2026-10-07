import { Fragment, type ReactNode } from 'react'

/**
 * A text with elements inside it: rich('Enviamos um link para {email}.', { email: <strong>{email}</strong> }).
 * The text stays one sentence in the catalogue, so a translator can move the name to where the language wants
 * it. A name with no value stays as written.
 */
export function rich(text: string, values: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1]
    return <Fragment key={i}>{name !== undefined && name in values ? values[name] : part}</Fragment>
  })
}
